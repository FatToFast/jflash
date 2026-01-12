"use client";

/**
 * Vocabulary Page (Static Version for Vercel)
 *
 * Vercel 배포용 - 정적 JSON에서 단어 목록 로드
 * 읽기 전용 모드 (수정/삭제 불가)
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { VocabItem, loadVocabulary, getSRSStates, SRSState } from "@/lib/static-data";

export default function VocabPage() {
  const [loading, setLoading] = useState(true);
  const [vocabList, setVocabList] = useState<VocabItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  // 검색
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // 페이지네이션
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchVocab = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const vocab = await loadVocabulary();
      setVocabList(vocab);
    } catch (err) {
      setError("단어 목록을 불러오는데 실패했습니다.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVocab();
  }, [fetchVocab]);

  // 검색 필터링
  const filteredList = useMemo(() => {
    if (!debouncedSearch) return vocabList;

    const query = debouncedSearch.toLowerCase();
    return vocabList.filter(
      (v) =>
        v.kanji.toLowerCase().includes(query) ||
        (v.reading && v.reading.toLowerCase().includes(query)) ||
        (v.meaning && v.meaning.toLowerCase().includes(query))
    );
  }, [vocabList, debouncedSearch]);

  // 페이지네이션 계산
  const totalPages = Math.ceil(filteredList.length / pageSize);
  const paginatedList = filteredList.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  // SRS 상태 가져오기
  const srsStates = typeof window !== "undefined" ? getSRSStates() : {};

  const getPosColor = (pos: string | null): string => {
    if (!pos) return "bg-stone-100 text-stone-800";

    const colors: Record<string, string> = {
      名詞: "bg-blue-100 text-blue-800",
      動詞: "bg-green-100 text-green-800",
      形容詞: "bg-purple-100 text-purple-800",
      副詞: "bg-orange-100 text-orange-800",
      接続詞: "bg-pink-100 text-pink-800",
      感動詞: "bg-yellow-100 text-yellow-800",
      連体詞: "bg-indigo-100 text-indigo-800",
    };
    return colors[pos] || "bg-stone-100 text-stone-800";
  };

  const getStatusBadge = (vocabId: number) => {
    const state = srsStates[vocabId];
    if (!state) {
      return <span className="text-xs text-stone-400">새 단어</span>;
    }
    if (state.reps >= 5) {
      return <span className="text-xs text-green-600">마스터</span>;
    }
    if (state.reps > 0) {
      return <span className="text-xs text-blue-600">학습 중</span>;
    }
    return <span className="text-xs text-stone-400">새 단어</span>;
  };

  return (
    <div className="min-h-screen bg-[#f7f1e9] text-stone-900">
      <main className="mx-auto flex min-h-screen max-w-5xl flex-col items-center px-6 py-14">
        <header className="mb-8 text-center">
          <Link
            href="/"
            className="text-xs uppercase tracking-[0.35em] text-amber-700"
          >
            J-Flash
          </Link>
          <h1 className="mt-2 text-3xl font-semibold">단어장</h1>
          <p className="mt-2 text-stone-600">
            저장된 일본어 단어 목록입니다.
          </p>
        </header>

        {/* Statistics */}
        <div className="mb-6 w-full rounded-xl bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex gap-6 text-sm">
              <span>
                전체 단어:{" "}
                <strong className="text-amber-600">{vocabList.length}개</strong>
              </span>
              {debouncedSearch && (
                <span>
                  검색 결과:{" "}
                  <strong className="text-blue-600">{filteredList.length}개</strong>
                </span>
              )}
            </div>
            <div className="text-sm text-stone-500">
              읽기 전용 모드
            </div>
          </div>
        </div>

        {/* 검색 */}
        <div className="mb-4 w-full">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="한자, 읽기, 의미로 검색..."
            className="w-full rounded-lg border border-stone-300 bg-white px-4 py-3 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          />
        </div>

        {/* Loading */}
        {loading && (
          <div className="w-full rounded-xl bg-white p-12 text-center shadow-sm">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-stone-300 border-t-amber-500" />
            <p className="mt-4 text-stone-600">단어 목록 불러오는 중...</p>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="w-full rounded-xl bg-red-50 p-6 text-red-800">
            <p className="font-medium">오류 발생</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && paginatedList.length === 0 && (
          <div className="w-full rounded-xl bg-white p-12 text-center shadow-sm">
            <p className="text-6xl">📭</p>
            <p className="mt-4 text-xl font-semibold">
              {debouncedSearch ? "검색 결과가 없습니다" : "단어장이 비어있습니다"}
            </p>
            <p className="mt-2 text-stone-600">
              {debouncedSearch
                ? "다른 검색어를 입력해보세요."
                : "단어 데이터를 추가해주세요."}
            </p>
          </div>
        )}

        {/* Word List */}
        {!loading && !error && paginatedList.length > 0 && (
          <div className="w-full space-y-4">
            <div className="rounded-xl bg-white shadow-sm">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-2 border-b border-stone-200 bg-stone-50 px-4 py-3 text-sm font-medium text-stone-500">
                <div className="col-span-2">한자</div>
                <div className="col-span-2">읽기</div>
                <div className="col-span-4">의미</div>
                <div className="col-span-2">품사</div>
                <div className="col-span-2 text-right">상태</div>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-stone-100">
                {paginatedList.map((vocab) => (
                  <div
                    key={vocab.id}
                    className="grid grid-cols-12 items-center gap-2 px-4 py-3 transition hover:bg-stone-50"
                  >
                    <div className="col-span-2">
                      <span className="text-xl font-semibold">
                        {vocab.kanji}
                      </span>
                    </div>
                    <div className="col-span-2 text-stone-600">
                      {vocab.reading || "-"}
                    </div>
                    <div className="col-span-4 text-stone-700">
                      {vocab.meaning || (
                        <span className="italic text-stone-400">미입력</span>
                      )}
                    </div>
                    <div className="col-span-2">
                      {vocab.pos ? (
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${getPosColor(vocab.pos)}`}
                        >
                          {vocab.pos}
                        </span>
                      ) : (
                        "-"
                      )}
                    </div>
                    <div className="col-span-2 text-right">
                      {getStatusBadge(vocab.id)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  이전
                </button>
                <span className="px-4 text-sm text-stone-600">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  다음
                </button>
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="mt-8 flex gap-4">
          <Link
            href="/"
            className="rounded-xl border border-stone-300 bg-white px-6 py-3 font-semibold text-stone-700 transition hover:bg-stone-50"
          >
            홈으로
          </Link>
          <Link
            href="/review"
            className="rounded-xl bg-amber-600 px-6 py-3 font-semibold text-white transition hover:bg-amber-700"
          >
            복습하기
          </Link>
        </div>
      </main>
    </div>
  );
}
