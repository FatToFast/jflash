/**
 * Gemini API Integration for Feynman Mode Feedback
 *
 * 사용자의 설명을 평가하고 피드백을 제공합니다.
 */

// ============================================
// Types
// ============================================

export interface FeynmanFeedback {
  isCorrect: boolean; // 설명이 대체로 정확한지
  score: number; // 1-5 점수
  feedback: string; // 피드백 메시지
  suggestion?: string; // 개선 제안 (선택)
  betterExample?: string; // 더 나은 설명 예시 (선택)
}

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
  error?: {
    message: string;
  };
}

// ============================================
// API Key Management
// ============================================

const GEMINI_KEY_STORAGE = "jflash_gemini_key";

export function getGeminiApiKey(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(GEMINI_KEY_STORAGE);
}

export function setGeminiApiKey(key: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(GEMINI_KEY_STORAGE, key);
}

export function clearGeminiApiKey(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(GEMINI_KEY_STORAGE);
}

export function isGeminiEnabled(): boolean {
  return !!getGeminiApiKey();
}

// ============================================
// Gemini API Call
// ============================================

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

/**
 * Gemini API를 호출하여 파인만 설명을 평가합니다.
 */
export async function evaluateFeynmanExplanation(
  word: string,
  reading: string,
  meaning: string,
  userExplanation: string,
  exampleSentence?: string
): Promise<FeynmanFeedback> {
  const apiKey = getGeminiApiKey();

  if (!apiKey) {
    return {
      isCorrect: true,
      score: 3,
      feedback: "API 키가 설정되지 않았습니다. 설정에서 Gemini API 키를 입력하세요.",
    };
  }

  const prompt = buildPrompt(word, reading, meaning, userExplanation, exampleSentence);

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 500,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Gemini API error:", errorData);
      return {
        isCorrect: true,
        score: 3,
        feedback: `API 오류: ${errorData.error?.message || "알 수 없는 오류"}`,
      };
    }

    const data: GeminiResponse = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return {
        isCorrect: true,
        score: 3,
        feedback: "응답을 받지 못했습니다.",
      };
    }

    return parseGeminiFeedback(text);
  } catch (error) {
    console.error("Gemini API call failed:", error);
    return {
      isCorrect: true,
      score: 3,
      feedback: "네트워크 오류가 발생했습니다.",
    };
  }
}

// ============================================
// Prompt Building
// ============================================

function buildPrompt(
  word: string,
  reading: string,
  meaning: string,
  userExplanation: string,
  exampleSentence?: string
): string {
  return `당신은 일본어 학습 튜터입니다. 학습자가 파인만 기법을 사용해 단어를 설명했습니다. 평가해주세요.

## 단어 정보
- 단어: ${word}
- 읽기: ${reading}
- 의미: ${meaning}
${exampleSentence ? `- 예문: ${exampleSentence}` : ""}

## 학습자의 설명
"${userExplanation}"

## 평가 기준
1. 의미 정확성: 핵심 의미를 포함하는가?
2. 이해도: 자신의 말로 설명하고 있는가?
3. 활용: 사용 맥락이나 예시가 적절한가?

## 출력 형식 (반드시 이 형식으로)
SCORE: [1-5 숫자]
CORRECT: [true 또는 false]
FEEDBACK: [한 줄 피드백, 20자 이내]
SUGGESTION: [개선 제안, 없으면 "없음"]
EXAMPLE: [더 나은 설명 예시, 없으면 "없음"]

## 점수 기준
- 5점: 정확하고 창의적인 설명
- 4점: 정확한 설명
- 3점: 대체로 맞지만 부족한 부분 있음
- 2점: 부분적으로 맞음
- 1점: 틀리거나 관련 없음

친절하지만 정확하게 평가하세요. 한국어로 답변하세요.`;
}

// ============================================
// Response Parsing
// ============================================

function parseGeminiFeedback(text: string): FeynmanFeedback {
  const lines = text.split("\n");

  let score = 3;
  let isCorrect = true;
  let feedback = "평가를 완료했습니다.";
  let suggestion: string | undefined;
  let betterExample: string | undefined;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith("SCORE:")) {
      const scoreStr = trimmed.replace("SCORE:", "").trim();
      const parsed = parseInt(scoreStr, 10);
      if (!isNaN(parsed) && parsed >= 1 && parsed <= 5) {
        score = parsed;
      }
    } else if (trimmed.startsWith("CORRECT:")) {
      const correctStr = trimmed.replace("CORRECT:", "").trim().toLowerCase();
      isCorrect = correctStr === "true";
    } else if (trimmed.startsWith("FEEDBACK:")) {
      feedback = trimmed.replace("FEEDBACK:", "").trim();
    } else if (trimmed.startsWith("SUGGESTION:")) {
      const suggestionStr = trimmed.replace("SUGGESTION:", "").trim();
      if (suggestionStr && suggestionStr !== "없음") {
        suggestion = suggestionStr;
      }
    } else if (trimmed.startsWith("EXAMPLE:")) {
      const exampleStr = trimmed.replace("EXAMPLE:", "").trim();
      if (exampleStr && exampleStr !== "없음") {
        betterExample = exampleStr;
      }
    }
  }

  return {
    isCorrect,
    score,
    feedback,
    suggestion,
    betterExample,
  };
}

// ============================================
// Score to Emoji
// ============================================

export function scoreToEmoji(score: number): string {
  switch (score) {
    case 5:
      return "★★★★★";
    case 4:
      return "★★★★☆";
    case 3:
      return "★★★☆☆";
    case 2:
      return "★★☆☆☆";
    case 1:
      return "★☆☆☆☆";
    default:
      return "☆☆☆☆☆";
  }
}

export function scoreToLabel(score: number): string {
  switch (score) {
    case 5:
      return "훌륭해요!";
    case 4:
      return "좋아요!";
    case 3:
      return "괜찮아요";
    case 2:
      return "다시 생각해보세요";
    case 1:
      return "아쉬워요";
    default:
      return "";
  }
}
