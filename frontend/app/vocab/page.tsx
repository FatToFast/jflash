"use client";

/**
 * Vocabulary Page - Minimal Japanese aesthetic
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  VocabItem,
  loadWords,
  loadSentences,
  loadAllMastered,
  loadAllVocabulary,
  getSRSStates,
} from "@/lib/static-data";
import { speakJapanese, initializeVoices } from "@/lib/tts";

type DataSource = "active" | "mastered" | "all";
type FilterType = "all" | "words" | "sentences";
type SortOption = "priority" | "new" | "learning" | "mastered" | "recent";

export default function VocabPage() {
  const [loading, setLoading] = useState(true);
  const [vocabList, setVocabList] = useState<VocabItem[]>([]);
  const [dataSource, setDataSource] = useState<DataSource>("active");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [sortOption, setSortOption] = useState<SortOption>("priority");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchVocab = useCallback(async () => {
    setLoading(true);
    try {
      let vocab: VocabItem[];
      switch (dataSource) {
        case "active":
          const [words, sentences] = await Promise.all([
            loadWords(),
            loadSentences(),
          ]);
          vocab = [...words, ...sentences];
          break;
        case "mastered":
          vocab = await loadAllMastered();
          break;
        case "all":
        default:
          vocab = await loadAllVocabulary();
          break;
      }
      setVocabList(vocab);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [dataSource]);

  useEffect(() => {
    fetchVocab();
  }, [fetchVocab]);

  useEffect(() => {
    initializeVoices();
  }, []);

  const srsStates = typeof window !== "undefined" ? getSRSStates() : {};

  const typeFilteredList = useMemo(() => {
    switch (filterType) {
      case "words":
        return vocabList.filter((v) => v.pos !== "文");
      case "sentences":
        return vocabList.filter((v) => v.pos === "文");
      default:
        return vocabList;
    }
  }, [vocabList, filterType]);

  const filteredList = useMemo(() => {
    if (!debouncedSearch) return typeFilteredList;
    const query = debouncedSearch.toLowerCase();
    return typeFilteredList.filter(
      (v) =>
        v.kanji.toLowerCase().includes(query) ||
        (v.reading && v.reading.toLowerCase().includes(query)) ||
        (v.meaning && v.meaning.toLowerCase().includes(query))
    );
  }, [typeFilteredList, debouncedSearch]);

  const sortedList = useMemo(() => {
    const list = [...filteredList];
    const getPriorityScore = (v: VocabItem): number => {
      const state = srsStates[v.id];
      if (!state) return 0;
      if (state.reps === 0) return 1;
      const difficultyScore = (2.5 - state.ease_factor) * 10;
      const progressScore = Math.min(state.reps, 10);
      return 2 + progressScore - difficultyScore;
    };

    switch (sortOption) {
      case "priority":
        return list.sort((a, b) => getPriorityScore(a) - getPriorityScore(b));
      case "new":
        return list.sort((a, b) => {
          const aState = srsStates[a.id];
          const bState = srsStates[b.id];
          if (!aState && bState) return -1;
          if (aState && !bState) return 1;
          return 0;
        });
      case "learning":
        return list.sort((a, b) => {
          const aState = srsStates[a.id];
          const bState = srsStates[b.id];
          const aLearning = aState && aState.reps > 0 && aState.reps < 5;
          const bLearning = bState && bState.reps > 0 && bState.reps < 5;
          if (aLearning && !bLearning) return -1;
          if (!aLearning && bLearning) return 1;
          if (aLearning && bLearning) {
            return (aState?.ease_factor || 2.5) - (bState?.ease_factor || 2.5);
          }
          return 0;
        });
      case "mastered":
        return list.sort((a, b) => {
          const aReps = srsStates[a.id]?.reps || 0;
          const bReps = srsStates[b.id]?.reps || 0;
          return bReps - aReps;
        });
      case "recent":
        return list.sort((a, b) => b.id - a.id);
      default:
        return list;
    }
  }, [filteredList, sortOption, srsStates]);

  const totalPages = Math.ceil(sortedList.length / pageSize);
  const paginatedList = sortedList.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  const getStatusLabel = (vocabId: number): string => {
    const state = srsStates[vocabId];
    if (!state) return "새";
    if (state.reps >= 5) return "완";
    if (state.reps > 0) return "학";
    return "새";
  };

  const playPronunciation = useCallback((text: string) => {
    speakJapanese(text);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <main className="mx-auto max-w-2xl px-6 py-12">
        {/* Header */}
        <header className="mb-12">
          <Link
            href="/"
            className="text-[10px] tracking-[0.3em] text-neutral-400 hover:text-neutral-600 transition-colors"
          >
            ← J-FLASH
          </Link>
          <h1 className="mt-3 text-lg ">単語帳</h1>
          <p className="mt-1 text-xs text-neutral-400">
            {typeFilteredList.length}개
            {debouncedSearch && ` / 검색: ${filteredList.length}개`}
          </p>
        </header>

        {/* Source tabs */}
        <div className="mb-6 flex gap-4 border-b border-neutral-100">
          {[
            { value: "active", label: "학습 중" },
            { value: "mastered", label: "마스터" },
            { value: "all", label: "전체" },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                setDataSource(opt.value as DataSource);
                setPage(1);
              }}
              className={`pb-2 text-sm transition-colors ${
                dataSource === opt.value
                  ? "border-b border-neutral-900 text-neutral-900"
                  : "text-neutral-400 hover:text-neutral-600"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="mb-6 flex gap-4">
          {[
            { value: "all", label: "전체" },
            { value: "words", label: "단어" },
            { value: "sentences", label: "문장" },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                setFilterType(opt.value as FilterType);
                setPage(1);
              }}
              className={`text-xs transition-colors ${
                filterType === opt.value
                  ? "text-neutral-900"
                  : "text-neutral-400 hover:text-neutral-600"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="검색..."
            className="w-full border-b border-neutral-200 bg-transparent py-2 text-sm outline-none placeholder:text-neutral-300 focus:border-neutral-900"
          />
        </div>

        {/* Sort options */}
        <div className="mb-8 flex flex-wrap gap-2">
          {[
            { value: "priority", label: "우선순위" },
            { value: "new", label: "새 단어" },
            { value: "learning", label: "학습 중" },
            { value: "mastered", label: "마스터" },
            { value: "recent", label: "최근" },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                setSortOption(opt.value as SortOption);
                setPage(1);
              }}
              className={`px-3 py-1 text-xs transition-colors ${
                sortOption === opt.value
                  ? "bg-neutral-900 text-white"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="py-20 text-center">
            <p className="text-sm text-neutral-400">불러오는 중...</p>
          </div>
        )}

        {/* Empty */}
        {!loading && paginatedList.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-sm text-neutral-400">
              {debouncedSearch ? "검색 결과 없음" : "단어 없음"}
            </p>
          </div>
        )}

        {/* List */}
        {!loading && paginatedList.length > 0 && (
          <div className="space-y-px border-t border-neutral-100">
            {paginatedList.map((vocab) => (
              <div
                key={vocab.id}
                className="flex items-center gap-4 border-b border-neutral-100 py-4"
              >
                <button
                  onClick={() =>
                    playPronunciation(vocab.reading || vocab.kanji)
                  }
                  className="text-neutral-300 hover:text-neutral-600 transition-colors"
                >
                  ▶
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-lg  truncate">{vocab.kanji}</p>
                  <p className="text-xs text-neutral-400 truncate">
                    {vocab.reading && `${vocab.reading} · `}
                    {vocab.meaning || "—"}
                  </p>
                </div>
                <span className="text-[10px] text-neutral-300">
                  {getStatusLabel(vocab.id)}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-4">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="text-xs text-neutral-400 hover:text-neutral-600 disabled:opacity-30"
            >
              ←
            </button>
            <span className="text-xs text-neutral-400">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="text-xs text-neutral-400 hover:text-neutral-600 disabled:opacity-30"
            >
              →
            </button>
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
