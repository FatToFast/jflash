"use client";

/**
 * Review Page - Minimal Japanese aesthetic
 * Clean flashcard interface with focus on content
 */

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  VocabItem,
  VocabType,
  getDueCards,
  getNewCards,
  updateSRS,
} from "@/lib/static-data";
import { speakJapanese, initializeVoices } from "@/lib/tts";

type SessionState = "loading" | "ready" | "studying" | "complete";
type ReviewMode = "normal" | "reverse" | "listening" | "cloze" | "sentence";

interface SessionResult {
  total: number;
  correct: number;
  incorrect: number;
}

function ReviewPageContent() {
  const searchParams = useSearchParams();
  const [sessionState, setSessionState] = useState<SessionState>("loading");
  const [cards, setCards] = useState<VocabItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [dueCount, setDueCount] = useState(0);
  const [isAnswering, setIsAnswering] = useState(false);

  const initialMode = (searchParams.get("mode") as ReviewMode) || "normal";
  const [reviewMode, setReviewMode] = useState<ReviewMode>(initialMode);
  const isSentenceMode = reviewMode === "sentence";

  const [sessionResult, setSessionResult] = useState<SessionResult>({
    total: 0,
    correct: 0,
    incorrect: 0,
  });

  const [isSpeaking, setIsSpeaking] = useState(false);

  const [shuffleEnabled, setShuffleEnabled] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("jflash_shuffle") === "true";
    }
    return false;
  });

  const currentCard = cards[currentIndex];

  // Load cards
  const loadCards = useCallback(async () => {
    setSessionState("loading");

    try {
      const vocabType: VocabType = isSentenceMode ? "sentence" : "word";
      const dueCards = await getDueCards(vocabType);
      const newCards = await getNewCards(vocabType, 5);

      const allCards = [...dueCards];
      newCards.forEach((card) => {
        if (!allCards.find((c) => c.id === card.id)) {
          allCards.push(card);
        }
      });

      setCards(allCards);
      setDueCount(allCards.length);
      setSessionState("ready");
    } catch (err) {
      console.error(err);
      setSessionState("ready");
    }
  }, [isSentenceMode]);

  useEffect(() => {
    loadCards();
  }, [loadCards]);

  useEffect(() => {
    initializeVoices();
  }, []);

  // Fisher-Yates shuffle
  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const flipCard = useCallback(() => {
    if (sessionState === "studying" && !isFlipped) {
      setIsFlipped(true);
    }
  }, [sessionState, isFlipped]);

  const handleAnswer = useCallback(
    async (known: boolean) => {
      if (!currentCard || isAnswering) return;

      setIsAnswering(true);

      try {
        updateSRS(currentCard.id, known ? 3 : 1);

        setSessionResult((prev) => ({
          total: prev.total + 1,
          correct: prev.correct + (known ? 1 : 0),
          incorrect: prev.incorrect + (known ? 0 : 1),
        }));

        if (currentIndex < cards.length - 1) {
          setCurrentIndex((prev) => prev + 1);
          setIsFlipped(false);
        } else {
          setSessionState("complete");
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsAnswering(false);
      }
    },
    [currentCard, currentIndex, cards.length, isAnswering]
  );

  const playPronunciation = useCallback(() => {
    if (!currentCard || isSpeaking) return;

    speakJapanese(currentCard.kanji, {
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  }, [currentCard, isSpeaking]);

  const playExampleSentence = useCallback(() => {
    if (!currentCard?.example_sentence || isSpeaking) return;

    speakJapanese(currentCard.example_sentence, {
      rate: 1.0,
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  }, [currentCard, isSpeaking]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (e.key) {
        case " ":
          e.preventDefault();
          flipCard();
          break;
        case "ArrowRight":
        case "Enter":
          if (isFlipped && !isAnswering) {
            e.preventDefault();
            handleAnswer(true);
          }
          break;
        case "ArrowLeft":
          if (isFlipped && !isAnswering) {
            e.preventDefault();
            handleAnswer(false);
          }
          break;
        case "p":
        case "P":
          e.preventDefault();
          playPronunciation();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [flipCard, handleAnswer, playPronunciation, isFlipped, isAnswering]);

  const startSession = () => {
    if (cards.length === 0) return;

    const targetCards = shuffleEnabled ? shuffleArray(cards) : cards;
    setCards(targetCards);
    setCurrentIndex(0);
    setIsFlipped(false);
    setSessionResult({ total: 0, correct: 0, incorrect: 0 });
    setSessionState("studying");

    if (reviewMode === "listening" && targetCards[0]) {
      setTimeout(() => {
        speakJapanese(targetCards[0].kanji);
      }, 500);
    }
  };

  const accuracy =
    sessionResult.total > 0
      ? Math.round((sessionResult.correct / sessionResult.total) * 100)
      : 0;

  // 빈칸 예문 생성
  const createClozeText = (sentence: string, word: string): string => {
    if (sentence.includes(word)) {
      return sentence.replace(word, "___");
    }
    const kanjiOnly = word.match(/[\u4e00-\u9faf]+/g)?.join("") || "";
    if (kanjiOnly && sentence.includes(kanjiOnly)) {
      const pattern = new RegExp(kanjiOnly + "[ぁ-んァ-ン]*");
      return sentence.replace(pattern, "___");
    }
    const stem = word.slice(0, -1);
    if (stem.length >= 2 && sentence.includes(stem)) {
      const escaped = stem.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const pattern = new RegExp(escaped + "[ぁ-んァ-ン]*");
      return sentence.replace(pattern, "___");
    }
    return sentence;
  };

  // 모드 라벨
  const getModeLabel = (mode: ReviewMode): string => {
    switch (mode) {
      case "normal": return "기본";
      case "reverse": return "역방향";
      case "listening": return "듣기";
      case "cloze": return "빈칸";
      case "sentence": return "문장";
    }
  };

  // Render card front
  const renderFront = () => {
    if (!currentCard) return null;

    if (reviewMode === "reverse") {
      return (
        <div className="flex flex-col items-center justify-center h-full">
          <p className="text-lg text-neutral-600">{currentCard.meaning}</p>
          <p className="mt-8 text-xs text-neutral-400">이 의미의 단어는?</p>
        </div>
      );
    }

    if (reviewMode === "listening") {
      return (
        <div className="flex flex-col items-center justify-center h-full">
          <button
            onClick={(e) => {
              e.stopPropagation();
              playPronunciation();
            }}
            className="w-16 h-16 flex items-center justify-center border border-neutral-200 rounded-full hover:bg-neutral-50 transition-colors"
          >
            <span className="text-2xl">{isSpeaking ? "◉" : "▶"}</span>
          </button>
          <p className="mt-8 text-xs text-neutral-400">발음을 듣고 맞춰보세요</p>
        </div>
      );
    }

    if (reviewMode === "cloze") {
      if (!currentCard.example_sentence) {
        return (
          <div className="flex flex-col items-center justify-center h-full">
            <p className="text-sm text-neutral-400">예문이 없습니다</p>
          </div>
        );
      }
      return (
        <div className="flex flex-col items-center justify-center h-full px-4">
          <p className="text-xl text-center leading-relaxed">
            {createClozeText(currentCard.example_sentence, currentCard.kanji)}
          </p>
          {currentCard.example_meaning && (
            <p className="mt-4 text-sm text-neutral-500">
              {currentCard.example_meaning}
            </p>
          )}
          <p className="mt-8 text-xs text-neutral-400">빈칸에 들어갈 단어는?</p>
        </div>
      );
    }

    // normal & sentence
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p className={`${isSentenceMode ? "text-xl leading-relaxed text-center" : "text-4xl"}`}>
          {currentCard.kanji}
        </p>
        <p className="mt-8 text-xs text-neutral-400">탭하여 확인</p>
      </div>
    );
  };

  // Render card back
  const renderBack = () => {
    if (!currentCard) return null;

    return (
      <div className="flex flex-col items-center justify-center h-full space-y-3">
        <p className={`${isSentenceMode ? "text-xl leading-relaxed text-center" : "text-3xl"}`}>
          {currentCard.kanji}
        </p>
        <p className="text-lg text-neutral-500">{currentCard.reading}</p>
        <p className="text-base text-neutral-700">{currentCard.meaning}</p>

        {currentCard.example_sentence && !isSentenceMode && (
          <div className="mt-6 pt-6 border-t border-neutral-100 w-full text-center">
            <button
              onClick={(e) => {
                e.stopPropagation();
                playExampleSentence();
              }}
              className="group text-sm text-neutral-500 hover:text-neutral-700 transition-colors"
            >
              <span className="inline-flex items-center gap-1">
                <span className="text-neutral-300 group-hover:text-neutral-500 transition-colors">▶</span>
                {currentCard.example_sentence}
              </span>
            </button>
            {currentCard.example_meaning && (
              <p className="mt-1 text-xs text-neutral-400">
                {currentCard.example_meaning}
              </p>
            )}
          </div>
        )}

        {currentCard.notes && (
          <div className="mt-4 pt-4 border-t border-neutral-100 w-full">
            <div className="text-xs text-neutral-500 text-left space-y-1">
              {currentCard.notes.split("\n").map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

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
          <h1 className="mt-3 text-lg">
            {isSentenceMode ? "文章" : "単語"}
          </h1>
        </header>

        {/* Loading */}
        {sessionState === "loading" && (
          <div className="py-20 text-center">
            <p className="text-sm text-neutral-400">불러오는 중...</p>
          </div>
        )}

        {/* Ready */}
        {sessionState === "ready" && (
          <div className="space-y-8">
            {/* Count */}
            <div className="text-center py-12 border-y border-neutral-100">
              <p className="text-4xl">{dueCount}</p>
              <p className="mt-2 text-xs text-neutral-400">
                복습할 {isSentenceMode ? "문장" : "단어"}
              </p>
            </div>

            {/* Mode selection (word mode only) */}
            {!isSentenceMode && (
              <div className="space-y-3">
                <p className="text-xs text-neutral-400">모드</p>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { value: "normal", label: "기본" },
                    { value: "reverse", label: "역방향" },
                    { value: "listening", label: "듣기" },
                    { value: "cloze", label: "빈칸" },
                  ].map((mode) => (
                    <button
                      key={mode.value}
                      onClick={() => setReviewMode(mode.value as ReviewMode)}
                      className={`flex-1 py-2 text-sm border transition-colors ${
                        reviewMode === mode.value
                          ? "border-neutral-900 bg-neutral-900 text-white"
                          : "border-neutral-200 text-neutral-600 hover:border-neutral-400"
                      }`}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Shuffle option */}
            <div className="flex items-center justify-between py-3 border-b border-neutral-100">
              <span className="text-sm text-neutral-600">순서 섞기</span>
              <button
                onClick={() => {
                  const newValue = !shuffleEnabled;
                  setShuffleEnabled(newValue);
                  localStorage.setItem("jflash_shuffle", String(newValue));
                }}
                className={`w-10 h-5 rounded-full transition-colors relative ${
                  shuffleEnabled ? "bg-neutral-900" : "bg-neutral-200"
                }`}
              >
                <span
                  className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                    shuffleEnabled ? "left-5" : "left-0.5"
                  }`}
                />
              </button>
            </div>

            {/* Start button */}
            {dueCount > 0 ? (
              <button
                onClick={startSession}
                className="w-full py-4 text-sm bg-neutral-900 text-white hover:bg-neutral-800 transition-colors"
              >
                시작
              </button>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-neutral-500">
                  복습할 항목이 없습니다
                </p>
                <Link
                  href="/vocab"
                  className="inline-block mt-4 text-sm text-neutral-400 hover:text-neutral-600 transition-colors"
                >
                  단어장 보기 →
                </Link>
              </div>
            )}

            {/* Shortcuts */}
            <div className="text-xs text-neutral-400 space-y-1">
              <p>Space: 뒤집기 / ←→: 모름·앎 / P: 발음</p>
            </div>
          </div>
        )}

        {/* Studying */}
        {sessionState === "studying" && currentCard && (
          <div className="space-y-6">
            {/* Progress */}
            <div className="flex items-center justify-between text-xs text-neutral-400">
              <span>
                {currentIndex + 1} / {cards.length}
              </span>
              <span>
                {sessionResult.correct}○ {sessionResult.incorrect}×
              </span>
            </div>

            {/* Progress bar */}
            <div className="h-px bg-neutral-100">
              <div
                className="h-px bg-neutral-900 transition-all"
                style={{
                  width: `${((currentIndex + 1) / cards.length) * 100}%`,
                }}
              />
            </div>

            {/* Card */}
            <div
              onClick={!isFlipped ? flipCard : undefined}
              className={`relative min-h-[320px] border border-neutral-200 p-8 ${
                !isFlipped ? "cursor-pointer hover:border-neutral-400" : ""
              } transition-colors`}
            >
              {/* Mode indicator */}
              <span className="absolute top-3 left-3 text-[10px] text-neutral-300">
                {getModeLabel(reviewMode)}
              </span>
              {!isFlipped ? renderFront() : renderBack()}
            </div>

            {/* TTS button */}
            {reviewMode !== "listening" && (
              <button
                onClick={playPronunciation}
                disabled={isSpeaking}
                className="text-xs text-neutral-400 hover:text-neutral-600 transition-colors disabled:opacity-50"
              >
                {isSpeaking ? "재생 중..." : "▶ 발음 듣기"}
              </button>
            )}

            {/* Answer buttons */}
            {isFlipped && (
              <div className="flex gap-3">
                <button
                  onClick={() => handleAnswer(false)}
                  disabled={isAnswering}
                  className="flex-1 py-4 text-sm border border-neutral-300 text-neutral-600 hover:bg-neutral-50 transition-colors disabled:opacity-50"
                >
                  모름
                </button>
                <button
                  onClick={() => handleAnswer(true)}
                  disabled={isAnswering}
                  className="flex-1 py-4 text-sm bg-neutral-900 text-white hover:bg-neutral-800 transition-colors disabled:opacity-50"
                >
                  앎
                </button>
              </div>
            )}
          </div>
        )}

        {/* Complete */}
        {sessionState === "complete" && (
          <div className="space-y-8">
            <div className="text-center py-12 border-y border-neutral-100">
              <p className="text-4xl">{accuracy}%</p>
              <p className="mt-2 text-xs text-neutral-400">정답률</p>
            </div>

            <div className="flex justify-center gap-8 text-center">
              <div>
                <p className="text-2xl">{sessionResult.correct}</p>
                <p className="text-xs text-neutral-400">정답</p>
              </div>
              <div>
                <p className="text-2xl">{sessionResult.incorrect}</p>
                <p className="text-xs text-neutral-400">오답</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  loadCards();
                  setSessionResult({ total: 0, correct: 0, incorrect: 0 });
                }}
                className="flex-1 py-4 text-sm border border-neutral-300 text-neutral-600 hover:bg-neutral-50 transition-colors"
              >
                다시
              </button>
              <Link
                href="/"
                className="flex-1 py-4 text-sm bg-neutral-900 text-white hover:bg-neutral-800 transition-colors text-center"
              >
                홈
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function ReviewPageLoading() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <p className="text-sm text-neutral-400">로딩 중...</p>
    </div>
  );
}

export default function ReviewPage() {
  return (
    <Suspense fallback={<ReviewPageLoading />}>
      <ReviewPageContent />
    </Suspense>
  );
}
