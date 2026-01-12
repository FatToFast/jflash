/**
 * Application Constants
 *
 * Centralized constants for consistent values across the application.
 */

import { FEATURES } from "./config";

/**
 * Pagination defaults
 * - Must align with backend defaults (vocab.py, grammar.py)
 */
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

/**
 * Japanese Parts of Speech (品詞)
 * - Used for word categorization in vocabulary management
 * - Values are Japanese grammatical terms with Korean translations
 */
export const POS_OPTIONS = [
  { value: "", label: "선택 안함" },
  { value: "名詞", label: "名詞 (명사)" },
  { value: "動詞", label: "動詞 (동사)" },
  { value: "形容詞", label: "形容詞 (형용사)" },
  { value: "副詞", label: "副詞 (부사)" },
  { value: "接続詞", label: "接続詞 (접속사)" },
  { value: "感動詞", label: "感動詞 (감동사)" },
  { value: "連体詞", label: "連体詞 (연체사)" },
] as const;

/**
 * JLPT Levels for grammar categorization
 * - Must align with backend validation (grammar.py: JLPT_LEVELS)
 */
export const JLPT_LEVELS = ["N5", "N4", "N3", "N2", "N1"] as const;

/**
 * JLPT Level Colors for UI display
 * - N5 (easiest) → N1 (hardest): green → red gradient
 */
export const JLPT_LEVEL_COLORS: Record<string, string> = {
  N5: "bg-green-100 text-green-800",
  N4: "bg-blue-100 text-blue-800",
  N3: "bg-yellow-100 text-yellow-800",
  N2: "bg-orange-100 text-orange-800",
  N1: "bg-red-100 text-red-800",
} as const;

/**
 * Sort order options
 */
export const SORT_ORDERS = {
  ASC: "asc",
  DESC: "desc",
} as const;

/**
 * Review/SRS Settings
 * - DEFAULT_REVIEW_LIMIT: Maximum cards to fetch per session
 * - Must align with backend limit (review.py: max 100)
 */
export const DEFAULT_REVIEW_LIMIT = 100;

/**
 * TTS (Text-to-Speech) Settings
 * - Used for Japanese pronunciation in review mode
 */
export const TTS_CONFIG = {
  lang: "ja-JP",
  rate: 0.8,  // Slower for learning (0.1 - 10, default 1)
  pitch: 1,   // Default pitch (0 - 2)
} as const;


/**
 * Navigation Items for Home Page
 * Centralized for easy maintenance, i18n readiness, and feature flags.
 *
 * requiresFullMode: Items with this flag true are hidden in lite mode.
 */
export type NavItem = {
  href: string;
  label: string;
  icon: string;
  style: "primary" | "default" | "purple" | "indigo" | "emerald" | "amber";
  requiresFullMode?: boolean;
};

/**
 * All navigation items
 * Simplified: Only core learning features
 */
const ALL_NAV_ITEMS: NavItem[] = [
  { href: "/review", label: "단어 복습", icon: "🎴", style: "primary" },
  { href: "/review?mode=sentence", label: "문장 복습", icon: "💬", style: "indigo" },
  { href: "/vocab", label: "단어장", icon: "📚", style: "default" },
  { href: "/grammar", label: "문법", icon: "📖", style: "purple" },
  { href: "/stats", label: "통계", icon: "📊", style: "emerald" },
  { href: "/data", label: "데이터", icon: "💾", style: "amber", requiresFullMode: true },
];

/**
 * Filtered navigation items based on deploy mode.
 * In lite mode, items requiring full mode are hidden.
 */
export const NAV_ITEMS: NavItem[] = ALL_NAV_ITEMS.filter(
  (item) => !item.requiresFullMode || FEATURES.upload
);

/**
 * Navigation Style Classes
 * Maps NavItem.style to Tailwind CSS classes.
 */
export const NAV_STYLE_CLASSES: Record<NavItem["style"], string> = {
  primary: "bg-stone-900 text-white hover:bg-stone-800",
  default: "border border-stone-300 bg-white text-stone-700 hover:bg-stone-50",
  purple: "border border-purple-300 bg-purple-50 text-purple-700 hover:bg-purple-100",
  indigo: "border border-indigo-300 bg-indigo-50 text-indigo-700 hover:bg-indigo-100",
  emerald: "border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
  amber: "border border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100",
} as const;

/**
 * App Metadata
 */
export const APP_META = {
  name: "J-Flash",
  title: "일본어 플래시카드",
  description: "LLM으로 단어를 추출하고, SRS 알고리즘으로 복습하세요.",
  version: "1.3.0",
} as const;
