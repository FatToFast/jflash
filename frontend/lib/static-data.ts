/**
 * Static Data Provider
 *
 * 하이브리드 저장소 (간단 버전):
 * - localStorage: 항상 사용 (오프라인 지원)
 * - Supabase: 설정 시 자동 동기화 (로그인 불필요)
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

// LocalStorage Keys
const SRS_STORAGE_KEY = "jflash_srs_state";
const LAST_SYNC_KEY = "jflash_last_sync";

// Cache
let vocabCache: VocabItem[] | null = null;
let grammarCache: GrammarItem[] | null = null;

/**
 * Load vocabulary from static JSON
 */
export async function loadVocabulary(): Promise<VocabItem[]> {
  if (vocabCache) return vocabCache;
  const response = await fetch("/data/vocabulary.json");
  vocabCache = await response.json();
  return vocabCache!;
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

/**
 * Get cards due for review
 */
export async function getDueCards(): Promise<VocabItem[]> {
  const vocab = await loadVocabulary();
  const states = getSRSStates();
  const today = new Date().toISOString().split("T")[0];

  return vocab.filter((item) => {
    const state = states[item.id];
    if (!state) return true;
    return state.next_review.split("T")[0] <= today;
  });
}

/**
 * Get new cards (never reviewed)
 */
export async function getNewCards(limit: number = 10): Promise<VocabItem[]> {
  const vocab = await loadVocabulary();
  const states = getSRSStates();
  return vocab.filter((item) => !states[item.id]).slice(0, limit);
}

/**
 * Get statistics
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
 * Clear all SRS data
 */
export function clearSRSData(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SRS_STORAGE_KEY);
  localStorage.removeItem(LAST_SYNC_KEY);
}
