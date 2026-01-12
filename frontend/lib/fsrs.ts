/**
 * FSRS (Free Spaced Repetition Scheduler) Wrapper Module
 *
 * SM-2 알고리즘을 대체하는 최신 SRS 알고리즘
 * - Ebbinghaus 망각곡선 기반 과학적 복습 간격 계산
 * - Stability, Difficulty, Retrievability 모델 (DSR)
 * - 개인화된 학습 패턴 적응
 *
 * @see https://github.com/open-spaced-repetition/ts-fsrs
 */

import {
  FSRS,
  createEmptyCard,
  Rating,
  Card,
  State,
  RecordLog,
  RecordLogItem,
  Grade,
  FSRSParameters,
  generatorParameters,
} from "ts-fsrs";

// ============================================
// Types
// ============================================

/**
 * FSRS 기반 SRS 상태 인터페이스
 * ts-fsrs Card를 확장하여 vocab_id 추가
 */
export interface FSRSState {
  vocab_id: number;
  // FSRS Card fields
  due: string; // ISO string
  stability: number;
  difficulty: number;
  elapsed_days: number;
  scheduled_days: number;
  learning_steps: number; // ts-fsrs 5.x 추가 필드
  reps: number;
  lapses: number;
  state: State;
  last_review: string | null; // ISO string
}

/**
 * 복습 결과 타입
 * - again: 틀림 (다시 학습)
 * - hard: 어려웠음
 * - good: 적당함
 * - easy: 쉬움
 */
export type ReviewRating = "again" | "hard" | "good" | "easy";

/**
 * Rating 매핑
 */
const RATING_MAP: Record<ReviewRating, Rating> = {
  again: Rating.Again,
  hard: Rating.Hard,
  good: Rating.Good,
  easy: Rating.Easy,
};

/**
 * 기존 quality 점수를 FSRS Rating으로 변환
 * SM-2: 0-5 → FSRS: Again, Hard, Good, Easy
 */
export function qualityToRating(quality: number): Rating {
  if (quality < 2) return Rating.Again;
  if (quality === 2) return Rating.Hard;
  if (quality === 3) return Rating.Good;
  return Rating.Easy;
}

// ============================================
// FSRS Scheduler
// ============================================

/**
 * FSRS 파라미터 설정
 * 기본값 사용 (추후 사용자별 최적화 가능)
 */
const fsrsParams: FSRSParameters = generatorParameters({
  request_retention: 0.9, // 90% 기억률 목표
  maximum_interval: 365, // 최대 365일 간격
  enable_fuzz: true, // 간격에 약간의 랜덤성 추가 (같은 날 복습 분산)
});

/**
 * FSRS 스케줄러 인스턴스
 */
const scheduler = new FSRS(fsrsParams);

// ============================================
// State Management
// ============================================

const FSRS_STORAGE_KEY = "jflash_fsrs_state";

/**
 * 모든 FSRS 상태 가져오기
 */
export function getFSRSStates(): Record<number, FSRSState> {
  if (typeof window === "undefined") return {};
  const stored = localStorage.getItem(FSRS_STORAGE_KEY);
  if (!stored) return {};
  try {
    return JSON.parse(stored);
  } catch {
    return {};
  }
}

/**
 * FSRS 상태 저장
 */
export function saveFSRSState(vocabId: number, state: FSRSState): void {
  if (typeof window === "undefined") return;
  const states = getFSRSStates();
  states[vocabId] = state;
  localStorage.setItem(FSRS_STORAGE_KEY, JSON.stringify(states));
}

/**
 * 모든 FSRS 상태 저장
 */
export function saveAllFSRSStates(states: Record<number, FSRSState>): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(FSRS_STORAGE_KEY, JSON.stringify(states));
}

/**
 * Card를 FSRSState로 변환
 */
function cardToFSRSState(vocabId: number, card: Card): FSRSState {
  return {
    vocab_id: vocabId,
    due: card.due.toISOString(),
    stability: card.stability,
    difficulty: card.difficulty,
    elapsed_days: card.elapsed_days,
    scheduled_days: card.scheduled_days,
    learning_steps: card.learning_steps,
    reps: card.reps,
    lapses: card.lapses,
    state: card.state,
    last_review: card.last_review?.toISOString() ?? null,
  };
}

/**
 * FSRSState를 Card로 변환
 */
function fsrsStateToCard(state: FSRSState): Card {
  return {
    due: new Date(state.due),
    stability: state.stability,
    difficulty: state.difficulty,
    elapsed_days: state.elapsed_days,
    scheduled_days: state.scheduled_days,
    learning_steps: state.learning_steps ?? 0,
    reps: state.reps,
    lapses: state.lapses,
    state: state.state,
    last_review: state.last_review ? new Date(state.last_review) : undefined,
  };
}

/**
 * 새 카드 초기화
 */
export function initFSRSState(vocabId: number): FSRSState {
  const states = getFSRSStates();
  if (states[vocabId]) return states[vocabId];

  const newCard = createEmptyCard();
  const newState = cardToFSRSState(vocabId, newCard);
  saveFSRSState(vocabId, newState);
  return newState;
}

/**
 * 복습 후 상태 업데이트 (FSRS 알고리즘)
 *
 * @param vocabId - 단어 ID
 * @param rating - 복습 결과 (again, hard, good, easy)
 * @returns 업데이트된 상태
 */
export function updateFSRS(
  vocabId: number,
  rating: ReviewRating | Rating
): FSRSState {
  const currentState = initFSRSState(vocabId);
  const card = fsrsStateToCard(currentState);

  // Rating 변환 (Rating.Manual 제외)
  const fsrsRating =
    typeof rating === "string" ? RATING_MAP[rating] : rating;

  // Rating.Manual은 Grade에 포함되지 않으므로 체크
  if (fsrsRating === Rating.Manual) {
    throw new Error("Rating.Manual is not supported");
  }

  // FSRS 스케줄링 실행
  const now = new Date();
  const schedulingCards: RecordLog = scheduler.repeat(card, now);
  const result: RecordLogItem = schedulingCards[fsrsRating as Grade];

  // 새 상태 저장
  const newState = cardToFSRSState(vocabId, result.card);
  saveFSRSState(vocabId, newState);

  return newState;
}

/**
 * 기존 quality 점수 기반 업데이트 (호환성 레이어)
 * SM-2 quality (0-5)를 FSRS Rating으로 변환
 */
export function updateFSRSByQuality(
  vocabId: number,
  quality: number
): FSRSState {
  const rating = qualityToRating(quality);
  return updateFSRS(vocabId, rating);
}

// ============================================
// Query Functions
// ============================================

/**
 * 오늘 복습할 카드인지 확인
 */
export function isDue(state: FSRSState): boolean {
  const now = new Date();
  const due = new Date(state.due);
  return due <= now;
}

/**
 * 마스터 여부 확인
 * FSRS 기준: stability >= 21일 (3주 이상 기억 유지)
 */
export function isMastered(state: FSRSState): boolean {
  return state.stability >= 21 && state.state === State.Review;
}

/**
 * 학습 진행률 계산 (0-100%)
 * stability 기반으로 계산
 */
export function getProgress(state: FSRSState): number {
  // stability 21일 = 100%
  const progress = Math.min(100, (state.stability / 21) * 100);
  return Math.round(progress);
}

/**
 * 현재 기억률 추정 (Retrievability)
 * FSRS 공식: R = e^(-t/S) where t = elapsed_days, S = stability
 */
export function getRetrievability(state: FSRSState): number {
  if (state.stability === 0) return 0;
  const now = new Date();
  const lastReview = state.last_review
    ? new Date(state.last_review)
    : new Date(state.due);
  const elapsedDays =
    (now.getTime() - lastReview.getTime()) / (1000 * 60 * 60 * 24);
  const retrievability = Math.exp(-elapsedDays / state.stability);
  return Math.round(retrievability * 100);
}

/**
 * 카드 상태 레이블
 */
export function getStateLabel(state: FSRSState): string {
  switch (state.state) {
    case State.New:
      return "신규";
    case State.Learning:
      return "학습 중";
    case State.Review:
      return state.stability >= 21 ? "마스터" : "복습";
    case State.Relearning:
      return "재학습";
    default:
      return "알 수 없음";
  }
}

// ============================================
// Statistics
// ============================================

/**
 * FSRS 통계 가져오기
 */
export function getFSRSStats(): {
  total: number;
  newCards: number;
  learning: number;
  review: number;
  mastered: number;
  dueToday: number;
  avgStability: number;
  avgDifficulty: number;
} {
  const states = getFSRSStates();
  const stateList = Object.values(states);

  if (stateList.length === 0) {
    return {
      total: 0,
      newCards: 0,
      learning: 0,
      review: 0,
      mastered: 0,
      dueToday: 0,
      avgStability: 0,
      avgDifficulty: 0,
    };
  }

  let newCards = 0,
    learning = 0,
    review = 0,
    mastered = 0,
    dueToday = 0;
  let totalStability = 0,
    totalDifficulty = 0;

  const now = new Date();

  stateList.forEach((state) => {
    // 상태별 카운트
    switch (state.state) {
      case State.New:
        newCards++;
        break;
      case State.Learning:
      case State.Relearning:
        learning++;
        break;
      case State.Review:
        if (isMastered(state)) {
          mastered++;
        } else {
          review++;
        }
        break;
    }

    // 오늘 복습 필요한 카드
    if (new Date(state.due) <= now) {
      dueToday++;
    }

    // 평균 계산용
    totalStability += state.stability;
    totalDifficulty += state.difficulty;
  });

  return {
    total: stateList.length,
    newCards,
    learning,
    review,
    mastered,
    dueToday,
    avgStability: Math.round((totalStability / stateList.length) * 10) / 10,
    avgDifficulty: Math.round((totalDifficulty / stateList.length) * 100) / 100,
  };
}

// ============================================
// Migration
// ============================================

/**
 * SM-2 SRSState를 FSRS FSRSState로 마이그레이션
 *
 * SM-2 → FSRS 매핑:
 * - interval → scheduled_days + stability 추정
 * - ease_factor → difficulty 변환 (역관계)
 * - reps → reps
 * - next_review → due
 */
export function migrateSM2ToFSRS(
  sm2State: {
    vocab_id: number;
    interval: number;
    ease_factor: number;
    next_review: string;
    reps: number;
  }
): FSRSState {
  // Difficulty 추정 (ease_factor 역변환)
  // SM-2 ease: 1.3 ~ 2.5+ → FSRS difficulty: 10 (어려움) ~ 1 (쉬움)
  const difficulty = Math.max(
    1,
    Math.min(10, 11 - (sm2State.ease_factor - 1.3) * 6)
  );

  // Stability 추정 (interval 기반)
  // interval이 클수록 stability가 높음
  const stability = Math.max(1, sm2State.interval * 0.9);

  // State 결정
  let state: State;
  if (sm2State.reps === 0) {
    state = State.New;
  } else if (sm2State.reps < 3) {
    state = State.Learning;
  } else {
    state = State.Review;
  }

  return {
    vocab_id: sm2State.vocab_id,
    due: sm2State.next_review,
    stability,
    difficulty,
    elapsed_days: 0,
    scheduled_days: sm2State.interval,
    learning_steps: 0, // 마이그레이션 시 0으로 초기화
    reps: sm2State.reps,
    lapses: 0,
    state,
    last_review: null,
  };
}

/**
 * 기존 SM-2 데이터 전체 마이그레이션
 */
export function migrateAllFromSM2(): {
  migrated: number;
  skipped: number;
} {
  const SM2_STORAGE_KEY = "jflash_srs_state";

  if (typeof window === "undefined") {
    return { migrated: 0, skipped: 0 };
  }

  // 기존 SM-2 데이터 로드
  const sm2Stored = localStorage.getItem(SM2_STORAGE_KEY);
  if (!sm2Stored) {
    return { migrated: 0, skipped: 0 };
  }

  let sm2States: Record<
    number,
    {
      vocab_id: number;
      interval: number;
      ease_factor: number;
      next_review: string;
      reps: number;
    }
  >;

  try {
    sm2States = JSON.parse(sm2Stored);
  } catch {
    return { migrated: 0, skipped: 0 };
  }

  // 기존 FSRS 데이터 로드
  const existingFSRS = getFSRSStates();

  let migrated = 0;
  let skipped = 0;

  for (const [id, sm2State] of Object.entries(sm2States)) {
    const vocabId = parseInt(id);

    // 이미 FSRS 데이터가 있으면 스킵
    if (existingFSRS[vocabId]) {
      skipped++;
      continue;
    }

    // 마이그레이션 실행
    const fsrsState = migrateSM2ToFSRS(sm2State);
    existingFSRS[vocabId] = fsrsState;
    migrated++;
  }

  // 저장
  saveAllFSRSStates(existingFSRS);

  return { migrated, skipped };
}

/**
 * FSRS 데이터 초기화
 */
export function clearFSRSData(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(FSRS_STORAGE_KEY);
}

// ============================================
// Export scheduler for advanced usage
// ============================================

export { scheduler, Rating, State };
