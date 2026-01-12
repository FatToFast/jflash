/**
 * Static Data Provider
 *
 * 하이브리드 저장소 (간단 버전):
 * - localStorage: 항상 사용 (오프라인 지원)
 * - Supabase: 설정 시 자동 동기화 (로그인 불필요)
 *
 * 파일 구조:
 * - words.json: 학습 중인 단어
 * - sentences.json: 학습 중인 문장
 * - mastered/N5.json ~ N1.json, unknown.json: 마스터된 항목 (JLPT 레벨별)
 *
 * SRS 알고리즘: FSRS (Free Spaced Repetition Scheduler)
 * - SM-2 대체 (2024년~)
 * - Ebbinghaus 망각곡선 기반 과학적 복습 간격
 */

import {
  isSupabaseEnabled,
  getDeviceId,
  fetchFromCloud,
  saveToCloud,
} from "./supabase";

import {
  FSRSState,
  getFSRSStates,
  saveFSRSState,
  saveAllFSRSStates,
  initFSRSState,
  updateFSRSByQuality,
  isDue,
  isMastered,
  getFSRSStats,
  migrateAllFromSM2,
  migrateSM2ToFSRS,
  clearFSRSData,
  Rating,
  qualityToRating,
} from "./fsrs";

// Types
export interface VocabItem {
  id: number;
  kanji: string;
  reading: string | null;
  meaning: string | null;
  pos: string | null;
  jlpt_level: string | null;
  example_sentence: string | null;
  example_meaning: string | null;
  notes?: string;
}

export interface GrammarItem {
  id: number;
  title: string;
  explanation: string | null;
  example_jp: string | null;
  example_kr: string | null;
  level: string | null;
}

/**
 * SRS State Interface
 * FSRS 기반으로 변경됨 (SM-2 대체)
 * 호환성을 위해 기존 필드도 유지
 */
export interface SRSState {
  vocab_id: number;
  // FSRS 필드 (기본)
  due: string; // 다음 복습일 (ISO string)
  stability: number; // 기억 안정성 (일수)
  difficulty: number; // 난이도 (1-10)
  reps: number; // 복습 횟수
  lapses: number; // 실패 횟수
  state: number; // FSRS State enum
  // 호환성 필드 (레거시)
  interval: number; // scheduled_days와 동일
  ease_factor: number; // deprecated, 호환성용
  next_review: string; // due와 동일
}

/**
 * FSRSState를 SRSState로 변환 (호환성 레이어)
 */
function fsrsToSRSState(fsrs: FSRSState): SRSState {
  return {
    vocab_id: fsrs.vocab_id,
    due: fsrs.due,
    stability: fsrs.stability,
    difficulty: fsrs.difficulty,
    reps: fsrs.reps,
    lapses: fsrs.lapses,
    state: fsrs.state,
    // 레거시 호환성
    interval: fsrs.scheduled_days,
    ease_factor: 2.5, // 기본값 (더 이상 사용되지 않음)
    next_review: fsrs.due,
  };
}

/**
 * FSRSState를 Supabase용 레거시 형식으로 변환
 */
function fsrsToSupabaseFormat(fsrs: FSRSState): {
  vocab_id: number;
  interval: number;
  ease_factor: number;
  next_review: string;
  reps: number;
} {
  return {
    vocab_id: fsrs.vocab_id,
    interval: fsrs.scheduled_days,
    ease_factor: 2.5,
    next_review: fsrs.due,
    reps: fsrs.reps,
  };
}

export type VocabType = "word" | "sentence";
export type JlptLevel = "N5" | "N4" | "N3" | "N2" | "N1" | "unknown";

// LocalStorage Keys
const LAST_SYNC_KEY = "jflash_last_sync";
// SM-2 키는 마이그레이션 후 삭제됨
const LEGACY_SRS_STORAGE_KEY = "jflash_srs_state";

// Cache
let wordsCache: VocabItem[] | null = null;
let sentencesCache: VocabItem[] | null = null;
let masteredCache: Record<JlptLevel, VocabItem[]> = {
  N5: [],
  N4: [],
  N3: [],
  N2: [],
  N1: [],
  unknown: [],
};
let masteredLoaded = false;
let grammarCache: GrammarItem[] | null = null;

const JLPT_LEVELS: JlptLevel[] = ["N5", "N4", "N3", "N2", "N1", "unknown"];

// Supabase vocabulary cache
let supabaseVocabCache: VocabItem[] | null = null;
let supabaseVocabLoaded = false;

// ============================================
// Supabase Vocabulary Loaders (Optional)
// ============================================

/**
 * Load all vocabulary from Supabase
 * Falls back to JSON files if Supabase fails
 */
export async function loadVocabFromSupabase(): Promise<VocabItem[]> {
  if (supabaseVocabLoaded && supabaseVocabCache) {
    return supabaseVocabCache;
  }

  if (!isSupabaseEnabled()) {
    return loadAllVocabulary();
  }

  try {
    const { supabase } = await import("./supabase");
    if (!supabase) {
      return loadAllVocabulary();
    }

    const { data, error } = await supabase
      .from("vocabulary")
      .select("*")
      .order("id");

    if (error) {
      console.warn("Supabase vocab fetch failed, using JSON:", error.message);
      return loadAllVocabulary();
    }

    supabaseVocabCache = data || [];
    supabaseVocabLoaded = true;
    return supabaseVocabCache;
  } catch (err) {
    console.warn("Supabase vocab error, using JSON:", err);
    return loadAllVocabulary();
  }
}

/**
 * Load active vocabulary from Supabase (status = 'active')
 */
export async function loadActiveFromSupabase(): Promise<VocabItem[]> {
  const vocab = await loadVocabFromSupabase();
  // If loaded from Supabase, filter by status
  // If fallback to JSON, all items are considered active
  return vocab.filter((v) => (v as { status?: string }).status !== "mastered");
}

/**
 * Load mastered vocabulary from Supabase (status = 'mastered')
 */
export async function loadMasteredFromSupabase(): Promise<VocabItem[]> {
  const vocab = await loadVocabFromSupabase();
  return vocab.filter((v) => (v as { status?: string }).status === "mastered");
}

/**
 * Clear Supabase vocabulary cache
 */
export function clearSupabaseVocabCache(): void {
  supabaseVocabCache = null;
  supabaseVocabLoaded = false;
}

// ============================================
// Data Loaders (JSON - Default)
// ============================================

/**
 * Load active words from static JSON
 */
export async function loadWords(): Promise<VocabItem[]> {
  if (wordsCache) return wordsCache;
  try {
    const response = await fetch("/data/words.json");
    if (!response.ok) return [];
    wordsCache = await response.json();
    return wordsCache!;
  } catch {
    return [];
  }
}

/**
 * Load active sentences from static JSON
 */
export async function loadSentences(): Promise<VocabItem[]> {
  if (sentencesCache) return sentencesCache;
  try {
    const response = await fetch("/data/sentences.json");
    if (!response.ok) return [];
    sentencesCache = await response.json();
    return sentencesCache!;
  } catch {
    return [];
  }
}

/**
 * Load mastered items for a specific JLPT level
 */
export async function loadMastered(level: JlptLevel): Promise<VocabItem[]> {
  if (masteredLoaded) return masteredCache[level];
  await loadAllMastered();
  return masteredCache[level];
}

/**
 * Load all mastered items from all JLPT level files
 */
export async function loadAllMastered(): Promise<VocabItem[]> {
  if (masteredLoaded) {
    return Object.values(masteredCache).flat();
  }

  const promises = JLPT_LEVELS.map(async (level) => {
    try {
      const response = await fetch(`/data/mastered/${level}.json`);
      if (!response.ok) return [];
      const data = await response.json();
      masteredCache[level] = data;
      return data;
    } catch {
      return [];
    }
  });

  const results = await Promise.all(promises);
  masteredLoaded = true;
  return results.flat();
}

/**
 * Load all words (active + mastered)
 */
export async function loadAllWords(): Promise<VocabItem[]> {
  const [active, mastered] = await Promise.all([
    loadWords(),
    loadAllMastered(),
  ]);
  const masteredWords = mastered.filter((item) => item.pos !== "文");
  return [...active, ...masteredWords];
}

/**
 * Load all sentences (active + mastered)
 */
export async function loadAllSentences(): Promise<VocabItem[]> {
  const [active, mastered] = await Promise.all([
    loadSentences(),
    loadAllMastered(),
  ]);
  const masteredSentences = mastered.filter((item) => item.pos === "文");
  return [...active, ...masteredSentences];
}

/**
 * Load all vocabulary (words + sentences + mastered)
 */
export async function loadAllVocabulary(): Promise<VocabItem[]> {
  const [words, sentences, mastered] = await Promise.all([
    loadWords(),
    loadSentences(),
    loadAllMastered(),
  ]);
  return [...words, ...sentences, ...mastered];
}

/**
 * @deprecated Use loadWords(), loadSentences(), or loadAllVocabulary() instead
 * Kept for backward compatibility
 */
export async function loadVocabulary(): Promise<VocabItem[]> {
  return loadAllVocabulary();
}

/**
 * Load grammar from static JSON
 */
export async function loadGrammar(): Promise<GrammarItem[]> {
  if (grammarCache) return grammarCache;
  const response = await fetch("/data/grammar.json");
  grammarCache = await response.json();
  return grammarCache!;
}

// ============================================
// SRS State Management (FSRS 기반)
// ============================================

/**
 * Get SRS states from localStorage (FSRS 래퍼)
 */
export function getSRSStates(): Record<number, SRSState> {
  const fsrsStates = getFSRSStates();
  const result: Record<number, SRSState> = {};
  for (const [id, fsrs] of Object.entries(fsrsStates)) {
    result[parseInt(id)] = fsrsToSRSState(fsrs);
  }
  return result;
}

/**
 * Save single SRS state (FSRS 래퍼)
 * @deprecated FSRS를 직접 사용하세요
 */
export function saveSRSState(vocabId: number, state: SRSState): void {
  // FSRS 상태로 변환하여 저장
  const fsrsState: FSRSState = {
    vocab_id: state.vocab_id,
    due: state.due || state.next_review,
    stability: state.stability || state.interval,
    difficulty: state.difficulty || 5,
    elapsed_days: 0,
    scheduled_days: state.interval,
    learning_steps: 0,
    reps: state.reps,
    lapses: state.lapses || 0,
    state: state.state || 0,
    last_review: null,
  };
  saveFSRSState(vocabId, fsrsState);
}

/**
 * Initialize SRS state for a vocab item (FSRS 래퍼)
 */
export function initSRSState(vocabId: number): SRSState {
  const fsrsState = initFSRSState(vocabId);
  return fsrsToSRSState(fsrsState);
}

/**
 * FSRS Algorithm: Update SRS state
 *
 * SM-2의 quality (0-5) 입력을 FSRS Rating으로 변환하여 처리
 * - quality < 2 → Again (틀림)
 * - quality = 2 → Hard (어려움)
 * - quality = 3 → Good (적당함)
 * - quality >= 4 → Easy (쉬움)
 */
export async function updateSRS(
  vocabId: number,
  quality: number
): Promise<SRSState> {
  // FSRS 알고리즘으로 업데이트
  const fsrsState = updateFSRSByQuality(vocabId, quality);
  const srsState = fsrsToSRSState(fsrsState);

  // Sync to cloud (non-blocking)
  if (isSupabaseEnabled()) {
    const deviceId = getDeviceId();
    // 클라우드 동기화 (FSRS 형식으로)
    try {
      const { saveSingleRecord } = await import("./supabase");
      saveSingleRecord(deviceId, srsState).catch(console.error);
    } catch {
      // Supabase 모듈 로드 실패 무시
    }
  }

  return srsState;
}

/**
 * 앱 시작 시 SM-2 → FSRS 마이그레이션 실행
 * 한 번만 실행됨 (이미 마이그레이션된 데이터는 스킵)
 */
export function runMigrationIfNeeded(): { migrated: number; skipped: number } {
  return migrateAllFromSM2();
}

/**
 * FSRS 데이터를 Supabase 레거시 형식으로 변환
 */
function convertToSupabaseFormat(
  fsrsStates: Record<number, FSRSState>
): Record<number, { vocab_id: number; interval: number; ease_factor: number; next_review: string; reps: number }> {
  const result: Record<number, { vocab_id: number; interval: number; ease_factor: number; next_review: string; reps: number }> = {};
  for (const [id, fsrs] of Object.entries(fsrsStates)) {
    result[parseInt(id)] = fsrsToSupabaseFormat(fsrs);
  }
  return result;
}

/**
 * Sync with cloud (full sync)
 * 클라우드는 레거시 형식 유지 (Supabase 스키마 호환)
 * 로컬은 FSRS 형식 사용
 */
export async function syncWithCloud(): Promise<{
  success: boolean;
  message: string;
}> {
  if (!isSupabaseEnabled()) {
    return { success: false, message: "Supabase 미설정" };
  }

  try {
    const deviceId = getDeviceId();
    const cloudData = await fetchFromCloud(deviceId);
    const localFSRS = getFSRSStates();

    if (cloudData && Object.keys(cloudData).length > 0) {
      // Merge: prefer more progress (더 높은 stability 기준)
      const merged = { ...localFSRS };
      for (const [id, cloud] of Object.entries(cloudData)) {
        const vocabId = parseInt(id);
        const local = localFSRS[vocabId];

        // 클라우드 데이터를 FSRS 형식으로 변환
        const cloudFSRS = migrateSM2ToFSRS({
          vocab_id: cloud.vocab_id,
          interval: cloud.interval,
          ease_factor: cloud.ease_factor,
          next_review: cloud.next_review,
          reps: cloud.reps,
        });

        if (!local || cloudFSRS.stability > local.stability) {
          merged[vocabId] = cloudFSRS;
        }
      }
      saveAllFSRSStates(merged);
      // 레거시 형식으로 변환하여 클라우드에 저장
      await saveToCloud(deviceId, convertToSupabaseFormat(merged));
    } else {
      // No cloud data, upload local (레거시 형식으로 변환)
      await saveToCloud(deviceId, convertToSupabaseFormat(localFSRS));
    }

    localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
    return { success: true, message: "동기화 완료!" };
  } catch (err) {
    console.error("Sync error:", err);
    return { success: false, message: "동기화 실패" };
  }
}

/**
 * Get last sync time
 */
export function getLastSyncTime(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(LAST_SYNC_KEY);
}

// ============================================
// Card Selection
// ============================================

/**
 * Get cards due for review by type
 * Includes mastered items that are due for refresh
 *
 * 버그 수정 (2025-01-12):
 * - 기존: 날짜만 비교 → 오늘 복습해도 같은 날 다시 due로 표시됨
 * - 수정: FSRS의 isDue() 함수로 정확한 시간 기반 비교
 */
export async function getDueCards(
  type: VocabType = "word"
): Promise<VocabItem[]> {
  const [active, mastered] = await Promise.all([
    type === "word" ? loadWords() : loadSentences(),
    loadAllMastered(),
  ]);

  // Filter mastered by type
  const masteredFiltered =
    type === "word"
      ? mastered.filter((item) => item.pos !== "文")
      : mastered.filter((item) => item.pos === "文");

  const allItems = [...active, ...masteredFiltered];
  const fsrsStates = getFSRSStates();

  return allItems.filter((item) => {
    const fsrsState = fsrsStates[item.id];
    if (!fsrsState) return true; // New item - include for review

    // FSRS의 isDue() 함수로 정확한 시간 기반 비교
    return isDue(fsrsState);
  });
}

/**
 * Get new cards (never reviewed) by type
 */
export async function getNewCards(
  type: VocabType = "word",
  limit: number = 10
): Promise<VocabItem[]> {
  const vocab = type === "word" ? await loadWords() : await loadSentences();
  const states = getSRSStates();
  return vocab.filter((item) => !states[item.id]).slice(0, limit);
}

// ============================================
// Statistics (FSRS 기반)
// ============================================

/**
 * Get statistics (sync version - uses only localStorage)
 *
 * 마스터 기준 변경 (FSRS):
 * - 기존: reps >= 5 (하루에 5번 맞으면 마스터)
 * - 변경: stability >= 21일 (3주 이상 기억 유지 예상)
 *
 * 이렇게 하면 에빙하우스 망각곡선에 따라 실제로 장기기억에
 * 정착된 단어만 마스터로 분류됩니다.
 */
export function getStats() {
  if (typeof window === "undefined") {
    return { total: 0, learned: 0, mastered: 0, dueToday: 0 };
  }

  // FSRS 통계 직접 사용
  const fsrsStats = getFSRSStats();

  return {
    total: fsrsStats.total,
    learned: fsrsStats.total - fsrsStats.newCards, // 한 번이라도 학습한 카드
    mastered: fsrsStats.mastered, // stability >= 21일
    dueToday: fsrsStats.dueToday,
  };
}

/**
 * Get comprehensive statistics (async - loads all files)
 */
export async function getStatsAsync(): Promise<{
  total: number;
  totalWords: number;
  totalSentences: number;
  activeWords: number;
  activeSentences: number;
  masteredCount: number;
  learned: number;
  dueToday: number;
  byLevel: Record<JlptLevel, number>;
}> {
  const [words, sentences, mastered] = await Promise.all([
    loadWords(),
    loadSentences(),
    loadAllMastered(),
  ]);

  const fsrsStates = getFSRSStates();

  let learned = 0,
    dueToday = 0;
  const byLevel: Record<JlptLevel, number> = {
    N5: 0,
    N4: 0,
    N3: 0,
    N2: 0,
    N1: 0,
    unknown: 0,
  };

  // Count mastered by level
  for (const level of JLPT_LEVELS) {
    byLevel[level] = masteredCache[level].length;
  }

  // Count from FSRS states (정확한 시간 기반 비교)
  Object.values(fsrsStates).forEach((fsrsState) => {
    if (fsrsState.reps > 0) learned++;
    if (isDue(fsrsState)) dueToday++;
  });

  const masteredWords = mastered.filter((item) => item.pos !== "文").length;
  const masteredSentences = mastered.filter((item) => item.pos === "文").length;

  return {
    total: words.length + sentences.length + mastered.length,
    totalWords: words.length + masteredWords,
    totalSentences: sentences.length + masteredSentences,
    activeWords: words.length,
    activeSentences: sentences.length,
    masteredCount: mastered.length,
    learned,
    dueToday,
    byLevel,
  };
}

/**
 * Clear all SRS data (FSRS 및 레거시 SM-2 모두)
 */
export function clearSRSData(): void {
  if (typeof window === "undefined") return;
  // FSRS 데이터 삭제
  clearFSRSData();
  // 레거시 SM-2 데이터도 삭제
  localStorage.removeItem(LEGACY_SRS_STORAGE_KEY);
  localStorage.removeItem(LAST_SYNC_KEY);
}

/**
 * Clear cache (useful for testing or forcing reload)
 */
export function clearCache(): void {
  wordsCache = null;
  sentencesCache = null;
  masteredCache = { N5: [], N4: [], N3: [], N2: [], N1: [], unknown: [] };
  masteredLoaded = false;
  grammarCache = null;
  // Clear Supabase cache too
  supabaseVocabCache = null;
  supabaseVocabLoaded = false;
}
