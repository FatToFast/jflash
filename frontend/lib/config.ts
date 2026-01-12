/**
 * Application Configuration
 *
 * Centralized configuration for environment variables and app settings.
 * All environment-dependent values should be accessed through this module.
 */

/**
 * API Configuration
 *
 * IMPORTANT: NEXT_PUBLIC_API_URL must be set in production environments.
 * The localhost fallback is only for local development.
 *
 * Production deployment checklist:
 * - Set NEXT_PUBLIC_API_URL in .env.production or deployment environment
 * - Example: NEXT_PUBLIC_API_URL=https://api.jflash.example.com
 */
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * Get the full URL for an API endpoint
 * @param path - API path (e.g., "/api/vocab/1/image")
 * @returns Full URL with base URL prepended
 */
export function getApiUrl(path: string): string {
  // Remove trailing slash from base URL to prevent //api/...
  const baseUrl = API_BASE_URL.replace(/\/+$/, "");
  // Ensure path starts with /
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
}

/**
 * Check if we're running in production mode
 */
export const IS_PRODUCTION = process.env.NODE_ENV === "production";

/**
 * Check if API URL is configured (not using localhost fallback)
 */
export const IS_API_URL_CONFIGURED = !!process.env.NEXT_PUBLIC_API_URL;

/**
 * Deploy Mode Configuration
 *
 * - "full": Local environment with OCR, editing, and all features
 * - "lite": Web deployment with review-only features (no OCR, no data modification)
 *
 * Set via NEXT_PUBLIC_DEPLOY_MODE environment variable.
 * Defaults to "full" for local development.
 */
export const DEPLOY_MODE = (process.env.NEXT_PUBLIC_DEPLOY_MODE || "full").toLowerCase() as "full" | "lite";
export const IS_LITE_MODE = DEPLOY_MODE === "lite";
export const IS_FULL_MODE = DEPLOY_MODE === "full";

/**
 * Feature flags based on deploy mode
 */
export const FEATURES = {
  /** OCR text extraction from images */
  ocr: IS_FULL_MODE,
  /** Image upload functionality */
  upload: IS_FULL_MODE,
  /** Vocabulary CRUD (create, update, delete) */
  vocabEdit: IS_FULL_MODE,
  /** Grammar CRUD */
  grammarEdit: IS_FULL_MODE,
  /** Data import/export */
  dataManagement: IS_FULL_MODE,
  /** Review functionality (always available) */
  review: true,
  /** Statistics viewing (always available) */
  stats: true,
} as const;

// Development warning for unconfigured API URL in production build
if (IS_PRODUCTION && !IS_API_URL_CONFIGURED) {
  console.warn(
    "[J-Flash Config] Warning: NEXT_PUBLIC_API_URL is not set. " +
    "Using localhost fallback which will not work in production. " +
    "Please set NEXT_PUBLIC_API_URL environment variable."
  );
}
