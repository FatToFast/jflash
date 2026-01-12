"use client";

/**
 * Stats Page - Minimal Japanese aesthetic
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
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadAllStats();
  }, []);

  const progress =
    stats && stats.total > 0
      ? Math.round((stats.learned / stats.total) * 100)
      : 0;

  return (
    <div className="min-h-screen bg-white">
      <main className="mx-auto max-w-sm px-6 py-12">
        {/* Header */}
        <header className="mb-12">
          <Link
            href="/"
            className="text-[10px] tracking-[0.3em] text-neutral-400 hover:text-neutral-600 transition-colors"
          >
            ← J-FLASH
          </Link>
          <h1 className="mt-3 text-lg ">統計</h1>
        </header>

        {/* Loading */}
        {loading && (
          <div className="py-20 text-center">
            <p className="text-sm text-neutral-400">불러오는 중...</p>
          </div>
        )}

        {/* Stats */}
        {!loading && stats && (
          <div className="space-y-8">
            {/* Progress */}
            <div className="text-center py-12 border-y border-neutral-100">
              <p className="text-5xl ">{progress}%</p>
              <p className="mt-2 text-xs text-neutral-400">학습 진행률</p>
            </div>

            {/* Main stats */}
            <div className="grid grid-cols-2 gap-px bg-neutral-100">
              <div className="bg-white p-6 text-center">
                <p className="text-2xl ">{stats.total}</p>
                <p className="mt-1 text-xs text-neutral-400">전체</p>
              </div>
              <div className="bg-white p-6 text-center">
                <p className="text-2xl ">{stats.dueToday}</p>
                <p className="mt-1 text-xs text-neutral-400">오늘 복습</p>
              </div>
              <div className="bg-white p-6 text-center">
                <p className="text-2xl ">{stats.learned}</p>
                <p className="mt-1 text-xs text-neutral-400">학습 중</p>
              </div>
              <div className="bg-white p-6 text-center">
                <p className="text-2xl ">{stats.mastered}</p>
                <p className="mt-1 text-xs text-neutral-400">마스터</p>
              </div>
            </div>

            {/* Breakdown */}
            <div className="space-y-3 pt-4 border-t border-neutral-100">
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500">단어</span>
                <span>{stats.words}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500">문장</span>
                <span>{stats.sentences}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500">새 단어</span>
                <span>{stats.newWords}</span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="pt-4">
              <div className="h-1 bg-neutral-100">
                <div
                  className="h-1 bg-neutral-900 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="mt-2 flex justify-between text-[10px] text-neutral-400">
                <span>0%</span>
                <span>100%</span>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="mt-12 flex gap-3">
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
