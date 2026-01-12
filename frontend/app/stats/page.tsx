"use client";

/**
 * Stats Page - Learning Dashboard
 * 90일 학습 로드맵 + 스트릭 + 일일 목표 추적
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  loadWords,
  loadSentences,
  loadAllMastered,
  getStats,
  getSRSStates,
} from "@/lib/static-data";
import {
  getStreak,
  getDailyProgress,
  getGoals,
  setGoals,
  checkGoalAchievement,
  getPhaseProgress,
  getLearningInsights,
  LEARNING_PHASES,
  DailyGoal,
} from "@/lib/learning-optimizer";
import {
  getGeminiApiKey,
  setGeminiApiKey,
  clearGeminiApiKey,
  isGeminiEnabled,
} from "@/lib/gemini";

interface StatsData {
  total: number;
  learned: number;
  mastered: number;
  dueToday: number;
  newWords: number;
  words: number;
  sentences: number;
}

export default function StatsPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showGoalSettings, setShowGoalSettings] = useState(false);
  const [goals, setGoalsState] = useState<DailyGoal | null>(null);

  // Gemini API settings
  const [showApiSettings, setShowApiSettings] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [geminiEnabled, setGeminiEnabled] = useState(false);

  // Learning optimizer data
  const streak = getStreak();
  const dailyProgress = getDailyProgress();
  const goalStatus = checkGoalAchievement();
  const phaseProgress = getPhaseProgress();
  const insights = getLearningInsights();

  useEffect(() => {
    const loadAllStats = async () => {
      setLoading(true);
      try {
        const [words, sentences, mastered] = await Promise.all([
          loadWords(),
          loadSentences(),
          loadAllMastered(),
        ]);

        const vocab = [...words, ...sentences, ...mastered];
        const srsStats = getStats();
        const srsStates = getSRSStates();
        const newWords = vocab.filter((v) => !srsStates[v.id]).length;

        setStats({
          total: vocab.length,
          learned: srsStats.learned,
          mastered: srsStats.mastered,
          dueToday: srsStats.dueToday,
          newWords,
          words: words.length + mastered.filter((v) => v.pos !== "文").length,
          sentences:
            sentences.length + mastered.filter((v) => v.pos === "文").length,
        });

        setGoalsState(getGoals());

        // Load Gemini settings
        setGeminiEnabled(isGeminiEnabled());
        const existingKey = getGeminiApiKey();
        if (existingKey) {
          // Show masked key
          setApiKeyInput(existingKey.slice(0, 10) + "..." + existingKey.slice(-4));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadAllStats();
  }, []);

  const handleGoalChange = (key: keyof DailyGoal, value: number) => {
    if (!goals) return;
    const newGoals = setGoals({ [key]: value });
    setGoalsState(newGoals);
  };

  const handleSaveApiKey = () => {
    if (apiKeyInput && !apiKeyInput.includes("...")) {
      setGeminiApiKey(apiKeyInput);
      setGeminiEnabled(true);
      // Mask the displayed key
      setApiKeyInput(apiKeyInput.slice(0, 10) + "..." + apiKeyInput.slice(-4));
    }
  };

  const handleClearApiKey = () => {
    clearGeminiApiKey();
    setGeminiEnabled(false);
    setApiKeyInput("");
  };

  const progress =
    stats && stats.total > 0
      ? Math.round((stats.learned / stats.total) * 100)
      : 0;

  return (
    <div className="min-h-screen bg-white">
      <main className="mx-auto max-w-sm px-6 py-12">
        {/* Header */}
        <header className="mb-8">
          <Link
            href="/"
            className="text-[10px] tracking-[0.3em] text-neutral-400 hover:text-neutral-600 transition-colors"
          >
            ← J-FLASH
          </Link>
          <h1 className="mt-3 text-lg">学習</h1>
        </header>

        {/* Loading */}
        {loading && (
          <div className="py-20 text-center">
            <p className="text-sm text-neutral-400">불러오는 중...</p>
          </div>
        )}

        {/* Stats */}
        {!loading && stats && (
          <div className="space-y-6">
            {/* Streak & Day */}
            <div className="flex items-center justify-between py-4 border-y border-neutral-100">
              <div className="text-center">
                <p className="text-3xl">{streak.currentStreak}</p>
                <p className="text-[10px] text-neutral-400 mt-1">연속 학습일</p>
              </div>
              <div className="h-12 w-px bg-neutral-100" />
              <div className="text-center">
                <p className="text-3xl">{streak.totalDays}</p>
                <p className="text-[10px] text-neutral-400 mt-1">총 학습일</p>
              </div>
              <div className="h-12 w-px bg-neutral-100" />
              <div className="text-center">
                <p className="text-3xl">{streak.longestStreak}</p>
                <p className="text-[10px] text-neutral-400 mt-1">최장 기록</p>
              </div>
            </div>

            {/* 90-Day Roadmap Progress */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-neutral-400">90일 로드맵</p>
                <p className="text-xs text-neutral-600">
                  Phase {phaseProgress.phase.phase}: {phaseProgress.phase.name}
                </p>
              </div>
              <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-neutral-900 transition-all"
                  style={{ width: `${Math.min(100, (streak.totalDays / 90) * 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-neutral-400">
                <span>Day {streak.totalDays || 1}</span>
                <span>{phaseProgress.percentComplete}% of Phase {phaseProgress.phase.phase}</span>
              </div>

              {/* Phase Info */}
              <div className="mt-2 p-3 bg-neutral-50 rounded text-xs">
                <p className="text-neutral-600 mb-2">
                  <span className="font-medium">목표:</span> {phaseProgress.phase.focus}
                </p>
                <p className="text-neutral-500">
                  <span className="font-medium">일일 권장:</span> 신규 {phaseProgress.phase.dailyNewCards}개, 복습 {phaseProgress.phase.dailyReviewTarget}개
                </p>
              </div>
            </div>

            {/* Today's Goals */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-neutral-400">오늘의 목표</p>
                <button
                  onClick={() => setShowGoalSettings(!showGoalSettings)}
                  className="text-[10px] text-neutral-400 hover:text-neutral-600"
                >
                  {showGoalSettings ? "닫기" : "설정"}
                </button>
              </div>

              {/* Goal Progress */}
              <div className="grid grid-cols-2 gap-2">
                <GoalCard
                  label="신규 단어"
                  current={goalStatus.newCards.current}
                  target={goalStatus.newCards.target}
                  achieved={goalStatus.newCards.achieved}
                />
                <GoalCard
                  label="복습"
                  current={goalStatus.reviews.current}
                  target={goalStatus.reviews.target}
                  achieved={goalStatus.reviews.achieved}
                />
                <GoalCard
                  label="정답률"
                  current={goalStatus.accuracy.current}
                  target={goalStatus.accuracy.target}
                  achieved={goalStatus.accuracy.achieved}
                  suffix="%"
                />
                <GoalCard
                  label="학습 시간"
                  current={goalStatus.time.current}
                  target={goalStatus.time.target}
                  achieved={goalStatus.time.achieved}
                  suffix="분"
                />
              </div>

              {/* Goal Settings */}
              {showGoalSettings && goals && (
                <div className="p-3 bg-neutral-50 rounded space-y-3">
                  <GoalSlider
                    label="일일 신규 단어"
                    value={goals.newCardsTarget}
                    min={5}
                    max={50}
                    onChange={(v) => handleGoalChange("newCardsTarget", v)}
                  />
                  <GoalSlider
                    label="일일 복습 목표"
                    value={goals.reviewTarget}
                    min={10}
                    max={200}
                    step={10}
                    onChange={(v) => handleGoalChange("reviewTarget", v)}
                  />
                  <GoalSlider
                    label="목표 정답률 (%)"
                    value={goals.accuracyTarget}
                    min={60}
                    max={100}
                    step={5}
                    onChange={(v) => handleGoalChange("accuracyTarget", v)}
                  />
                  <GoalSlider
                    label="학습 시간 (분)"
                    value={goals.timeTarget}
                    min={10}
                    max={120}
                    step={5}
                    onChange={(v) => handleGoalChange("timeTarget", v)}
                  />
                </div>
              )}

              {/* All Goals Achieved Badge */}
              {goalStatus.allAchieved && (
                <div className="text-center py-2 bg-neutral-900 text-white text-xs rounded">
                  오늘 목표 달성 완료!
                </div>
              )}
            </div>

            {/* Learning Insights */}
            <div className="space-y-3 pt-4 border-t border-neutral-100">
              <p className="text-xs text-neutral-400">학습 분석</p>
              <div className="grid grid-cols-2 gap-px bg-neutral-100">
                <div className="bg-white p-4 text-center">
                  <p className="text-xl">{insights.averageAccuracy}%</p>
                  <p className="text-[10px] text-neutral-400 mt-1">평균 정답률</p>
                </div>
                <div className="bg-white p-4 text-center">
                  <p className="text-xl">{insights.recommendedNewCards}</p>
                  <p className="text-[10px] text-neutral-400 mt-1">권장 신규</p>
                </div>
              </div>
              {insights.averageAccuracy > 0 && insights.averageAccuracy < 70 && (
                <p className="text-[10px] text-neutral-500 bg-neutral-50 p-2 rounded">
                  정답률이 낮습니다. 신규 단어보다 복습에 집중하세요.
                </p>
              )}
            </div>

            {/* Vocabulary Stats */}
            <div className="space-y-3 pt-4 border-t border-neutral-100">
              <p className="text-xs text-neutral-400">단어장 현황</p>
              <div className="grid grid-cols-2 gap-px bg-neutral-100">
                <div className="bg-white p-4 text-center">
                  <p className="text-2xl">{stats.total}</p>
                  <p className="text-[10px] text-neutral-400 mt-1">전체</p>
                </div>
                <div className="bg-white p-4 text-center">
                  <p className="text-2xl">{stats.dueToday}</p>
                  <p className="text-[10px] text-neutral-400 mt-1">오늘 복습</p>
                </div>
                <div className="bg-white p-4 text-center">
                  <p className="text-2xl">{stats.learned}</p>
                  <p className="text-[10px] text-neutral-400 mt-1">학습 중</p>
                </div>
                <div className="bg-white p-4 text-center">
                  <p className="text-2xl">{stats.mastered}</p>
                  <p className="text-[10px] text-neutral-400 mt-1">마스터</p>
                </div>
              </div>
            </div>

            {/* Progress */}
            <div className="pt-4">
              <div className="flex justify-between text-xs mb-2">
                <span className="text-neutral-400">전체 진행률</span>
                <span>{progress}%</span>
              </div>
              <div className="h-1 bg-neutral-100">
                <div
                  className="h-1 bg-neutral-900 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Phase Guide */}
            <div className="space-y-3 pt-4 border-t border-neutral-100">
              <p className="text-xs text-neutral-400">90일 로드맵 가이드</p>
              {LEARNING_PHASES.map((phase) => (
                <div
                  key={phase.phase}
                  className={`p-3 rounded text-xs ${
                    phase.phase === phaseProgress.phase.phase
                      ? "bg-neutral-900 text-white"
                      : "bg-neutral-50 text-neutral-600"
                  }`}
                >
                  <div className="flex justify-between mb-2">
                    <span className="font-medium">
                      Phase {phase.phase}: {phase.name}
                    </span>
                    <span className="opacity-70">
                      Day {phase.dayRange[0]}-{phase.dayRange[1]}
                    </span>
                  </div>
                  <p className="opacity-80 mb-2">{phase.focus}</p>
                  <ul className="space-y-1 opacity-70">
                    {phase.techniques.map((tech, i) => (
                      <li key={i}>• {tech}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* AI Settings */}
            <div className="space-y-3 pt-4 border-t border-neutral-100">
              <div className="flex items-center justify-between">
                <p className="text-xs text-neutral-400">AI 피드백 설정</p>
                <button
                  onClick={() => setShowApiSettings(!showApiSettings)}
                  className="text-[10px] text-neutral-400 hover:text-neutral-600"
                >
                  {showApiSettings ? "닫기" : "설정"}
                </button>
              </div>

              {/* Status */}
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${geminiEnabled ? "bg-green-500" : "bg-neutral-300"}`} />
                <span className="text-xs text-neutral-600">
                  {geminiEnabled ? "Gemini AI 활성화됨" : "AI 피드백 비활성화"}
                </span>
              </div>

              {showApiSettings && (
                <div className="p-3 bg-neutral-50 rounded space-y-3">
                  <p className="text-[10px] text-neutral-500">
                    설명 모드에서 AI가 피드백을 제공합니다.
                  </p>
                  <div>
                    <label className="text-[10px] text-neutral-500 block mb-1">
                      Gemini API Key
                    </label>
                    <input
                      type="text"
                      value={apiKeyInput}
                      onChange={(e) => setApiKeyInput(e.target.value)}
                      placeholder="AIzaSy..."
                      className="w-full px-3 py-2 text-xs border border-neutral-200 rounded focus:outline-none focus:border-neutral-400"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveApiKey}
                      disabled={!apiKeyInput || apiKeyInput.includes("...")}
                      className="flex-1 py-2 text-xs bg-neutral-900 text-white rounded hover:bg-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      저장
                    </button>
                    {geminiEnabled && (
                      <button
                        onClick={handleClearApiKey}
                        className="px-4 py-2 text-xs border border-neutral-300 text-neutral-600 rounded hover:bg-neutral-100"
                      >
                        삭제
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-neutral-400">
                    API 키는 브라우저에만 저장됩니다.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="mt-8 flex gap-3">
          <Link
            href="/"
            className="flex-1 py-3 text-center text-sm border border-neutral-200 text-neutral-600 hover:bg-neutral-50 transition-colors"
          >
            홈
          </Link>
          <Link
            href="/review"
            className="flex-1 py-3 text-center text-sm bg-neutral-900 text-white hover:bg-neutral-800 transition-colors"
          >
            복습
          </Link>
        </div>
      </main>
    </div>
  );
}

// Goal Card Component
function GoalCard({
  label,
  current,
  target,
  achieved,
  suffix = "",
}: {
  label: string;
  current: number;
  target: number;
  achieved: boolean;
  suffix?: string;
}) {
  const percent = Math.min(100, (current / target) * 100);

  return (
    <div className={`p-3 rounded ${achieved ? "bg-neutral-900 text-white" : "bg-neutral-50"}`}>
      <div className="flex justify-between items-center mb-2">
        <span className={`text-[10px] ${achieved ? "text-neutral-300" : "text-neutral-400"}`}>
          {label}
        </span>
        {achieved && <span className="text-[10px]">✓</span>}
      </div>
      <p className="text-lg">
        {current}
        <span className={`text-xs ${achieved ? "text-neutral-400" : "text-neutral-400"}`}>
          /{target}{suffix}
        </span>
      </p>
      <div className={`h-1 mt-2 rounded-full ${achieved ? "bg-neutral-700" : "bg-neutral-200"}`}>
        <div
          className={`h-1 rounded-full transition-all ${achieved ? "bg-white" : "bg-neutral-900"}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

// Goal Slider Component
function GoalSlider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <div className="flex justify-between text-[10px] text-neutral-500 mb-1">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1 bg-neutral-200 rounded-full appearance-none cursor-pointer"
      />
    </div>
  );
}
