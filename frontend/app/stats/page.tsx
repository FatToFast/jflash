"use client";

/**
 * Stats Page (Static Version for Vercel)
 *
 * Vercel 배포용 - localStorage 기반 통계 표시
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import { loadVocabulary, getStats, getSRSStates } from "@/lib/static-data";

interface StatsData {
  total_words: number;
  learned_words: number;
  mastered_words: number;
  due_today: number;
  new_words: number;
}

export default function StatsPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
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
      } catch (err) {
        console.error("Failed to load stats:", err);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
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
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">학습 현황</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              title="전체 단어"
              value={stats.total_words}
              icon="📚"
              color="blue"
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

        {/* Progress Bar */}
        <section className="mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-gray-700">학습 진행률</h3>
              <span className="text-2xl font-bold text-blue-600">
                {learningProgress}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className="bg-blue-500 h-4 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(learningProgress, 100)}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-sm text-gray-500">
              <span>새 단어: {stats.new_words}개</span>
              <span>학습 완료: {stats.learned_words}개</span>
            </div>
          </div>
        </section>

        {/* Info Card */}
        <section className="mb-8">
          <div className="bg-gradient-to-r from-amber-400 to-orange-500 rounded-xl shadow-sm p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium opacity-90">Vercel 배포 버전</h3>
                <p className="text-sm opacity-80 mt-2">
                  학습 진행상황은 브라우저 localStorage에 저장됩니다.
                </p>
                <p className="text-sm opacity-80 mt-1">
                  다른 기기에서는 동기화되지 않습니다.
                </p>
              </div>
              <div className="text-5xl">💾</div>
            </div>
          </div>
        </section>

        {/* Quick Links */}
        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">바로가기</h2>
          <div className="grid grid-cols-3 gap-4">
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
  color: "blue" | "green" | "yellow" | "red";
}) {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600 border-blue-200",
    green: "bg-green-50 text-green-600 border-green-200",
    yellow: "bg-yellow-50 text-yellow-600 border-yellow-200",
    red: "bg-red-50 text-red-600 border-red-200",
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
