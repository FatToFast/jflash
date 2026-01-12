"use client";

/**
 * Grammar Page (Static Version for Vercel)
 *
 * Vercel 배포용 - 정적 JSON에서 문법 목록 로드
 * 읽기 전용 모드 (추가/수정/삭제 불가)
 */

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { GrammarItem, loadGrammar } from "@/lib/static-data";
import { JLPT_LEVELS, JLPT_LEVEL_COLORS } from "@/lib/constants";

export default function GrammarPage() {
  // 목록 상태
  const [grammarList, setGrammarList] = useState<GrammarItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 필터 상태
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("");

  // 페이지네이션
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // 상세 모달
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedGrammar, setSelectedGrammar] = useState<GrammarItem | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // 문법 목록 로드
  useEffect(() => {
    const fetchGrammar = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await loadGrammar();
        setGrammarList(data);
      } catch (err) {
        setError("문법 목록을 불러오는데 실패했습니다.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchGrammar();
  }, []);

  // 필터링
  const filteredList = useMemo(() => {
    let result = grammarList;

    // 검색 필터
    if (debouncedSearch) {
      const query = debouncedSearch.toLowerCase();
      result = result.filter(
        (g) =>
          g.title.toLowerCase().includes(query) ||
          (g.explanation && g.explanation.toLowerCase().includes(query)) ||
          (g.example_jp && g.example_jp.toLowerCase().includes(query)) ||
          (g.example_kr && g.example_kr.toLowerCase().includes(query))
      );
    }

    // 레벨 필터
    if (levelFilter) {
      result = result.filter((g) => g.level === levelFilter);
    }

    return result;
  }, [grammarList, debouncedSearch, levelFilter]);

  // 페이지네이션
  const totalPages = Math.ceil(filteredList.length / pageSize);
  const paginatedList = filteredList.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  // 상세 모달 열기
  const openDetailModal = (grammar: GrammarItem) => {
    setSelectedGrammar(grammar);
    setShowDetailModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-gray-600 hover:text-gray-900">
                ← 홈
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">문법</h1>
            </div>
            <div className="text-sm text-gray-500">
              읽기 전용 모드
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* 검색 및 필터 */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* 검색 */}
            <div className="flex-1">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="문법 검색 (제목, 설명, 예문)"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* JLPT 레벨 필터 */}
            <div className="flex gap-2 items-center">
              <span className="text-sm text-gray-600">레벨:</span>
              <select
                value={levelFilter}
                onChange={(e) => {
                  setLevelFilter(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">전체</option>
                {JLPT_LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 통계 */}
        <div className="mb-4 text-sm text-gray-600">
          총 {filteredList.length}개의 문법
          {debouncedSearch && ` (검색: "${debouncedSearch}")`}
          {levelFilter && ` (레벨: ${levelFilter})`}
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* 로딩 */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-purple-500 border-t-transparent"></div>
            <p className="mt-2 text-gray-600">로딩 중...</p>
          </div>
        ) : paginatedList.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500 text-lg">
              {debouncedSearch || levelFilter
                ? "검색 결과가 없습니다."
                : "등록된 문법이 없습니다."}
            </p>
          </div>
        ) : (
          <>
            {/* 문법 목록 */}
            <div className="space-y-4">
              {paginatedList.map((grammar) => (
                <div
                  key={grammar.id}
                  className="bg-white rounded-lg shadow p-4 hover:shadow-md transition cursor-pointer"
                  onClick={() => openDetailModal(grammar)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-xl font-bold text-gray-900">
                          {grammar.title}
                        </h3>
                        {grammar.level && (
                          <span
                            className={`px-2 py-0.5 text-xs font-medium rounded ${
                              JLPT_LEVEL_COLORS[grammar.level] || "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {grammar.level}
                          </span>
                        )}
                      </div>
                      {grammar.explanation && (
                        <p className="text-gray-600 mb-2">{grammar.explanation}</p>
                      )}
                      {grammar.example_jp && (
                        <div className="bg-gray-50 rounded p-2 mt-2">
                          <p className="text-gray-800 font-medium">{grammar.example_jp}</p>
                          {grammar.example_kr && (
                            <p className="text-gray-500 text-sm mt-1">
                              {grammar.example_kr}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 rounded bg-gray-100 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition"
                >
                  이전
                </button>
                <span className="px-3 py-1 text-gray-600">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1 rounded bg-gray-100 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition"
                >
                  다음
                </button>
              </div>
            )}
          </>
        )}

        {/* 네비게이션 */}
        <div className="mt-8 flex justify-center gap-4">
          <Link
            href="/"
            className="px-6 py-3 border border-gray-300 bg-white rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition"
          >
            홈으로
          </Link>
          <Link
            href="/review"
            className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition"
          >
            복습하기
          </Link>
        </div>
      </main>

      {/* 상세 보기 모달 */}
      {showDetailModal && selectedGrammar && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {selectedGrammar.title}
                  </h2>
                  {selectedGrammar.level && (
                    <span
                      className={`px-2 py-0.5 text-sm font-medium rounded ${
                        JLPT_LEVEL_COLORS[selectedGrammar.level] ||
                        "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {selectedGrammar.level}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              {selectedGrammar.explanation && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-500 mb-1">설명</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {selectedGrammar.explanation}
                  </p>
                </div>
              )}

              {selectedGrammar.example_jp && (
                <div className="bg-purple-50 rounded-lg p-4 mb-4">
                  <h3 className="text-sm font-medium text-purple-700 mb-2">예문</h3>
                  <p className="text-lg text-gray-900 mb-1">
                    {selectedGrammar.example_jp}
                  </p>
                  {selectedGrammar.example_kr && (
                    <p className="text-gray-600">{selectedGrammar.example_kr}</p>
                  )}
                </div>
              )}

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
