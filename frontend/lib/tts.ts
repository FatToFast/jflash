/**
 * TTS (Text-to-Speech) Utilities
 *
 * Provides natural Japanese voice using Google TTS voices when available.
 */

import { TTS_CONFIG } from "./constants";

// Cache for Japanese voice
let cachedJapaneseVoice: SpeechSynthesisVoice | null = null;
let voicesLoaded = false;

/**
 * Get the best available Japanese voice (prefer Google voices)
 */
export function getJapaneseVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined") return null;

  // Return cached voice if already found
  if (voicesLoaded && cachedJapaneseVoice) {
    return cachedJapaneseVoice;
  }

  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return null;

  voicesLoaded = true;

  // Find Japanese voices
  const japaneseVoices = voices.filter(
    (v) => v.lang === "ja-JP" || v.lang.startsWith("ja")
  );

  if (japaneseVoices.length === 0) return null;

  // Priority order for natural-sounding voices:
  // 1. Google Japanese voice (most natural)
  // 2. Microsoft Nanami (good quality on Windows/Edge)
  // 3. Apple Kyoko (macOS, better quality)
  // 4. Any other Japanese voice
  const googleVoice = japaneseVoices.find(
    (v) => v.name.toLowerCase().includes("google") && v.lang === "ja-JP"
  );
  if (googleVoice) {
    cachedJapaneseVoice = googleVoice;
    console.log("[TTS] Using Google voice:", googleVoice.name);
    return googleVoice;
  }

  const microsoftVoice = japaneseVoices.find(
    (v) =>
      v.name.toLowerCase().includes("nanami") ||
      v.name.toLowerCase().includes("microsoft")
  );
  if (microsoftVoice) {
    cachedJapaneseVoice = microsoftVoice;
    console.log("[TTS] Using Microsoft voice:", microsoftVoice.name);
    return microsoftVoice;
  }

  // macOS Kyoko (enhanced version is better)
  const kyokoVoice = japaneseVoices.find(
    (v) => v.name.toLowerCase().includes("kyoko")
  );
  if (kyokoVoice) {
    cachedJapaneseVoice = kyokoVoice;
    console.log("[TTS] Using Kyoko voice:", kyokoVoice.name);
    return kyokoVoice;
  }

  // Fallback to first Japanese voice
  cachedJapaneseVoice = japaneseVoices[0];
  console.log("[TTS] Fallback voice:", japaneseVoices[0].name);
  return japaneseVoices[0];
}

/**
 * Get all available Japanese voices (for debugging)
 */
export function listJapaneseVoices(): string[] {
  if (typeof window === "undefined") return [];
  const voices = window.speechSynthesis.getVoices();
  return voices
    .filter((v) => v.lang === "ja-JP" || v.lang.startsWith("ja"))
    .map((v) => `${v.name} (${v.lang})`);
}

/**
 * Create a configured utterance for Japanese text
 */
export function createJapaneseUtterance(
  text: string,
  options?: { rate?: number; pitch?: number }
): SpeechSynthesisUtterance {
  const utterance = new SpeechSynthesisUtterance(text);

  // Set voice (prefer Google Japanese)
  const voice = getJapaneseVoice();
  if (voice) {
    utterance.voice = voice;
  }

  // Apply config with optional overrides
  utterance.lang = TTS_CONFIG.lang;
  utterance.rate = options?.rate ?? TTS_CONFIG.rate;
  utterance.pitch = options?.pitch ?? TTS_CONFIG.pitch;

  return utterance;
}

/**
 * Speak Japanese text with natural voice
 */
export function speakJapanese(
  text: string,
  options?: {
    rate?: number;
    pitch?: number;
    onStart?: () => void;
    onEnd?: () => void;
    onError?: () => void;
  }
): void {
  if (typeof window === "undefined") return;

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const utterance = createJapaneseUtterance(text, options);

  if (options?.onStart) utterance.onstart = options.onStart;
  if (options?.onEnd) utterance.onend = options.onEnd;
  if (options?.onError) utterance.onerror = options.onError;

  window.speechSynthesis.speak(utterance);
}

/**
 * Initialize voices (should be called early, e.g., in useEffect)
 * Some browsers load voices asynchronously
 */
export function initializeVoices(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve();
      return;
    }

    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      getJapaneseVoice(); // Cache the voice
      resolve();
      return;
    }

    // Wait for voices to load
    window.speechSynthesis.onvoiceschanged = () => {
      getJapaneseVoice(); // Cache the voice
      resolve();
    };

    // Timeout fallback (some browsers don't fire the event)
    setTimeout(resolve, 1000);
  });
}
