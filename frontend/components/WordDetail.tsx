"use client";

/**
 * WordDetail - Detailed word view with kanji breakdown
 * JLPT+ style detail component for BottomSheet
 */

import { VocabItem } from "@/lib/static-data";
import { analyzeKanjiInWord, KanjiInfo } from "@/lib/kanji-data";
import { speakJapanese } from "@/lib/tts";
import { useState, useMemo } from "react";

interface WordDetailProps {
  word: VocabItem;
}

export function WordDetail({ word }: WordDetailProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Analyze kanji in the word
  const kanjiList = useMemo(() => analyzeKanjiInWord(word.kanji), [word.kanji]);

  const playPronunciation = () => {
    if (isSpeaking) return;
    speakJapanese(word.kanji, {
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  };

  const playExampleSentence = () => {
    if (!word.example_sentence || isSpeaking) return;
    speakJapanese(word.example_sentence, {
      rate: 1.0,
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  };

  return (
    <div className="space-y-6">
      {/* Word Header */}
      <div className="text-center">
        <button
          onClick={playPronunciation}
          className="group inline-flex flex-col items-center"
        >
          <ruby className="text-4xl">
            {word.kanji}
            {word.reading && (
              <rt className="text-sm text-neutral-400">{word.reading}</rt>
            )}
          </ruby>
          <span className="mt-2 text-xs text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity">
            {isSpeaking ? "재생 중..." : "🔊 발음 듣기"}
          </span>
        </button>
        <p className="mt-3 text-lg text-neutral-700">{word.meaning}</p>
        <div className="mt-2 flex justify-center gap-2">
          {word.jlpt_level && (
            <span className="px-2 py-0.5 text-xs border border-neutral-200 rounded">
              {word.jlpt_level}
            </span>
          )}
          {word.pos && (
            <span className="px-2 py-0.5 text-xs border border-neutral-200 rounded">
              {word.pos}
            </span>
          )}
        </div>
      </div>

      {/* Kanji Breakdown */}
      <div className="border-t border-neutral-100 pt-6">
        <h3 className="text-sm font-medium text-neutral-600 mb-4">한자 분석</h3>
        {kanjiList.length > 0 ? (
          <div className="space-y-4">
            {kanjiList.map((kanji) => (
              <KanjiCard key={kanji.character} kanji={kanji} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-neutral-400">
            이 단어에는 한자가 포함되어 있지 않습니다.
          </p>
        )}
      </div>

      {/* Example Sentence */}
      {word.example_sentence && (
        <div className="border-t border-neutral-100 pt-6">
          <h3 className="text-sm font-medium text-neutral-600 mb-3">예문</h3>
          <button
            onClick={playExampleSentence}
            className="group text-left w-full"
          >
            <p className="text-base leading-relaxed">
              <span className="inline-flex items-center gap-1">
                <span className="text-neutral-400 group-hover:text-neutral-500 transition-colors">
                  ▶
                </span>
                {word.example_sentence}
              </span>
            </p>
            {word.example_meaning && (
              <p className="mt-1 text-sm text-neutral-500">
                {word.example_meaning}
              </p>
            )}
          </button>
        </div>
      )}

      {/* Notes */}
      {word.notes && (
        <div className="border-t border-neutral-100 pt-6">
          <h3 className="text-sm font-medium text-neutral-600 mb-3">메모</h3>
          <div className="text-sm text-neutral-600 space-y-1">
            {word.notes.split("\n").map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        </div>
      )}

      {/* External Links */}
      <div className="border-t border-neutral-100 pt-6">
        <h3 className="text-sm font-medium text-neutral-600 mb-3">외부 링크</h3>
        <div className="flex gap-3">
          <a
            href={`https://jisho.org/search/${encodeURIComponent(word.kanji)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-2.5 text-sm text-center border border-neutral-200 rounded hover:bg-neutral-50 transition-colors"
          >
            Jisho
          </a>
          <a
            href={`https://chatgpt.com/?q=${encodeURIComponent(`일본어 "${word.kanji}"${word.reading ? ` (${word.reading})` : ""}의 뜻과 용법을 설명해줘`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-2.5 text-sm text-center border border-neutral-200 rounded hover:bg-neutral-50 transition-colors"
          >
            ChatGPT
          </a>
        </div>
      </div>
    </div>
  );
}

/**
 * KanjiCard - Individual kanji information card
 */
function KanjiCard({ kanji }: { kanji: KanjiInfo }) {
  const [showDetails, setShowDetails] = useState(false);
  const hasDetailedInfo = kanji.meanings_ko.length > 0 || kanji.on_readings.length > 0;

  return (
    <div className="border border-neutral-100 rounded-lg p-4">
      <div className="flex items-start gap-4">
        {/* Character */}
        <div className="text-3xl font-light">{kanji.character}</div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          {/* Meanings */}
          {hasDetailedInfo ? (
            <>
              <p className="text-sm text-neutral-700">
                {kanji.meanings_ko.join(", ") || kanji.meanings.join(", ") || "의미 정보 없음"}
              </p>

              {/* Toggle details */}
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="mt-2 text-xs text-neutral-500 hover:text-neutral-600"
              >
                {showDetails ? "접기 ▲" : "상세 보기 ▼"}
              </button>

              {/* Details */}
              {showDetails && (
                <div className="mt-3 space-y-2 text-xs">
                  {/* On readings */}
                  {kanji.on_readings.length > 0 && (
                    <div className="flex gap-2">
                      <span className="text-neutral-500 w-12">음독:</span>
                      <span className="text-neutral-700">
                        {kanji.on_readings.join(", ")}
                      </span>
                    </div>
                  )}
                  {/* Kun readings */}
                  {kanji.kun_readings.length > 0 && (
                    <div className="flex gap-2">
                      <span className="text-neutral-500 w-12">훈독:</span>
                      <span className="text-neutral-700">
                        {kanji.kun_readings.join(", ")}
                      </span>
                    </div>
                  )}
                  {/* Strokes */}
                  {kanji.strokes > 0 && (
                    <div className="flex gap-2">
                      <span className="text-neutral-500 w-12">획수:</span>
                      <span className="text-neutral-700">{kanji.strokes}획</span>
                    </div>
                  )}
                  {/* JLPT Level */}
                  {kanji.jlpt_level > 0 && (
                    <div className="flex gap-2">
                      <span className="text-neutral-500 w-12">레벨:</span>
                      <span className="text-neutral-700">N{kanji.jlpt_level}</span>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <>
              <p className="text-sm text-neutral-400">
                상세 정보가 등록되지 않은 한자입니다.
              </p>
              <a
                href={`https://jisho.org/search/${encodeURIComponent(kanji.character)}%20%23kanji`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-xs text-blue-500 hover:text-blue-600"
              >
                Jisho에서 보기 →
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default WordDetail;
