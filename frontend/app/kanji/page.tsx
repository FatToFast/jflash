"use client";

/**
 * Kanji Learning Page
 * JLPT+ style kanji learning with grid/flashcard views
 */

import { useState, useMemo, useCallback, useEffect } from "react";
import Link from "next/link";
import {
  getAllKanji,
  getKanjiByLevel,
  KanjiInfo,
  getKanjiCount,
} from "@/lib/kanji-data";
import { BottomSheet } from "@/components/BottomSheet";
import { ProgressGauge } from "@/components/ProgressGauge";
import { speakJapanese } from "@/lib/tts";

type ViewMode = "grid" | "flashcard";
type JLPTLevel = 5 | 4 | 3 | 2 | 1 | "all";

export default function KanjiPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [jlptLevel, setJlptLevel] = useState<JLPTLevel>("all");
  const [selectedKanji, setSelectedKanji] = useState<KanjiInfo | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Flashcard state
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showOn, setShowOn] = useState(true);
  const [showKun, setShowKun] = useState(true);

  // Get kanji list based on level
  const kanjiList = useMemo(() => {
    if (jlptLevel === "all") {
      return getAllKanji();
    }
    return getKanjiByLevel(jlptLevel);
  }, [jlptLevel]);

  const currentKanji = kanjiList[flashcardIndex];

  const nextCard = useCallback(() => {
    if (flashcardIndex < kanjiList.length - 1) {
      setFlashcardIndex((prev) => prev + 1);
      setIsFlipped(false);
    }
  }, [flashcardIndex, kanjiList.length]);

  const prevCard = useCallback(() => {
    if (flashcardIndex > 0) {
      setFlashcardIndex((prev) => prev - 1);
      setIsFlipped(false);
    }
  }, [flashcardIndex]);

  // Keyboard shortcuts for flashcard mode
  useEffect(() => {
    if (viewMode !== "flashcard") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case " ":
          e.preventDefault();
          setIsFlipped((prev) => !prev);
          break;
        case "ArrowRight":
        case "Enter":
          e.preventDefault();
          nextCard();
          break;
        case "ArrowLeft":
          e.preventDefault();
          prevCard();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [viewMode, nextCard, prevCard]);

  const speakReading = (text: string) => {
    if (isSpeaking) return;
    speakJapanese(text, {
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  };

  const openKanjiDetail = (kanji: KanjiInfo) => {
    setSelectedKanji(kanji);
    setIsDetailOpen(true);
  };

  return (
    <div className="min-h-screen bg-white">
      <main className="mx-auto max-w-sm px-6 py-12">
        {/* Header */}
        <header className="mb-8">
          <Link
            href="/"
            className="text-[10px] tracking-[0.3em] text-neutral-500 hover:text-neutral-600 transition-colors"
          >
            ← J-FLASH
          </Link>
          <h1 className="mt-3 text-lg">漢字</h1>
          <p className="mt-1 text-xs text-neutral-500">
            {getKanjiCount()}개의 한자
          </p>
        </header>

        {/* Controls */}
        <div className="space-y-4 mb-8">
          {/* JLPT Level Filter */}
          <div className="space-y-2">
            <p className="text-xs text-neutral-500">레벨</p>
            <div className="flex gap-1">
              {(["all", 5, 4] as JLPTLevel[]).map((level) => (
                <button
                  key={level}
                  onClick={() => {
                    setJlptLevel(level);
                    setFlashcardIndex(0);
                    setIsFlipped(false);
                  }}
                  className={`flex-1 py-2 text-xs border transition-colors ${
                    jlptLevel === level
                      ? "border-neutral-900 bg-neutral-900 text-white"
                      : "border-neutral-200 text-neutral-600 hover:border-neutral-400"
                  }`}
                >
                  {level === "all" ? "전체" : `N${level}`}
                </button>
              ))}
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="space-y-2">
            <p className="text-xs text-neutral-500">보기</p>
            <div className="flex gap-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`flex-1 py-2 text-xs border transition-colors ${
                  viewMode === "grid"
                    ? "border-neutral-900 bg-neutral-900 text-white"
                    : "border-neutral-200 text-neutral-600 hover:border-neutral-400"
                }`}
              >
                그리드
              </button>
              <button
                onClick={() => {
                  setViewMode("flashcard");
                  setFlashcardIndex(0);
                  setIsFlipped(false);
                }}
                className={`flex-1 py-2 text-xs border transition-colors ${
                  viewMode === "flashcard"
                    ? "border-neutral-900 bg-neutral-900 text-white"
                    : "border-neutral-200 text-neutral-600 hover:border-neutral-400"
                }`}
              >
                플래시카드
              </button>
            </div>
          </div>
        </div>

        {/* Grid View */}
        {viewMode === "grid" && (
          <div className="space-y-4">
            <p className="text-xs text-neutral-500">{kanjiList.length}개</p>
            <div className="grid grid-cols-5 gap-2">
              {kanjiList.map((kanji) => (
                <button
                  key={kanji.character}
                  onClick={() => openKanjiDetail(kanji)}
                  className="aspect-square flex items-center justify-center text-2xl border border-neutral-100 hover:border-neutral-300 hover:bg-neutral-50 transition-colors rounded"
                >
                  {kanji.character}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Flashcard View */}
        {viewMode === "flashcard" && kanjiList.length > 0 && currentKanji && (
          <div className="space-y-6">
            {/* Progress */}
            <div className="flex items-center justify-between">
              <ProgressGauge
                current={flashcardIndex + 1}
                total={kanjiList.length}
                size={40}
                strokeWidth={3}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setShowOn(!showOn)}
                  className={`px-3 py-1.5 text-xs border rounded-full transition-colors ${
                    showOn
                      ? "border-neutral-900 bg-neutral-900 text-white"
                      : "border-neutral-300 text-neutral-500"
                  }`}
                >
                  음독
                </button>
                <button
                  onClick={() => setShowKun(!showKun)}
                  className={`px-3 py-1.5 text-xs border rounded-full transition-colors ${
                    showKun
                      ? "border-neutral-900 bg-neutral-900 text-white"
                      : "border-neutral-300 text-neutral-500"
                  }`}
                >
                  훈독
                </button>
              </div>
            </div>

            {/* Card */}
            <div
              onClick={() => setIsFlipped(!isFlipped)}
              className="min-h-[320px] border border-neutral-200 p-8 cursor-pointer hover:border-neutral-400 transition-colors"
            >
              {!isFlipped ? (
                /* Front - Kanji character */
                <div className="flex flex-col items-center justify-center h-full">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      speakReading(currentKanji.character);
                    }}
                    className="group"
                  >
                    <span className="text-7xl">{currentKanji.character}</span>
                    <span className="block mt-2 text-xs text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      🔊
                    </span>
                  </button>
                  <p className="mt-8 text-xs text-neutral-500">탭하여 확인</p>
                </div>
              ) : (
                /* Back - Readings and meanings */
                <div className="flex flex-col items-center justify-center h-full space-y-4">
                  <span className="text-5xl">{currentKanji.character}</span>

                  {/* Meanings */}
                  <p className="text-base text-neutral-700">
                    {currentKanji.meanings_ko.join(", ")}
                  </p>

                  {/* On readings */}
                  {showOn && currentKanji.on_readings.length > 0 && (
                    <div className="text-center">
                      <p className="text-xs text-neutral-400 mb-1">음독 (オン)</p>
                      <div className="flex flex-wrap justify-center gap-2">
                        {currentKanji.on_readings.map((reading, i) => (
                          <button
                            key={i}
                            onClick={(e) => {
                              e.stopPropagation();
                              speakReading(reading);
                            }}
                            className="px-2 py-1 text-sm text-neutral-600 bg-neutral-50 rounded hover:bg-neutral-100 transition-colors"
                          >
                            {reading}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Kun readings */}
                  {showKun && currentKanji.kun_readings.length > 0 && (
                    <div className="text-center">
                      <p className="text-xs text-neutral-400 mb-1">훈독 (くん)</p>
                      <div className="flex flex-wrap justify-center gap-2">
                        {currentKanji.kun_readings.map((reading, i) => (
                          <button
                            key={i}
                            onClick={(e) => {
                              e.stopPropagation();
                              speakReading(reading.replace(/\./g, ""));
                            }}
                            className="px-2 py-1 text-sm text-neutral-600 bg-neutral-50 rounded hover:bg-neutral-100 transition-colors"
                          >
                            {reading}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Meta info */}
                  <div className="flex gap-4 text-xs text-neutral-400 pt-4">
                    <span>{currentKanji.strokes}획</span>
                    {currentKanji.jlpt_level > 0 && (
                      <span>N{currentKanji.jlpt_level}</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="flex gap-3">
              <button
                onClick={prevCard}
                disabled={flashcardIndex === 0}
                className="flex-1 py-4 text-sm border border-neutral-300 text-neutral-600 hover:bg-neutral-50 transition-colors disabled:opacity-30"
              >
                ← 이전
              </button>
              <button
                onClick={() => openKanjiDetail(currentKanji)}
                className="flex-1 py-4 text-sm border border-neutral-300 text-neutral-600 hover:bg-neutral-50 transition-colors"
              >
                상세
              </button>
              <button
                onClick={nextCard}
                disabled={flashcardIndex === kanjiList.length - 1}
                className="flex-1 py-4 text-sm bg-neutral-900 text-white hover:bg-neutral-800 transition-colors disabled:opacity-30"
              >
                다음 →
              </button>
            </div>

            {/* Shortcuts */}
            <p className="text-xs text-neutral-500 text-center">
              Space: 뒤집기 / ←→: 이전·다음
            </p>
          </div>
        )}

        {/* Empty state */}
        {kanjiList.length === 0 && (
          <div className="text-center py-12">
            <p className="text-sm text-neutral-500">
              해당 레벨의 한자가 없습니다
            </p>
          </div>
        )}

        {/* Kanji Detail Bottom Sheet */}
        <BottomSheet
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title="한자 상세"
        >
          {selectedKanji && (
            <KanjiDetailContent kanji={selectedKanji} />
          )}
        </BottomSheet>
      </main>
    </div>
  );
}

/**
 * Kanji Detail Content for Bottom Sheet
 */
function KanjiDetailContent({ kanji }: { kanji: KanjiInfo }) {
  const [isSpeaking, setIsSpeaking] = useState(false);

  const speakReading = (text: string) => {
    if (isSpeaking) return;
    speakJapanese(text, {
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  };

  return (
    <div className="space-y-6">
      {/* Character */}
      <div className="text-center">
        <button
          onClick={() => speakReading(kanji.character)}
          className="group"
        >
          <span className="text-6xl">{kanji.character}</span>
          <span className="block mt-2 text-xs text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity">
            {isSpeaking ? "재생 중..." : "🔊 발음 듣기"}
          </span>
        </button>
        <p className="mt-4 text-lg text-neutral-700">
          {kanji.meanings_ko.join(", ")}
        </p>
        <div className="mt-2 flex justify-center gap-2 text-xs text-neutral-500">
          <span>{kanji.strokes}획</span>
          {kanji.jlpt_level > 0 && <span>N{kanji.jlpt_level}</span>}
        </div>
      </div>

      {/* On readings */}
      {kanji.on_readings.length > 0 && (
        <div className="border-t border-neutral-100 pt-6">
          <h3 className="text-sm font-medium text-neutral-600 mb-3">
            음독 (オン)
          </h3>
          <div className="flex flex-wrap gap-2">
            {kanji.on_readings.map((reading, i) => (
              <button
                key={i}
                onClick={() => speakReading(reading)}
                className="px-3 py-2 text-sm border border-neutral-200 rounded hover:bg-neutral-50 transition-colors"
              >
                {reading}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Kun readings */}
      {kanji.kun_readings.length > 0 && (
        <div className="border-t border-neutral-100 pt-6">
          <h3 className="text-sm font-medium text-neutral-600 mb-3">
            훈독 (くん)
          </h3>
          <div className="flex flex-wrap gap-2">
            {kanji.kun_readings.map((reading, i) => (
              <button
                key={i}
                onClick={() => speakReading(reading.replace(/\./g, ""))}
                className="px-3 py-2 text-sm border border-neutral-200 rounded hover:bg-neutral-50 transition-colors"
              >
                {reading}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* English meanings */}
      {kanji.meanings.length > 0 && (
        <div className="border-t border-neutral-100 pt-6">
          <h3 className="text-sm font-medium text-neutral-600 mb-3">
            영어 의미
          </h3>
          <p className="text-sm text-neutral-600">
            {kanji.meanings.join(", ")}
          </p>
        </div>
      )}

      {/* External links */}
      <div className="border-t border-neutral-100 pt-6">
        <h3 className="text-sm font-medium text-neutral-600 mb-3">외부 링크</h3>
        <div className="flex gap-3">
          <a
            href={`https://jisho.org/search/${encodeURIComponent(kanji.character)}%20%23kanji`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-2.5 text-sm text-center border border-neutral-200 rounded hover:bg-neutral-50 transition-colors"
          >
            Jisho
          </a>
          <a
            href={`https://www.wanikani.com/kanji/${encodeURIComponent(kanji.character)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-2.5 text-sm text-center border border-neutral-200 rounded hover:bg-neutral-50 transition-colors"
          >
            WaniKani
          </a>
        </div>
      </div>
    </div>
  );
}
