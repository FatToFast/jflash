"use client";

/**
 * Stats Page (Static Version for Vercel)
 *
 * Vercel 배포용 - localStorage 기반 통계 표시
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import { loadVocabulary, getStats, getSRSStates, VocabItem, SRSState } from "@/lib/static-data";
import { JLPT_LEVELS, JLPT_LEVEL_COLORS, POS_OPTIONS } from "@/lib/constants";

interface StatsData {
  total_words: number;
  learned_words: number;
  mastered_words: number;
  due_today: number;
  new_words: number;
}

interface JLPTStats {
  level: string;
  total: number;
  learned: number;
  mastered: number;
}

interface POSStats {
  pos: string;
  label: string;
  count: number;
}

interface SRSStageStats {
  stage: string;
  count: number;
  color: string;
}

export default function StatsPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [jlptStats, setJlptStats] = useState<JLPTStats[]>([]);
  const [posStats, setPosStats] = useState<POSStats[]>([]);
  const [srsStages, setSrsStages] = useState<SRSStageStats[]>([]);
  const [sentenceCount, setSentenceCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAllStats = async () => {
      setLoading(true);
      try {
        const vocab = await loadVocabulary();
        const srsStats = getStats();
        const srsStates = getSRSStates();

        // 새 단어 수 계산 (SRS 상태가 없는 단어)
        const newWords = vocab.filter((v) => !srsStates[v.id]).length;

        setStats({
          total_words: vocab.length,
          learned_words: srsStats.learned,
          mastered_words: srsStats.mastered,
          due_today: srsStats.dueToday,
          new_words: newWords,
        });

        // 문장 카드 수
        setSentenceCount(vocab.filter((v) => v.pos === "文").length);

        // JLPT 레벨별 통계
        const jlptData: JLPTStats[] = JLPT_LEVELS.map((level) => {
          const levelVocab = vocab.filter((v) => v.jlpt_level === level);
          const levelLearned = levelVocab.filter((v) => {
            const state = srsStates[v.id];
            return state && state.reps > 0;
          }).length;
          const levelMastered = levelVocab.filter((v) => {
            const state = srsStates[v.id];
            return state && state.reps >= 5;
          }).length;
          return {
            level,
            total: levelVocab.length,
            learned: levelLearned,
            mastered: levelMastered,
          };
        });
        setJlptStats(jlptData);

        // 품사별 통계
        const posData: POSStats[] = POS_OPTIONS
          .filter((p) => p.value !== "")
          .map((p) => ({
            pos: p.value,
            label: p.label,
            count: vocab.filter((v) => v.pos === p.value).length,
          }))
          .filter((p) => p.count > 0)
          .sort((a, b) => b.count - a.count);
        setPosStats(posData);

        // SRS 단계별 통계
        const stageData: SRSStageStats[] = [
          { stage: "새 단어", count: 0, color: "bg-gray-400" },
          { stage: "학습 시작 (1회)", count: 0, color: "bg-red-400" },
          { stage: "학습 중 (2-4회)", count: 0, color: "bg-orange-400" },
          { stage: "익숙함 (5-9회)", count: 0, color: "bg-yellow-400" },
          { stage: "마스터 (10+회)", count: 0, color: "bg-green-500" },
        ];
        vocab.forEach((v) => {
          const state = srsStates[v.id];
          if (!state) {
            stageData[0].count++;
          } else if (state.reps === 1) {
            stageData[1].count++;
          } else if (state.reps >= 2 && state.reps <= 4) {
            stageData[2].count++;
          } else if (state.reps >= 5 && state.reps <= 9) {
            stageData[3].count++;
          } else if (state.reps >= 10) {
            stageData[4].count++;
          }
        });
        setSrsStages(stageData);

      } catch (err) {
        console.error("Failed to load stats:", err);
      } finally {
        setLoading(false);
      }
    };

    loadAllStats();
  }, []);

  // 학습 진행률 계산
  const learningProgress = stats
    ? stats.total_words > 0
      ? Math.round((stats.learned_words / stats.total_words) * 100)
      : 0
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            통계 데이터를 불러올 수 없습니다.
          </div>
          <Link href="/" className="mt-4 inline-block text-blue-600 hover:underline">
            ← 홈으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-gray-600 hover:text-gray-900">
                ← 홈
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">학습 통계</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Overview Stats */}
        <section className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">학습 현황</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <StatCard
              title="전체 단어"
              value={stats.total_words}
              icon="📚"
              color="blue"
            />
            <StatCard
              title="문장"
              value={sentenceCount}
              icon="💬"
              color="purple"
            />
            <StatCard
              title="학습 중"
              value={stats.learned_words}
              icon="📖"
              color="yellow"
            />
            <StatCard
              title="마스터"
              value={stats.mastered_words}
              icon="⭐"
              color="green"
            />
            <StatCard
              title="오늘 복습"
              value={stats.due_today}
              icon="📝"
              color="red"
            />
          </div>
        </section>

        {/* SRS Progress Stages */}
        <section className="mb-6">
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h3 className="font-semibold text-gray-700 mb-3">SRS 학습 단계</h3>
            <div className="space-y-2">
              {srsStages.map((stage) => {
                const percentage = stats.total_words > 0
                  ? Math.round((stage.count / stats.total_words) * 100)
                  : 0;
                return (
                  <div key={stage.stage} className="flex items-center gap-3">
                    <span className="w-28 text-sm text-gray-600 truncate">{stage.stage}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                      <div
                        className={`${stage.color} h-5 rounded-full transition-all duration-500 flex items-center justify-end pr-2`}
                        style={{ width: `${Math.max(percentage, 2)}%` }}
                      >
                        {percentage > 5 && (
                          <span className="text-xs text-white font-medium">{stage.count}</span>
                        )}
                      </div>
                    </div>
                    <span className="w-12 text-right text-sm font-medium text-gray-700">
                      {stage.count}개
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* JLPT Level Stats */}
        {jlptStats.some((j) => j.total > 0) && (
          <section className="mb-6">
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h3 className="font-semibold text-gray-700 mb-3">JLPT 레벨별 현황</h3>
              <div className="grid grid-cols-5 gap-2">
                {jlptStats.map((j) => {
                  const progress = j.total > 0 ? Math.round((j.learned / j.total) * 100) : 0;
                  return (
                    <div
                      key={j.level}
                      className={`rounded-lg p-3 text-center ${JLPT_LEVEL_COLORS[j.level] || "bg-gray-100"}`}
                    >
                      <p className="text-lg font-bold">{j.level}</p>
                      <p className="text-2xl font-bold mt-1">{j.total}</p>
                      <p className="text-xs mt-1 opacity-80">학습 {j.learned}개</p>
                      <div className="mt-2 bg-white/50 rounded-full h-1.5">
                        <div
                          className="bg-current h-1.5 rounded-full opacity-60"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* POS Stats */}
        {posStats.length > 0 && (
          <section className="mb-6">
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h3 className="font-semibold text-gray-700 mb-3">품사별 분포</h3>
              <div className="flex flex-wrap gap-2">
                {posStats.map((p) => (
                  <div
                    key={p.pos}
                    className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2"
                  >
                    <span className="text-sm text-gray-600">{p.label}</span>
                    <span className="text-sm font-bold text-gray-800">{p.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Progress Bar */}
        <section className="mb-6">
          <div className="bg-white rounded-xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-gray-700">전체 학습 진행률</h3>
              <span className="text-xl font-bold text-blue-600">
                {learningProgress}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-blue-400 to-blue-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(learningProgress, 100)}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-sm text-gray-500">
              <span>새 단어: {stats.new_words}개</span>
              <span>학습 완료: {stats.learned_words}개</span>
            </div>
          </div>
        </section>

        {/* Quick Links */}
        <section>
          <div className="grid grid-cols-3 gap-3">
            <QuickLink href="/review" icon="📝" label="복습하기" />
            <QuickLink href="/vocab" icon="📚" label="단어장" />
            <QuickLink href="/grammar" icon="📗" label="문법" />
          </div>
        </section>
      </main>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: number;
  icon: string;
  color: "blue" | "green" | "yellow" | "red" | "purple";
}) {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600 border-blue-200",
    green: "bg-green-50 text-green-600 border-green-200",
    yellow: "bg-yellow-50 text-yellow-600 border-yellow-200",
    red: "bg-red-50 text-red-600 border-red-200",
    purple: "bg-purple-50 text-purple-600 border-purple-200",
  };

  return (
    <div className={`rounded-xl border p-4 ${colorClasses[color]}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{icon}</span>
      </div>
      <p className="text-3xl font-bold">{value.toLocaleString()}</p>
      <p className="text-sm opacity-80">{title}</p>
    </div>
  );
}

function QuickLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow"
    >
      <span className="text-2xl">{icon}</span>
      <span className="font-medium text-gray-700">{label}</span>
    </Link>
  );
}
