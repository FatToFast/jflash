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
 */

import {
  isSupabaseEnabled,
  getDeviceId,
  fetchFromCloud,
  saveToCloud,
  saveSingleRecord,
} from "./supabase";

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

export interface SRSState {
  vocab_id: number;
  interval: number;
  ease_factor: number;
  next_review: string;
  reps: number;
}

export type VocabType = "word" | "sentence";
export type JlptLevel = "N5" | "N4" | "N3" | "N2" | "N1" | "unknown";

// LocalStorage Keys
const SRS_STORAGE_KEY = "jflash_srs_state";
const LAST_SYNC_KEY = "jflash_last_sync";

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
// SRS State Management
// ============================================

/**
 * Get SRS states from localStorage
 */
export function getSRSStates(): Record<number, SRSState> {
  if (typeof window === "undefined") return {};
  const stored = localStorage.getItem(SRS_STORAGE_KEY);
  if (!stored) return {};
  try {
    return JSON.parse(stored);
  } catch {
    return {};
  }
}

/**
 * Save all SRS states to localStorage
 */
function saveAllSRSStates(states: Record<number, SRSState>): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SRS_STORAGE_KEY, JSON.stringify(states));
}

/**
 * Save single SRS state
 */
export function saveSRSState(vocabId: number, state: SRSState): void {
  if (typeof window === "undefined") return;
  const states = getSRSStates();
  states[vocabId] = state;
  localStorage.setItem(SRS_STORAGE_KEY, JSON.stringify(states));
}

/**
 * Initialize SRS state for a vocab item
 */
export function initSRSState(vocabId: number): SRSState {
  const states = getSRSStates();
  if (states[vocabId]) return states[vocabId];

  const newState: SRSState = {
    vocab_id: vocabId,
    interval: 1,
    ease_factor: 2.5,
    next_review: new Date().toISOString(),
    reps: 0,
  };
  saveSRSState(vocabId, newState);
  return newState;
}

/**
 * SM-2 Algorithm: Update SRS state
 */
export async function updateSRS(
  vocabId: number,
  quality: number
): Promise<SRSState> {
  const state = initSRSState(vocabId);

  if (quality < 2) {
    state.reps = 0;
    state.interval = 1;
    state.ease_factor = Math.max(1.3, state.ease_factor - 0.2);
  } else {
    state.reps += 1;
    if (state.reps === 1) {
      state.interval = 1;
    } else if (state.reps === 2) {
      state.interval = 3;
    } else {
      state.interval = Math.round(state.interval * state.ease_factor);
    }
    state.ease_factor = Math.max(
      1.3,
      state.ease_factor + (0.1 - (4 - quality) * (0.08 + (4 - quality) * 0.02))
    );
  }

  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + state.interval);
  state.next_review = nextDate.toISOString();

  // Save locally
  saveSRSState(vocabId, state);

  // Sync to cloud (non-blocking)
  if (isSupabaseEnabled()) {
    const deviceId = getDeviceId();
    saveSingleRecord(deviceId, state).catch(console.error);
  }

  return state;
}

/**
 * Sync with cloud (full sync)
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
    const localData = getSRSStates();

    if (cloudData && Object.keys(cloudData).length > 0) {
      // Merge: prefer more progress
      const merged = { ...localData };
      for (const [id, cloud] of Object.entries(cloudData)) {
        const vocabId = parseInt(id);
        const local = localData[vocabId];
        if (!local || cloud.reps > local.reps) {
          merged[vocabId] = cloud;
        }
      }
      saveAllSRSStates(merged);
      await saveToCloud(deviceId, merged);
    } else {
      // No cloud data, upload local
      await saveToCloud(deviceId, localData);
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
  const states = getSRSStates();
  const today = new Date().toISOString().split("T")[0];

  return allItems.filter((item) => {
    const state = states[item.id];
    if (!state) return true; // New item
    return state.next_review.split("T")[0] <= today;
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
// Statistics
// ============================================

/**
 * Get statistics (sync version - uses only localStorage)
 */
export function getStats() {
  if (typeof window === "undefined") {
    return { total: 0, learned: 0, mastered: 0, dueToday: 0 };
  }

  const states = getSRSStates();
  const today = new Date().toISOString().split("T")[0];

  let learned = 0,
    mastered = 0,
    dueToday = 0;

  Object.values(states).forEach((state) => {
    if (state.reps > 0) learned++;
    if (state.reps >= 5) mastered++;
    if (state.next_review.split("T")[0] <= today) dueToday++;
  });

  return { total: Object.keys(states).length, learned, mastered, dueToday };
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

  const states = getSRSStates();
  const today = new Date().toISOString().split("T")[0];

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

  // Count from SRS states
  Object.values(states).forEach((state) => {
    if (state.reps > 0) learned++;
    if (state.next_review.split("T")[0] <= today) dueToday++;
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
 * Clear all SRS data
 */
export function clearSRSData(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SRS_STORAGE_KEY);
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
