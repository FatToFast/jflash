"use client";

/**
 * Review Page - Flashcard Review System (Static Version for Vercel)
 *
 * Vercel 배포용 - localStorage 기반 SRS 상태 관리
 *
 * 두 가지 모드:
 * 1. 단어 복습 (/review): 단어만 (pos≠"文"), 모드 4종
 *    - normal: 일본어 → 읽기/의미
 *    - reverse: 의미 → 일본어/읽기
 *    - listening: TTS → 일본어/의미
 *    - cloze: 빈칸 예문 → 단어
 *
 * 2. 문장 복습 (/review?mode=sentence): 문장만 (pos="文")
 */

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  VocabItem,
  getDueCards,
  getNewCards,
  updateSRS,
  getStats,
} from "@/lib/static-data";
import { TTS_CONFIG } from "@/lib/constants";

type SessionState = "loading" | "ready" | "studying" | "complete";

/** 복습 모드 타입 */
type ReviewMode = "normal" | "reverse" | "listening" | "cloze" | "sentence";

/** 단어 복습 모드 설정 (문장 모드 제외) */
const WORD_REVIEW_MODES: { value: ReviewMode; label: string; icon: string; description: string }[] = [
  { value: "normal", label: "기본", icon: "📖", description: "일본어 → 의미" },
  { value: "reverse", label: "역방향", icon: "🔄", description: "의미 → 일본어" },
  { value: "listening", label: "듣기", icon: "🎧", description: "발음 → 단어" },
  { value: "cloze", label: "빈칸", icon: "✏️", description: "예문 빈칸 채우기" },
];

interface SessionResult {
  total: number;
  correct: number;
  incorrect: number;
}

interface ReviewStats {
  due_now: number;
  due_today: number;
  total_learned: number;
  total_mastered: number;
}

function ReviewPageContent() {
  const searchParams = useSearchParams();
  const [sessionState, setSessionState] = useState<SessionState>("loading");
  const [cards, setCards] = useState<VocabItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAnswering, setIsAnswering] = useState(false);

  // URL 파라미터에서 초기 모드 설정 (예: ?mode=sentence)
  const initialMode = (searchParams.get("mode") as ReviewMode) || "normal";
  const [reviewMode, setReviewMode] = useState<ReviewMode>(initialMode);

  // 세션 결과
  const [sessionResult, setSessionResult] = useState<SessionResult>({
    total: 0,
    correct: 0,
    incorrect: 0,
  });

  // TTS 재생 상태
  const [isSpeaking, setIsSpeaking] = useState(false);

  // 현재 카드
  const currentCard = cards[currentIndex];

  // 문장 모드 여부 (URL 파라미터로 결정)
  const isSentenceMode = reviewMode === "sentence";

  // 빈칸 모드용 카드 필터링 (예문 있는 카드만)
  const clozeAvailableCards = cards.filter((c) => c.example_sentence);

  // 현재 모드에 맞는 복습 모드 목록
  const availableModes = isSentenceMode
    ? [{ value: "sentence" as ReviewMode, label: "문장", icon: "💬", description: "문장 암기" }]
    : WORD_REVIEW_MODES;

  /**
   * 빈칸 예문 생성
   * 단어(또는 한자 부분)를 ___ 로 대체
   *
   * 예: 食べる → 食べます 에서 "食べ" 부분을 찾아서 대체
   */
  const createClozeText = (sentence: string, word: string): string => {
    // 1. 정확히 일치하면 그대로 대체
    if (sentence.includes(word)) {
      return sentence.replace(word, '___');
    }

    // 2. 한자 부분만 추출해서 매칭 시도 (동사 활용 대응)
    const kanjiOnly = word.match(/[\u4e00-\u9faf]+/g)?.join('') || '';
    if (kanjiOnly && sentence.includes(kanjiOnly)) {
      // 한자 + 뒤따르는 히라가나까지 포함해서 대체
      const pattern = new RegExp(kanjiOnly + '[ぁ-んァ-ン]*');
      return sentence.replace(pattern, '___');
    }

    // 3. 단어 앞부분(어간)으로 매칭 시도 (예: 食べる → 食べ)
    const stem = word.slice(0, -1);
    if (stem.length >= 2 && sentence.includes(stem)) {
      const escaped = stem.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const pattern = new RegExp(escaped + '[ぁ-んァ-ン]*');
      return sentence.replace(pattern, '___');
    }

    // 4. 매칭 실패 시 원문 그대로
    return sentence;
  };

  /**
   * 모드별 앞면 렌더링
   */
  const renderCardFront = () => {
    if (!currentCard) return null;

    switch (reviewMode) {
      case "normal":
        return (
          <div className="flex flex-col items-center justify-center h-full">
            <p className="text-6xl font-bold">{currentCard.kanji}</p>
            <p className="mt-6 text-stone-400">클릭하거나 스페이스바를 눌러 뒤집기</p>
          </div>
        );

      case "reverse":
        return (
          <div className="flex flex-col items-center justify-center h-full">
            <p className="text-3xl font-semibold text-stone-700">
              {currentCard.meaning || "의미 없음"}
            </p>
            {currentCard.pos && (
              <span className="mt-4 inline-block rounded-full bg-stone-100 px-3 py-1 text-sm text-stone-600">
                {currentCard.pos}
              </span>
            )}
            <p className="mt-6 text-stone-400">이 의미의 일본어 단어는?</p>
          </div>
        );

      case "listening":
        return (
          <div className="flex flex-col items-center justify-center h-full">
            <button
              onClick={(e) => {
                e.stopPropagation();
                playPronunciation();
              }}
              className="flex h-24 w-24 items-center justify-center rounded-full bg-amber-100 text-5xl transition hover:bg-amber-200"
            >
              {isSpeaking ? "🔊" : "🔈"}
            </button>
            <p className="mt-6 text-stone-600">발음을 듣고 단어를 맞춰보세요</p>
            <p className="mt-2 text-stone-400">클릭하여 다시 재생</p>
          </div>
        );

      case "cloze":
        if (!currentCard.example_sentence) {
          return (
            <div className="flex flex-col items-center justify-center h-full">
              <p className="text-stone-400">예문이 없는 카드입니다</p>
            </div>
          );
        }
        return (
          <div className="flex flex-col items-center justify-center h-full px-4">
            <p className="text-2xl text-center leading-relaxed">
              {createClozeText(currentCard.example_sentence, currentCard.kanji)}
            </p>
            {currentCard.example_meaning && (
              <p className="mt-4 text-lg text-stone-500">
                ({currentCard.example_meaning})
              </p>
            )}
            <p className="mt-6 text-stone-400">빈칸에 들어갈 단어는?</p>
          </div>
        );

      case "sentence":
        return (
          <div className="flex flex-col items-center justify-center h-full px-4">
            <p className="text-2xl text-center leading-relaxed font-medium">
              {currentCard.kanji}
            </p>
            <p className="mt-6 text-stone-400">이 문장의 의미는?</p>
          </div>
        );
    }
  };

  /**
   * 모드별 뒷면 렌더링
   */
  const renderCardBack = () => {
    if (!currentCard) return null;

    switch (reviewMode) {
      case "normal":
        return (
          <div className="flex flex-col items-center justify-center h-full space-y-4">
            <p className="text-5xl font-bold">{currentCard.kanji}</p>
            <p className="text-2xl text-amber-600">{currentCard.reading || "-"}</p>
            <p className="text-xl text-stone-700">
              {currentCard.meaning || <span className="italic text-stone-400">의미 미입력</span>}
            </p>
            {currentCard.pos && (
              <span className="inline-block rounded-full bg-stone-100 px-3 py-1 text-sm text-stone-600">
                {currentCard.pos}
              </span>
            )}
            {/* 예문 표시 */}
            {currentCard.example_sentence && (
              <div className="mt-4 w-full border-t pt-4">
                <div className="flex items-center justify-center gap-2">
                  <p className="text-lg text-center text-stone-600">
                    {currentCard.example_sentence}
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      playExampleSentence();
                    }}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-stone-100 text-stone-500 transition hover:bg-amber-100 hover:text-amber-600"
                    title="예문 발음 재생"
                  >
                    🔊
                  </button>
                </div>
                {currentCard.example_meaning && (
                  <p className="mt-2 text-sm text-center text-stone-400">
                    {currentCard.example_meaning}
                  </p>
                )}
              </div>
            )}
          </div>
        );

      case "reverse":
        return (
          <div className="flex flex-col items-center justify-center h-full space-y-4">
            <p className="text-5xl font-bold">{currentCard.kanji}</p>
            <p className="text-2xl text-amber-600">{currentCard.reading || "-"}</p>
            <p className="text-lg text-stone-500">{currentCard.meaning}</p>
            {/* 예문 표시 */}
            {currentCard.example_sentence && (
              <div className="mt-4 w-full border-t pt-4">
                <div className="flex items-center justify-center gap-2">
                  <p className="text-lg text-center text-stone-600">
                    {currentCard.example_sentence}
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      playExampleSentence();
                    }}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-stone-100 text-stone-500 transition hover:bg-amber-100 hover:text-amber-600"
                    title="예문 발음 재생"
                  >
                    🔊
                  </button>
                </div>
                {currentCard.example_meaning && (
                  <p className="mt-2 text-sm text-center text-stone-400">
                    {currentCard.example_meaning}
                  </p>
                )}
              </div>
            )}
          </div>
        );

      case "listening":
        return (
          <div className="flex flex-col items-center justify-center h-full space-y-4">
            <p className="text-5xl font-bold">{currentCard.kanji}</p>
            <p className="text-2xl text-amber-600">{currentCard.reading || "-"}</p>
            <p className="text-xl text-stone-700">{currentCard.meaning || "-"}</p>
            {/* 예문 표시 */}
            {currentCard.example_sentence && (
              <div className="mt-4 w-full border-t pt-4">
                <div className="flex items-center justify-center gap-2">
                  <p className="text-lg text-center text-stone-600">
                    {currentCard.example_sentence}
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      playExampleSentence();
                    }}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-stone-100 text-stone-500 transition hover:bg-amber-100 hover:text-amber-600"
                    title="예문 발음 재생"
                  >
                    🔊
                  </button>
                </div>
                {currentCard.example_meaning && (
                  <p className="mt-2 text-sm text-center text-stone-400">
                    {currentCard.example_meaning}
                  </p>
                )}
              </div>
            )}
          </div>
        );

      case "cloze":
        return (
          <div className="flex flex-col items-center justify-center h-full space-y-4">
            <p className="text-4xl font-bold text-amber-600">{currentCard.kanji}</p>
            <p className="text-xl text-stone-600">{currentCard.reading || "-"}</p>
            {currentCard.example_sentence && (
              <div className="mt-4 flex items-center justify-center gap-2">
                <p className="text-lg text-center text-stone-500">
                  {currentCard.example_sentence}
                </p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    playExampleSentence();
                  }}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-stone-100 text-stone-500 transition hover:bg-amber-100 hover:text-amber-600"
                  title="예문 발음 재생"
                >
                  🔊
                </button>
              </div>
            )}
          </div>
        );

      case "sentence":
        return (
          <div className="flex flex-col items-center justify-center h-full space-y-4 px-4">
            <p className="text-2xl text-center leading-relaxed">{currentCard.kanji}</p>
            <p className="text-xl text-amber-600">{currentCard.reading || "-"}</p>
            <p className="text-xl text-stone-700 text-center">
              {currentCard.meaning || <span className="italic text-stone-400">의미 미입력</span>}
            </p>
          </div>
        );
    }
  };

  // 복습 카드 로드 (Static JSON + localStorage)
  // 문장 모드면 문장만, 단어 모드면 단어만 로드
  const loadCards = useCallback(async () => {
    setSessionState("loading");
    setError(null);

    try {
      // 정적 JSON에서 카드 로드
      const dueCards = await getDueCards();

      // 새 카드도 일부 포함 (최대 5개)
      const newCards = await getNewCards(5);

      // 복습 카드 + 새 카드 합치기 (중복 제거)
      let allCards = [...dueCards];
      newCards.forEach(card => {
        if (!allCards.find(c => c.id === card.id)) {
          allCards.push(card);
        }
      });

      // 문장 모드면 문장만, 단어 모드면 단어만 필터링
      if (isSentenceMode) {
        allCards = allCards.filter(c => c.pos === "文");
      } else {
        allCards = allCards.filter(c => c.pos !== "文");
      }

      // 통계 계산
      const srsStats = getStats();

      setCards(allCards);
      setStats({
        due_now: allCards.length,
        due_today: srsStats.dueToday,
        total_learned: srsStats.learned,
        total_mastered: srsStats.mastered,
      });
      setSessionState("ready");
    } catch (err) {
      setError("복습 카드를 불러오는데 실패했습니다.");
      console.error(err);
      setSessionState("ready");
    }
  }, [isSentenceMode]);

  useEffect(() => {
    loadCards();
  }, [loadCards]);

  // 카드 뒤집기 (스페이스바 지원)
  const flipCard = useCallback(() => {
    if (sessionState === "studying" && !isFlipped) {
      setIsFlipped(true);
    }
  }, [sessionState, isFlipped]);

  // 정답/오답 제출 (localStorage 기반 SRS)
  const handleAnswer = useCallback(
    async (known: boolean) => {
      if (!currentCard || isAnswering) return;

      setIsAnswering(true);

      try {
        // localStorage 기반 SRS 업데이트
        // quality: 1 = 오답, 3 = 정답
        updateSRS(currentCard.id, known ? 3 : 1);

        // 결과 업데이트
        setSessionResult((prev) => ({
          total: prev.total + 1,
          correct: prev.correct + (known ? 1 : 0),
          incorrect: prev.incorrect + (known ? 0 : 1),
        }));

        // 다음 카드로 이동 또는 세션 종료
        if (currentIndex < cards.length - 1) {
          setCurrentIndex((prev) => prev + 1);
          setIsFlipped(false);
        } else {
          // 세션 완료
          setSessionState("complete");
        }
      } catch (err) {
        console.error("Answer submission failed:", err);
        setError("답변 저장에 실패했습니다.");
      } finally {
        setIsAnswering(false);
      }
    },
    [currentCard, currentIndex, cards.length, isAnswering]
  );

  // TTS 발음 재생
  const playPronunciation = useCallback(() => {
    if (!currentCard || isSpeaking) return;

    const utterance = new SpeechSynthesisUtterance(currentCard.kanji);
    utterance.lang = TTS_CONFIG.lang;
    utterance.rate = TTS_CONFIG.rate;
    utterance.pitch = TTS_CONFIG.pitch;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, [currentCard, isSpeaking]);

  // 예문 TTS 재생
  const playExampleSentence = useCallback(() => {
    if (!currentCard?.example_sentence || isSpeaking) return;

    const utterance = new SpeechSynthesisUtterance(currentCard.example_sentence);
    utterance.lang = TTS_CONFIG.lang;
    utterance.rate = TTS_CONFIG.rate * 0.9;
    utterance.pitch = TTS_CONFIG.pitch;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, [currentCard, isSpeaking]);

  // 키보드 단축키
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
        case "1":
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

  // 복습 시작 (이미 loadCards에서 단어/문장 필터링 완료)
  const startSession = () => {
    if (cards.length === 0) return;

    setCurrentIndex(0);
    setIsFlipped(false);
    setSessionResult({ total: 0, correct: 0, incorrect: 0 });
    setSessionState("studying");

    // 듣기 모드일 경우 첫 카드 자동 재생
    if (reviewMode === "listening" && cards[0]) {
      setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(cards[0].kanji);
        utterance.lang = TTS_CONFIG.lang;
        utterance.rate = TTS_CONFIG.rate;
        utterance.pitch = TTS_CONFIG.pitch;
        window.speechSynthesis.speak(utterance);
      }, 500);
    }
  };

  // 다시 복습
  const restartSession = () => {
    loadCards();
    setCurrentIndex(0);
    setIsFlipped(false);
    setSessionResult({ total: 0, correct: 0, incorrect: 0 });
  };

  // 정답률 계산
  const accuracy =
    sessionResult.total > 0
      ? Math.round((sessionResult.correct / sessionResult.total) * 100)
      : 0;

  return (
    <div className="min-h-screen bg-[#f7f1e9] text-stone-900">
      <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center px-6 py-14">
        <header className="mb-8 text-center">
          <Link
            href="/"
            className="text-xs uppercase tracking-[0.35em] text-amber-700"
          >
            J-Flash
          </Link>
          <h1 className="mt-2 text-3xl font-semibold">복습</h1>
          <p className="mt-2 text-stone-600">
            플래시카드로 단어를 복습하세요
          </p>
        </header>

        {/* Error State */}
        {error && (
          <div className="mb-6 w-full rounded-xl bg-red-50 p-4 text-red-800">
            <p>{error}</p>
          </div>
        )}

        {/* Loading State */}
        {sessionState === "loading" && (
          <div className="w-full rounded-xl bg-white p-12 text-center shadow-sm">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-stone-300 border-t-amber-500" />
            <p className="mt-4 text-stone-600">복습 카드 불러오는 중...</p>
          </div>
        )}

        {/* Ready State - 복습 시작 전 */}
        {sessionState === "ready" && (
          <div className="w-full space-y-6">
            {/* 통계 카드 */}
            {stats && (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="rounded-xl bg-white p-4 text-center shadow-sm">
                  <p className="text-3xl font-bold text-amber-600">
                    {stats.due_now}
                  </p>
                  <p className="text-sm text-stone-500">복습 예정</p>
                </div>
                <div className="rounded-xl bg-white p-4 text-center shadow-sm">
                  <p className="text-3xl font-bold text-blue-600">
                    {stats.due_today}
                  </p>
                  <p className="text-sm text-stone-500">오늘 예정</p>
                </div>
                <div className="rounded-xl bg-white p-4 text-center shadow-sm">
                  <p className="text-3xl font-bold text-green-600">
                    {stats.total_learned}
                  </p>
                  <p className="text-sm text-stone-500">학습 중</p>
                </div>
                <div className="rounded-xl bg-white p-4 text-center shadow-sm">
                  <p className="text-3xl font-bold text-stone-600">
                    {stats.total_mastered}
                  </p>
                  <p className="text-sm text-stone-500">마스터</p>
                </div>
              </div>
            )}

            {/* 복습 모드 선택 (단어 복습에서만 표시) */}
            {!isSentenceMode && (
              <div className="rounded-xl bg-white p-6 shadow-sm">
                <h3 className="mb-4 text-lg font-semibold text-stone-700">복습 모드</h3>
                <div className="grid grid-cols-4 gap-2">
                  {availableModes.map((mode) => (
                    <button
                      key={mode.value}
                      onClick={() => setReviewMode(mode.value)}
                      className={`flex flex-col items-center rounded-xl p-3 transition ${
                        reviewMode === mode.value
                          ? "bg-amber-100 ring-2 ring-amber-500"
                          : "bg-stone-50 hover:bg-stone-100"
                      }`}
                    >
                      <span className="text-xl">{mode.icon}</span>
                      <span className="mt-1 text-sm font-medium">{mode.label}</span>
                    </button>
                  ))}
                </div>
                {reviewMode === "cloze" && clozeAvailableCards.length === 0 && (
                  <p className="mt-3 text-sm text-amber-600">
                    ⚠️ 예문이 있는 카드가 없습니다. 기본 모드를 권장합니다.
                  </p>
                )}
              </div>
            )}

            {/* 복습 시작 버튼 */}
            <div className="rounded-xl bg-white p-8 text-center shadow-sm">
              {cards.length > 0 ? (
                <>
                  <p className="text-6xl">{isSentenceMode ? "💬" : "📚"}</p>
                  <h2 className="mt-4 text-2xl font-semibold">
                    오늘의 복습: {cards.length}장 {isSentenceMode ? "문장" : "단어"}
                  </h2>
                  <p className="mt-2 text-stone-600">
                    복습할 {isSentenceMode ? "문장" : "단어"}가 준비되었습니다.
                  </p>
                  <button
                    onClick={startSession}
                    className="mt-6 rounded-xl bg-amber-600 px-8 py-4 text-lg font-semibold text-white transition hover:bg-amber-700"
                  >
                    복습 시작
                  </button>
                </>
              ) : (
                <>
                  <p className="text-6xl">🎉</p>
                  <h2 className="mt-4 text-2xl font-semibold">
                    오늘 복습할 {isSentenceMode ? "문장" : "단어"}가 없습니다
                  </h2>
                  <p className="mt-2 text-stone-600">
                    모든 복습을 완료했거나 아직 {isSentenceMode ? "문장" : "단어"}가 없습니다.
                  </p>
                  <Link
                    href="/vocab"
                    className="mt-6 inline-block rounded-xl border border-amber-600 px-6 py-3 font-semibold text-amber-600 transition hover:bg-amber-50"
                  >
                    단어장 보기
                  </Link>
                </>
              )}
            </div>

            {/* 단축키 안내 */}
            <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
              <p className="font-semibold">키보드 단축키</p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <span>
                  <kbd className="rounded bg-amber-100 px-1.5 py-0.5">Space</kbd>{" "}
                  카드 뒤집기
                </span>
                <span>
                  <kbd className="rounded bg-amber-100 px-1.5 py-0.5">→</kbd> 알고
                  있음
                </span>
                <span>
                  <kbd className="rounded bg-amber-100 px-1.5 py-0.5">←</kbd> 모름
                </span>
                <span>
                  <kbd className="rounded bg-amber-100 px-1.5 py-0.5">P</kbd> 발음
                  재생
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Studying State - 플래시카드 */}
        {sessionState === "studying" && currentCard && (
          <div className="w-full space-y-6">
            {/* 진행 상황 */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-stone-500">
                {currentIndex + 1} / {cards.length}
              </span>
              <div className="h-2 flex-1 mx-4 rounded-full bg-stone-200">
                <div
                  className="h-2 rounded-full bg-amber-500 transition-all"
                  style={{
                    width: `${((currentIndex + 1) / cards.length) * 100}%`,
                  }}
                />
              </div>
              <span className="text-sm text-stone-500">
                {sessionResult.correct}✓ / {sessionResult.incorrect}✗
              </span>
            </div>

            {/* 플래시카드 */}
            <div
              onClick={!isFlipped ? flipCard : undefined}
              className={`relative min-h-[300px] cursor-pointer rounded-2xl bg-white p-8 shadow-lg transition-all ${
                !isFlipped ? "hover:shadow-xl" : ""
              }`}
            >
              {/* 모드 표시 배지 */}
              <div className="absolute top-4 left-4 flex items-center gap-2 rounded-full bg-stone-100 px-3 py-1 text-sm text-stone-600">
                <span>{availableModes.find((m) => m.value === reviewMode)?.icon}</span>
                <span>{availableModes.find((m) => m.value === reviewMode)?.label}</span>
              </div>

              {/* 앞면/뒷면 렌더링 (모드별) */}
              {!isFlipped ? renderCardFront() : renderCardBack()}

              {/* TTS 버튼 (듣기 모드가 아닐 때만 표시) */}
              {reviewMode !== "listening" && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    playPronunciation();
                  }}
                  disabled={isSpeaking}
                  className={`absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full transition ${
                    isSpeaking
                      ? "bg-amber-100 text-amber-400"
                      : "bg-stone-100 text-stone-600 hover:bg-amber-100 hover:text-amber-600"
                  }`}
                  title="발음 재생 (P)"
                >
                  {isSpeaking ? (
                    <span className="animate-pulse">🔊</span>
                  ) : (
                    <span>🔊</span>
                  )}
                </button>
              )}
            </div>

            {/* 답변 버튼 */}
            {isFlipped && (
              <div className="flex gap-4">
                <button
                  onClick={() => handleAnswer(false)}
                  disabled={isAnswering}
                  className="flex-1 rounded-xl bg-red-500 py-4 text-lg font-semibold text-white transition hover:bg-red-600 disabled:opacity-50"
                >
                  {isAnswering ? "처리 중..." : "모름 (←)"}
                </button>
                <button
                  onClick={() => handleAnswer(true)}
                  disabled={isAnswering}
                  className="flex-1 rounded-xl bg-green-500 py-4 text-lg font-semibold text-white transition hover:bg-green-600 disabled:opacity-50"
                >
                  {isAnswering ? "처리 중..." : "알고 있음 (→)"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Complete State - 세션 완료 */}
        {sessionState === "complete" && (
          <div className="w-full rounded-xl bg-white p-8 text-center shadow-sm">
            <p className="text-6xl">🎊</p>
            <h2 className="mt-4 text-2xl font-semibold">복습 완료!</h2>
            <p className="mt-2 text-stone-600">오늘의 학습을 마쳤습니다.</p>

            {/* 결과 요약 */}
            <div className="mt-6 grid grid-cols-3 gap-4">
              <div className="rounded-lg bg-stone-50 p-4">
                <p className="text-3xl font-bold text-stone-700">
                  {sessionResult.total}
                </p>
                <p className="text-sm text-stone-500">총 카드</p>
              </div>
              <div className="rounded-lg bg-green-50 p-4">
                <p className="text-3xl font-bold text-green-600">
                  {sessionResult.correct}
                </p>
                <p className="text-sm text-stone-500">정답</p>
              </div>
              <div className="rounded-lg bg-red-50 p-4">
                <p className="text-3xl font-bold text-red-600">
                  {sessionResult.incorrect}
                </p>
                <p className="text-sm text-stone-500">오답</p>
              </div>
            </div>

            {/* 정답률 */}
            <div className="mt-6">
              <div className="relative h-4 rounded-full bg-stone-200">
                <div
                  className="absolute h-4 rounded-full bg-gradient-to-r from-amber-400 to-amber-600"
                  style={{ width: `${accuracy}%` }}
                />
              </div>
              <p className="mt-2 text-lg font-semibold">
                정답률:{" "}
                <span
                  className={
                    accuracy >= 80
                      ? "text-green-600"
                      : accuracy >= 50
                        ? "text-amber-600"
                        : "text-red-600"
                  }
                >
                  {accuracy}%
                </span>
              </p>
            </div>

            {/* 액션 버튼 */}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                onClick={restartSession}
                className="rounded-xl bg-amber-600 px-6 py-3 font-semibold text-white transition hover:bg-amber-700"
              >
                다시 복습
              </button>
              <Link
                href="/"
                className="rounded-xl border border-stone-300 bg-white px-6 py-3 font-semibold text-stone-700 transition hover:bg-stone-50"
              >
                홈으로
              </Link>
            </div>
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
            href="/vocab"
            className="rounded-xl border border-stone-300 bg-white px-6 py-3 font-semibold text-stone-700 transition hover:bg-stone-50"
          >
            단어장 보기
          </Link>
        </div>
      </main>
    </div>
  );
}

/** 로딩 폴백 UI */
function ReviewPageLoading() {
  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-stone-900 mx-auto"></div>
        <p className="mt-4 text-stone-600">로딩 중...</p>
      </div>
    </div>
  );
}

/** Suspense 경계로 감싼 메인 컴포넌트 */
export default function ReviewPage() {
  return (
    <Suspense fallback={<ReviewPageLoading />}>
      <ReviewPageContent />
    </Suspense>
  );
}
