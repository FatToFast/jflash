/**
 * Learning Optimizer - 10배 빠른 학습을 위한 최적화 모듈
 *
 * 핵심 원리:
 * 1. 파인만 기법 (Feynman Technique) - 설명하면서 배우기
 * 2. FSRS 간격 반복 - 과학적 복습 타이밍
 * 3. Active Recall - 능동적 기억 인출
 * 4. Interleaving - 혼합 학습
 * 5. 청킹 (Chunking) - 일일 적정량 유지
 */

// ============================================
// Types
// ============================================

export interface DailyGoal {
  newCardsTarget: number; // 하루 신규 단어 목표
  reviewTarget: number; // 하루 복습 목표
  accuracyTarget: number; // 목표 정답률 (%)
  timeTarget: number; // 목표 학습 시간 (분)
}

export interface LearningStreak {
  currentStreak: number; // 현재 연속 학습일
  longestStreak: number; // 최장 연속 학습일
  lastStudyDate: string | null; // 마지막 학습일 (YYYY-MM-DD)
  totalDays: number; // 총 학습일
}

export interface DailyProgress {
  date: string; // YYYY-MM-DD
  newCardsStudied: number;
  cardsReviewed: number;
  correctAnswers: number;
  wrongAnswers: number;
  studyTimeMinutes: number;
  feynmanSessions: number; // 파인만 모드 세션 수
}

export interface LearningPhase {
  phase: number; // 1-3
  name: string;
  dayRange: [number, number]; // [시작일, 종료일]
  focus: string;
  dailyNewCards: number;
  dailyReviewTarget: number;
  techniques: string[];
}

export interface WeakPattern {
  vocabId: number;
  kanji: string;
  lapses: number; // 틀린 횟수
  difficulty: number;
  lastWrong: string | null;
}

export interface LearningInsights {
  averageAccuracy: number;
  averageRetention: number;
  weakPatterns: WeakPattern[];
  strongestJLPT: string | null;
  weakestJLPT: string | null;
  optimalStudyTime: string; // "morning" | "afternoon" | "evening"
  recommendedNewCards: number;
}

// ============================================
// Storage Keys
// ============================================

const STREAK_KEY = "jflash_streak";
const DAILY_PROGRESS_KEY = "jflash_daily_progress";
const GOALS_KEY = "jflash_goals";
const STUDY_SESSION_KEY = "jflash_study_session";

// ============================================
// 90일 학습 로드맵
// ============================================

export const LEARNING_PHASES: LearningPhase[] = [
  {
    phase: 1,
    name: "기초 다지기",
    dayRange: [1, 30],
    focus: "N5 단어 + 기본 문법 패턴",
    dailyNewCards: 10,
    dailyReviewTarget: 30,
    techniques: [
      "기본 모드: 단어 → 의미 학습",
      "듣기 모드: 발음 익히기 (매일 10분)",
      "파인만: 배운 단어로 간단한 문장 만들기",
    ],
  },
  {
    phase: 2,
    name: "확장 & 심화",
    dayRange: [31, 60],
    focus: "N4 단어 + 문장 구조 이해",
    dailyNewCards: 15,
    dailyReviewTarget: 50,
    techniques: [
      "역방향 모드: 의미 → 단어 (Active Recall 강화)",
      "빈칸 모드: 문맥 속 단어 사용법",
      "파인만: 학습한 문법을 다른 사람에게 설명하듯 정리",
    ],
  },
  {
    phase: 3,
    name: "유창성 도달",
    dayRange: [61, 90],
    focus: "N3+ 단어 + 자연스러운 표현",
    dailyNewCards: 20,
    dailyReviewTarget: 80,
    techniques: [
      "문장 모드: 완전한 문장 단위 학습",
      "혼합 복습: 모든 모드 랜덤 섞기",
      "파인만: 일본어로 짧은 일기 쓰기",
    ],
  },
];

// ============================================
// Default Goals
// ============================================

export const DEFAULT_GOALS: DailyGoal = {
  newCardsTarget: 10,
  reviewTarget: 50,
  accuracyTarget: 80,
  timeTarget: 30,
};

// ============================================
// Streak Management
// ============================================

function getTodayString(): string {
  return new Date().toISOString().split("T")[0];
}

function getYesterdayString(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split("T")[0];
}

export function getStreak(): LearningStreak {
  if (typeof window === "undefined") {
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastStudyDate: null,
      totalDays: 0,
    };
  }

  const stored = localStorage.getItem(STREAK_KEY);
  if (!stored) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastStudyDate: null,
      totalDays: 0,
    };
  }

  try {
    const streak: LearningStreak = JSON.parse(stored);
    // 스트릭 유효성 검사
    const today = getTodayString();
    const yesterday = getYesterdayString();

    if (
      streak.lastStudyDate !== today &&
      streak.lastStudyDate !== yesterday
    ) {
      // 연속 학습 끊김
      return {
        ...streak,
        currentStreak: 0,
      };
    }

    return streak;
  } catch {
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastStudyDate: null,
      totalDays: 0,
    };
  }
}

export function updateStreak(): LearningStreak {
  if (typeof window === "undefined") {
    return getStreak();
  }

  const streak = getStreak();
  const today = getTodayString();

  // 이미 오늘 학습했으면 업데이트 안함
  if (streak.lastStudyDate === today) {
    return streak;
  }

  const yesterday = getYesterdayString();
  let newCurrentStreak: number;

  if (streak.lastStudyDate === yesterday) {
    // 연속 학습 유지
    newCurrentStreak = streak.currentStreak + 1;
  } else {
    // 새로운 스트릭 시작
    newCurrentStreak = 1;
  }

  const newStreak: LearningStreak = {
    currentStreak: newCurrentStreak,
    longestStreak: Math.max(streak.longestStreak, newCurrentStreak),
    lastStudyDate: today,
    totalDays: streak.totalDays + 1,
  };

  localStorage.setItem(STREAK_KEY, JSON.stringify(newStreak));
  return newStreak;
}

// ============================================
// Daily Progress Tracking
// ============================================

export function getDailyProgress(date?: string): DailyProgress {
  if (typeof window === "undefined") {
    return createEmptyProgress(date || getTodayString());
  }

  const targetDate = date || getTodayString();
  const stored = localStorage.getItem(DAILY_PROGRESS_KEY);

  if (!stored) {
    return createEmptyProgress(targetDate);
  }

  try {
    const allProgress: Record<string, DailyProgress> = JSON.parse(stored);
    return allProgress[targetDate] || createEmptyProgress(targetDate);
  } catch {
    return createEmptyProgress(targetDate);
  }
}

function createEmptyProgress(date: string): DailyProgress {
  return {
    date,
    newCardsStudied: 0,
    cardsReviewed: 0,
    correctAnswers: 0,
    wrongAnswers: 0,
    studyTimeMinutes: 0,
    feynmanSessions: 0,
  };
}

export function updateDailyProgress(
  update: Partial<Omit<DailyProgress, "date">>
): DailyProgress {
  if (typeof window === "undefined") {
    return createEmptyProgress(getTodayString());
  }

  const today = getTodayString();
  const stored = localStorage.getItem(DAILY_PROGRESS_KEY);
  let allProgress: Record<string, DailyProgress> = {};

  try {
    allProgress = stored ? JSON.parse(stored) : {};
  } catch {
    allProgress = {};
  }

  const currentProgress = allProgress[today] || createEmptyProgress(today);

  const newProgress: DailyProgress = {
    ...currentProgress,
    newCardsStudied:
      currentProgress.newCardsStudied + (update.newCardsStudied || 0),
    cardsReviewed:
      currentProgress.cardsReviewed + (update.cardsReviewed || 0),
    correctAnswers:
      currentProgress.correctAnswers + (update.correctAnswers || 0),
    wrongAnswers: currentProgress.wrongAnswers + (update.wrongAnswers || 0),
    studyTimeMinutes:
      currentProgress.studyTimeMinutes + (update.studyTimeMinutes || 0),
    feynmanSessions:
      currentProgress.feynmanSessions + (update.feynmanSessions || 0),
  };

  allProgress[today] = newProgress;

  // 최근 90일치만 유지
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 90);
  const cutoff = cutoffDate.toISOString().split("T")[0];

  for (const date of Object.keys(allProgress)) {
    if (date < cutoff) {
      delete allProgress[date];
    }
  }

  localStorage.setItem(DAILY_PROGRESS_KEY, JSON.stringify(allProgress));

  // 스트릭 업데이트 (첫 학습 시)
  if (
    update.cardsReviewed ||
    update.newCardsStudied ||
    update.feynmanSessions
  ) {
    updateStreak();
  }

  return newProgress;
}

export function getProgressHistory(days: number = 30): DailyProgress[] {
  if (typeof window === "undefined") return [];

  const stored = localStorage.getItem(DAILY_PROGRESS_KEY);
  if (!stored) return [];

  try {
    const allProgress: Record<string, DailyProgress> = JSON.parse(stored);
    const result: DailyProgress[] = [];

    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      result.push(allProgress[dateStr] || createEmptyProgress(dateStr));
    }

    return result.reverse();
  } catch {
    return [];
  }
}

// ============================================
// Goals Management
// ============================================

export function getGoals(): DailyGoal {
  if (typeof window === "undefined") return DEFAULT_GOALS;

  const stored = localStorage.getItem(GOALS_KEY);
  if (!stored) return DEFAULT_GOALS;

  try {
    return { ...DEFAULT_GOALS, ...JSON.parse(stored) };
  } catch {
    return DEFAULT_GOALS;
  }
}

export function setGoals(goals: Partial<DailyGoal>): DailyGoal {
  if (typeof window === "undefined") return DEFAULT_GOALS;

  const current = getGoals();
  const newGoals = { ...current, ...goals };
  localStorage.setItem(GOALS_KEY, JSON.stringify(newGoals));
  return newGoals;
}

// ============================================
// Learning Phase Detection
// ============================================

export function getCurrentPhase(): LearningPhase {
  const streak = getStreak();
  const totalDays = streak.totalDays || 1;

  for (const phase of LEARNING_PHASES) {
    if (totalDays >= phase.dayRange[0] && totalDays <= phase.dayRange[1]) {
      return phase;
    }
  }

  // 90일 이후는 Phase 3 유지
  return LEARNING_PHASES[2];
}

export function getPhaseProgress(): {
  phase: LearningPhase;
  dayInPhase: number;
  totalPhaseDays: number;
  percentComplete: number;
} {
  const streak = getStreak();
  const totalDays = streak.totalDays || 1;
  const phase = getCurrentPhase();

  const dayInPhase = Math.max(1, totalDays - phase.dayRange[0] + 1);
  const totalPhaseDays = phase.dayRange[1] - phase.dayRange[0] + 1;
  const percentComplete = Math.min(100, (dayInPhase / totalPhaseDays) * 100);

  return {
    phase,
    dayInPhase,
    totalPhaseDays,
    percentComplete: Math.round(percentComplete),
  };
}

// ============================================
// Study Session Tracking
// ============================================

interface StudySession {
  startTime: number;
  cardsStudied: number;
}

export function startStudySession(): void {
  if (typeof window === "undefined") return;

  const session: StudySession = {
    startTime: Date.now(),
    cardsStudied: 0,
  };
  localStorage.setItem(STUDY_SESSION_KEY, JSON.stringify(session));
}

export function endStudySession(): number {
  if (typeof window === "undefined") return 0;

  const stored = localStorage.getItem(STUDY_SESSION_KEY);
  if (!stored) return 0;

  try {
    const session: StudySession = JSON.parse(stored);
    const durationMinutes = Math.round((Date.now() - session.startTime) / 60000);
    localStorage.removeItem(STUDY_SESSION_KEY);

    // 최소 1분, 최대 120분으로 제한 (비정상적 값 방지)
    return Math.max(1, Math.min(120, durationMinutes));
  } catch {
    localStorage.removeItem(STUDY_SESSION_KEY);
    return 0;
  }
}

// ============================================
// Learning Insights (분석)
// ============================================

export function getLearningInsights(): LearningInsights {
  const history = getProgressHistory(30);

  // 평균 정답률 계산
  let totalCorrect = 0;
  let totalReviewed = 0;

  history.forEach((day) => {
    totalCorrect += day.correctAnswers;
    totalReviewed += day.cardsReviewed;
  });

  const averageAccuracy =
    totalReviewed > 0 ? Math.round((totalCorrect / totalReviewed) * 100) : 0;

  // 권장 신규 카드 수 계산 (정답률 기반)
  let recommendedNewCards: number;
  if (averageAccuracy >= 90) {
    recommendedNewCards = 20; // 높은 정답률 → 더 많은 신규 단어
  } else if (averageAccuracy >= 80) {
    recommendedNewCards = 15;
  } else if (averageAccuracy >= 70) {
    recommendedNewCards = 10;
  } else {
    recommendedNewCards = 5; // 낮은 정답률 → 복습에 집중
  }

  return {
    averageAccuracy,
    averageRetention: Math.max(0, averageAccuracy - 5), // 대략적 추정
    weakPatterns: [], // FSRS 상태에서 가져와야 함 (별도 구현 필요)
    strongestJLPT: null, // 별도 분석 필요
    weakestJLPT: null,
    optimalStudyTime: "morning", // 기본값
    recommendedNewCards,
  };
}

// ============================================
// Goal Achievement Check
// ============================================

export function checkGoalAchievement(): {
  newCards: { current: number; target: number; achieved: boolean };
  reviews: { current: number; target: number; achieved: boolean };
  accuracy: { current: number; target: number; achieved: boolean };
  time: { current: number; target: number; achieved: boolean };
  allAchieved: boolean;
} {
  const progress = getDailyProgress();
  const goals = getGoals();

  const totalAnswers = progress.correctAnswers + progress.wrongAnswers;
  const currentAccuracy =
    totalAnswers > 0
      ? Math.round((progress.correctAnswers / totalAnswers) * 100)
      : 0;

  const result = {
    newCards: {
      current: progress.newCardsStudied,
      target: goals.newCardsTarget,
      achieved: progress.newCardsStudied >= goals.newCardsTarget,
    },
    reviews: {
      current: progress.cardsReviewed,
      target: goals.reviewTarget,
      achieved: progress.cardsReviewed >= goals.reviewTarget,
    },
    accuracy: {
      current: currentAccuracy,
      target: goals.accuracyTarget,
      achieved: totalAnswers === 0 || currentAccuracy >= goals.accuracyTarget,
    },
    time: {
      current: progress.studyTimeMinutes,
      target: goals.timeTarget,
      achieved: progress.studyTimeMinutes >= goals.timeTarget,
    },
    allAchieved: false,
  };

  result.allAchieved =
    result.newCards.achieved &&
    result.reviews.achieved &&
    result.accuracy.achieved &&
    result.time.achieved;

  return result;
}

// ============================================
// Feynman Technique Helper
// ============================================

export interface FeynmanPrompt {
  vocabId: number;
  kanji: string;
  meaning: string;
  promptType: "explain" | "example" | "compare" | "use";
  prompt: string;
}

const FEYNMAN_PROMPTS = {
  explain: [
    "이 단어를 초등학생에게 설명한다면?",
    "이 단어의 핵심 의미를 한 문장으로?",
    "이 단어가 없다면 어떻게 표현할까?",
  ],
  example: [
    "이 단어를 사용한 예문을 만들어보세요",
    "일상에서 이 단어를 쓸 상황은?",
    "이 단어로 질문 문장을 만든다면?",
  ],
  compare: [
    "비슷한 의미의 다른 단어는?",
    "반대 의미의 단어는 무엇일까?",
    "이 단어와 자주 함께 쓰이는 단어는?",
  ],
  use: [
    "오늘 이 단어를 어디서 쓸 수 있을까?",
    "이 단어로 자기소개 문장을 만든다면?",
    "친구에게 이 단어로 메시지를 보낸다면?",
  ],
};

export function generateFeynmanPrompt(
  vocabId: number,
  kanji: string,
  meaning: string
): FeynmanPrompt {
  const types = Object.keys(FEYNMAN_PROMPTS) as Array<keyof typeof FEYNMAN_PROMPTS>;
  const randomType = types[Math.floor(Math.random() * types.length)];
  const prompts = FEYNMAN_PROMPTS[randomType];
  const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];

  return {
    vocabId,
    kanji,
    meaning,
    promptType: randomType,
    prompt: randomPrompt,
  };
}

// ============================================
// Export Functions for Components
// ============================================

export {
  getTodayString,
  getYesterdayString,
};
