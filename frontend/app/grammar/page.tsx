"use client";

/**
 * Grammar Page - Minimal Japanese aesthetic
 */

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { GrammarItem, loadGrammar } from "@/lib/static-data";
import { JLPT_LEVELS } from "@/lib/constants";

export default function GrammarPage() {
  const [grammarList, setGrammarList] = useState<GrammarItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [selectedGrammar, setSelectedGrammar] = useState<GrammarItem | null>(
    null
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    const fetchGrammar = async () => {
      setLoading(true);
      try {
        const data = await loadGrammar();
        setGrammarList(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchGrammar();
  }, []);

  const filteredList = useMemo(() => {
    let result = grammarList;
    if (debouncedSearch) {
      const query = debouncedSearch.toLowerCase();
      result = result.filter(
        (g) =>
          g.title.toLowerCase().includes(query) ||
          (g.explanation && g.explanation.toLowerCase().includes(query)) ||
          (g.example_jp && g.example_jp.toLowerCase().includes(query))
      );
    }
    if (levelFilter) {
      result = result.filter((g) => g.level === levelFilter);
    }
    return result;
  }, [grammarList, debouncedSearch, levelFilter]);

  const totalPages = Math.ceil(filteredList.length / pageSize);
  const paginatedList = filteredList.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  return (
    <div className="min-h-screen bg-white">
      <main className="mx-auto max-w-2xl px-6 py-12">
        {/* Header */}
        <header className="mb-12">
          <Link
            href="/"
            className="text-[10px] tracking-[0.3em] text-neutral-500 hover:text-neutral-600 transition-colors"
          >
            ← J-FLASH
          </Link>
          <h1 className="mt-3 text-lg ">文法</h1>
          <p className="mt-1 text-xs text-neutral-500">
            {filteredList.length}개
          </p>
        </header>

        {/* Level filter */}
        <div className="mb-6 flex gap-2 flex-wrap">
          <button
            onClick={() => {
              setLevelFilter("");
              setPage(1);
            }}
            className={`px-3 py-1 text-xs transition-colors ${
              levelFilter === ""
                ? "bg-neutral-900 text-white"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
            }`}
          >
            전체
          </button>
          {JLPT_LEVELS.map((level) => (
            <button
              key={level}
              onClick={() => {
                setLevelFilter(level);
                setPage(1);
              }}
              className={`px-3 py-1 text-xs transition-colors ${
                levelFilter === level
                  ? "bg-neutral-900 text-white"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              }`}
            >
              {level}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="mb-8">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="검색..."
            className="w-full border-b border-neutral-200 bg-transparent py-2 text-sm outline-none placeholder:text-neutral-400 focus:border-neutral-900"
          />
        </div>

        {/* Loading */}
        {loading && (
          <div className="py-20 text-center">
            <p className="text-sm text-neutral-500">불러오는 중...</p>
          </div>
        )}

        {/* Empty */}
        {!loading && paginatedList.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-sm text-neutral-500">
              {debouncedSearch || levelFilter ? "검색 결과 없음" : "문법 없음"}
            </p>
          </div>
        )}

        {/* List */}
        {!loading && paginatedList.length > 0 && (
          <div className="space-y-px border-t border-neutral-100">
            {paginatedList.map((grammar) => (
              <button
                key={grammar.id}
                onClick={() => setSelectedGrammar(grammar)}
                className="w-full text-left border-b border-neutral-100 py-4 hover:bg-neutral-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">{grammar.title}</span>
                  {grammar.level && (
                    <span className="text-[10px] text-neutral-500">
                      {grammar.level}
                    </span>
                  )}
                </div>
                {grammar.explanation && (
                  <p className="mt-1 text-xs text-neutral-500 truncate">
                    {grammar.explanation}
                  </p>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-4">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="text-xs text-neutral-500 hover:text-neutral-600 disabled:opacity-30"
            >
              ←
            </button>
            <span className="text-xs text-neutral-500">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="text-xs text-neutral-500 hover:text-neutral-600 disabled:opacity-30"
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

      {/* Detail modal */}
      {selectedGrammar && (
        <div
          className="fixed inset-0 bg-black/30 flex items-center justify-center p-6 z-50"
          onClick={() => setSelectedGrammar(null)}
        >
          <div
            className="bg-white max-w-lg w-full max-h-[80vh] overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <h2 className="text-lg ">{selectedGrammar.title}</h2>
                {selectedGrammar.level && (
                  <span className="text-xs text-neutral-500">
                    {selectedGrammar.level}
                  </span>
                )}
              </div>
              <button
                onClick={() => setSelectedGrammar(null)}
                className="text-neutral-500 hover:text-neutral-600"
              >
                ×
              </button>
            </div>

            {selectedGrammar.explanation && (
              <div className="mb-6">
                <p className="text-sm text-neutral-600 whitespace-pre-wrap">
                  {selectedGrammar.explanation}
                </p>
              </div>
            )}

            {selectedGrammar.example_jp && (
              <div className="border-t border-neutral-100 pt-4">
                <p className="text-base">{selectedGrammar.example_jp}</p>
                {selectedGrammar.example_kr && (
                  <p className="mt-1 text-sm text-neutral-500">
                    {selectedGrammar.example_kr}
                  </p>
                )}
              </div>
            )}

            <button
              onClick={() => setSelectedGrammar(null)}
              className="mt-8 w-full py-3 text-sm bg-neutral-900 text-white hover:bg-neutral-800 transition-colors"
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
