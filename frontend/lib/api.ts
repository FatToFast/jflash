/**
 * API client for J-Flash backend
 */

import axios from "axios";
import { API_BASE_URL, getApiUrl } from "./config";

// Timeout configuration
const DEFAULT_TIMEOUT = 30000; // 30초 (일반 API 요청)
const OCR_TIMEOUT = 120000; // 2분 (OCR 첫 실행 시 모델 로딩 시간 고려)

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: DEFAULT_TIMEOUT,
  headers: {
    "Content-Type": "application/json",
  },
});

// OCR 전용 axios 인스턴스 (긴 타임아웃)
const ocrApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: OCR_TIMEOUT,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor: FormData 전송 시 Content-Type 헤더 제거
// (axios가 자동으로 multipart/form-data + boundary 설정)
api.interceptors.request.use((config) => {
  if (config.data instanceof FormData) {
    // Content-Type 헤더 삭제 - axios가 자동으로 설정함
    delete config.headers["Content-Type"];
  }
  return config;
});

export default api;

// Types
export interface ImageUploadResponse {
  success: boolean;
  filename: string;
  path: string;
}

// Epic 2: Image Upload API
export async function uploadImage(file: File): Promise<ImageUploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  // Don't set Content-Type header - let axios handle boundary for multipart/form-data
  const response = await api.post<ImageUploadResponse>("/api/upload/image", formData);

  return response.data;
}

// Epic 2: OCR Processing API (Story 2.2)
export interface OcrResultItem {
  text: string;
  confidence: number;
  confidence_level: "high" | "medium" | "low";
  warning: boolean;
  bbox: number[][] | null;
}

export interface OcrProcessResponse {
  success: boolean;
  results: OcrResultItem[];
  full_text: string;
  processing_time_ms: number;
  error?: string;
}

export async function processOcr(imagePath: string): Promise<OcrProcessResponse> {
  // Normalize imagePath: extract relative path if full URL is provided
  let normalizedPath = imagePath;
  if (imagePath.startsWith("http")) {
    const url = new URL(imagePath);
    normalizedPath = url.pathname; // Extract /uploads/... from full URL
  }

  // Use ocrApi with longer timeout for OCR processing
  const response = await ocrApi.post<OcrProcessResponse>("/api/ocr/process", {
    image_path: normalizedPath,
  });

  return response.data;
}

// Epic 2: Morphological Analysis API (Story 2.3)
export interface WordInfo {
  surface: string;
  reading: string | null;
  reading_hiragana: string | null;
  pos: string;
  pos_detail: string | null;
  base_form: string | null;
  is_content_word: boolean;
}

export interface MorphologyAnalyzeResponse {
  success: boolean;
  words: WordInfo[];
  total_count: number;
  filtered_count: number;
  processing_time_ms: number;
  error?: string;
}

export async function analyzeMorphology(
  text: string,
  filterParticles: boolean = true
): Promise<MorphologyAnalyzeResponse> {
  const response = await api.post<MorphologyAnalyzeResponse>(
    "/api/morphology/analyze",
    {
      text,
      filter_particles: filterParticles,
      include_reading_hiragana: true,
    }
  );

  return response.data;
}

// Epic 3: Vocabulary API (Story 2.5 - 단어 저장)
export interface VocabCreate {
  kanji: string;
  reading: string | null;
  meaning: string | null;
  pos: string | null;
  source_img: string | null;
}

export interface VocabResponse {
  id: number;
  kanji: string;
  reading: string | null;
  meaning: string | null;
  pos: string | null;
  source_img: string | null;
  has_image: boolean;  // Story 3.4: 이미지 존재 여부 (DB에 저장된 이미지)
  created_at: string;
  next_review: string | null;
  reps: number;
  // LLM 추출 확장 필드
  jlpt_level: string | null;
  example_sentence: string | null;
  example_meaning: string | null;
  source_context: string | null;
  confidence: number | null;
  surface: string | null;
  needs_review: number | null;
}

// Story 3.4: 단어 이미지 URL 생성 헬퍼
export function getVocabImageUrl(vocabId: number): string {
  return getApiUrl(`/api/vocab/${vocabId}/image`);
}

export interface BulkVocabResponse {
  created: number;
  items: VocabResponse[];
}

export async function saveWordsBulk(
  words: VocabCreate[]
): Promise<BulkVocabResponse> {
  const response = await api.post<BulkVocabResponse>("/api/vocab/bulk", {
    words,
  });

  return response.data;
}

// Story 3.1: 단어 추가
export async function createWord(word: VocabCreate): Promise<VocabResponse> {
  const response = await api.post<VocabResponse>("/api/vocab", word);
  return response.data;
}

// Story 3.2: 단어 수정
export interface VocabUpdate {
  kanji?: string;
  reading?: string | null;
  meaning?: string | null;
  pos?: string | null;
}

export async function updateWord(
  id: number,
  data: VocabUpdate
): Promise<VocabResponse> {
  const response = await api.put<VocabResponse>(`/api/vocab/${id}`, data);
  return response.data;
}

// Story 3.2: 단어 삭제
export async function deleteWord(id: number): Promise<void> {
  await api.delete(`/api/vocab/${id}`);
}

// Epic 4: Review System

export interface ReviewCard {
  id: number;
  vocab_id: number;
  kanji: string;
  reading: string | null;
  meaning: string | null;
  pos: string | null;
  interval: number;
  ease_factor: number;
  reps: number;
  // 복습 모드 확장 필드
  example_sentence: string | null;
  example_meaning: string | null;
}

export interface ReviewCardsResponse {
  cards: ReviewCard[];
  total: number;
}

export interface ReviewStats {
  due_now: number;
  due_today: number;
  due_this_week: number;
  total_reviewed: number;
}

export interface AnswerRequest {
  vocab_id: number;
  known: boolean;
}

export interface AnswerResponse {
  vocab_id: number;
  next_review: string;
  new_interval: number;
  ease_factor: number;
  reps: number;
}

// Story 4.1: 오늘의 복습 카드 조회
export async function getReviewCards(limit: number = 20): Promise<ReviewCardsResponse> {
  const response = await api.get<ReviewCardsResponse>("/api/review/cards", {
    params: { limit },
  });
  return response.data;
}

// Story 4.1: 복습 통계
export async function getReviewStats(): Promise<ReviewStats> {
  const response = await api.get<ReviewStats>("/api/review/stats");
  return response.data;
}

// Story 4.3: 학습 결과 제출
export async function submitAnswer(data: AnswerRequest): Promise<AnswerResponse> {
  const response = await api.post<AnswerResponse>("/api/review/answer", data);
  return response.data;
}

// Epic 5: Grammar Management

export interface GrammarCreate {
  title: string;
  explanation?: string | null;  // 문법 설명 및 용법
  example_jp?: string | null;   // 일본어 예문
  example_kr?: string | null;   // 예문 해석 (한국어)
  level?: string | null;        // N5 ~ N1
  similar_patterns?: string | null;  // 유사 문법
  usage_notes?: string | null;  // 사용 주의사항
}

export interface GrammarUpdate {
  title?: string;
  explanation?: string | null;
  example_jp?: string | null;
  example_kr?: string | null;
  level?: string | null;
  similar_patterns?: string | null;
  usage_notes?: string | null;
}

export interface GrammarResponse {
  id: number;
  title: string;
  explanation: string | null;
  example_jp: string | null;
  example_kr: string | null;
  level: string | null;
  similar_patterns: string | null;
  usage_notes: string | null;
  created_at: string;
}

export interface GrammarListResponse {
  items: GrammarResponse[];
  total: number;
  page: number;
  page_size: number;
}

export interface GrammarStats {
  total: number;
  by_level: {
    N5: number;
    N4: number;
    N3: number;
    N2: number;
    N1: number;
    none: number;
  };
}

// Story 5.1: 문법 항목 추가
export async function createGrammar(data: GrammarCreate): Promise<GrammarResponse> {
  const response = await api.post<GrammarResponse>("/api/grammar", data);
  return response.data;
}

// Story 5.2: 문법 목록 조회
export async function getGrammarList(params: {
  page?: number;
  page_size?: number;
  search?: string;
  level?: string;
  sort_by?: string;
  sort_order?: string;
} = {}): Promise<GrammarListResponse> {
  const response = await api.get<GrammarListResponse>("/api/grammar", { params });
  return response.data;
}

// Story 5.2: 단일 문법 조회
export async function getGrammarById(id: number): Promise<GrammarResponse> {
  const response = await api.get<GrammarResponse>(`/api/grammar/${id}`);
  return response.data;
}

// Story 5.1: 문법 수정
export async function updateGrammar(id: number, data: GrammarUpdate): Promise<GrammarResponse> {
  const response = await api.put<GrammarResponse>(`/api/grammar/${id}`, data);
  return response.data;
}

// Story 5.1: 문법 삭제
export async function deleteGrammar(id: number): Promise<void> {
  await api.delete(`/api/grammar/${id}`);
}

// Story 5.3: JLPT 레벨 목록
export async function getJlptLevels(): Promise<string[]> {
  const response = await api.get<string[]>("/api/grammar/levels");
  return response.data;
}

// 문법 통계
export async function getGrammarStats(): Promise<GrammarStats> {
  const response = await api.get<GrammarStats>("/api/grammar/stats/summary");
  return response.data;
}

// Epic 6: Kanji Learning

export interface KanjiInfo {
  character: string;
  on_readings: string[];
  kun_readings: string[];
  meanings: string[];
  meanings_ko: string[];
  stroke_count: number | null;
  jlpt_level: number | null;
}

export interface KanjiAnalyzeResponse {
  kanji_count: number;
  kanji_list: KanjiInfo[];
}

// Story 6.1: 단어에서 한자 추출
export async function analyzeKanjiInText(text: string): Promise<KanjiAnalyzeResponse> {
  const response = await api.post<KanjiAnalyzeResponse>("/api/kanji/analyze", { text });
  return response.data;
}

// Story 6.1: 단어에서 한자 정보 조회
export async function getKanjiInWord(word: string): Promise<KanjiAnalyzeResponse> {
  const response = await api.get<KanjiAnalyzeResponse>(`/api/kanji/word/${encodeURIComponent(word)}`);
  return response.data;
}

// Story 6.2 & 6.3: 단일 한자 정보 조회
export async function getKanjiInfo(character: string): Promise<KanjiInfo> {
  const response = await api.get<KanjiInfo>(`/api/kanji/info/${encodeURIComponent(character)}`);
  return response.data;
}

// 단어장 항목의 한자 조회
export async function getVocabKanji(vocabId: number): Promise<KanjiAnalyzeResponse> {
  const response = await api.get<KanjiAnalyzeResponse>(`/api/kanji/vocab/${vocabId}/kanji`);
  return response.data;
}

// Epic 7: Statistics Dashboard

export interface OverviewStats {
  total_words: number;
  learned_words: number;  // reps > 0
  mastered_words: number;  // reps >= 5
  new_words: number;  // reps == 0
  due_today: number;
  total_grammar: number;
  learning_progress: number;  // percentage
}

export interface DailyStats {
  date: string;
  total_reviews: number;
  correct: number;
  incorrect: number;
  accuracy: number;
  new_words_learned: number;
}

export interface AccuracyData {
  dates: string[];
  accuracy: number[];
  total_reviews: number[];
}

export interface StreakInfo {
  current_streak: number;
  longest_streak: number;
  last_study_date: string | null;
}

export interface DashboardResponse {
  overview: OverviewStats;
  recent_daily_stats: DailyStats[];
  accuracy_trend: AccuracyData;
  streak: StreakInfo;
}

// Story 7.1: 전체 단어 수/진행도 조회
export async function getOverviewStats(): Promise<OverviewStats> {
  const response = await api.get<OverviewStats>("/api/stats/overview");
  return response.data;
}

// Story 7.2: 일별 학습 통계
export async function getDailyStats(days: number = 7): Promise<DailyStats[]> {
  const response = await api.get<DailyStats[]>("/api/stats/daily", {
    params: { days },
  });
  return response.data;
}

// Story 7.3: 정답률 그래프 데이터
export async function getAccuracyTrend(days: number = 14): Promise<AccuracyData> {
  const response = await api.get<AccuracyData>("/api/stats/accuracy", {
    params: { days },
  });
  return response.data;
}

// 학습 스트릭 조회
export async function getStreakInfo(): Promise<StreakInfo> {
  const response = await api.get<StreakInfo>("/api/stats/streak");
  return response.data;
}

// 대시보드 전체 데이터 (단일 요청)
export async function getDashboard(): Promise<DashboardResponse> {
  const response = await api.get<DashboardResponse>("/api/stats/dashboard");
  return response.data;
}

// Epic 8: Export/Import

export interface ExportStats {
  vocabulary_count: number;
  grammar_count: number;
  exported_at: string;
}

export interface ImportResult {
  success: boolean;
  vocabulary_imported: number;
  vocabulary_skipped: number;
  grammar_imported: number;
  grammar_skipped: number;
  errors: string[];
}

// Story 8.1: 데이터 내보내기

// Export statistics
export async function getExportStats(): Promise<ExportStats> {
  const response = await api.get<ExportStats>("/api/data/stats");
  return response.data;
}

// Export URLs (for direct download)
export function getVocabCsvUrl(): string {
  return getApiUrl("/api/data/vocab/csv");
}

export function getVocabJsonUrl(): string {
  return getApiUrl("/api/data/vocab/json");
}

export function getGrammarCsvUrl(): string {
  return getApiUrl("/api/data/grammar/csv");
}

export function getGrammarJsonUrl(): string {
  return getApiUrl("/api/data/grammar/json");
}

export function getFullBackupUrl(): string {
  return getApiUrl("/api/data/all/json");
}

// Story 8.2: 데이터 가져오기

export async function importVocabCsv(file: File, skipDuplicates: boolean = true): Promise<ImportResult> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post<ImportResult>(
    `/api/data/vocab/csv?skip_duplicates=${skipDuplicates}`,
    formData
  );
  return response.data;
}

export async function importVocabJson(file: File, skipDuplicates: boolean = true): Promise<ImportResult> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post<ImportResult>(
    `/api/data/vocab/json?skip_duplicates=${skipDuplicates}`,
    formData
  );
  return response.data;
}

export async function importGrammarCsv(file: File, skipDuplicates: boolean = true): Promise<ImportResult> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post<ImportResult>(
    `/api/data/grammar/csv?skip_duplicates=${skipDuplicates}`,
    formData
  );
  return response.data;
}

export async function importGrammarJson(file: File, skipDuplicates: boolean = true): Promise<ImportResult> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post<ImportResult>(
    `/api/data/grammar/json?skip_duplicates=${skipDuplicates}`,
    formData
  );
  return response.data;
}

export async function importFullBackup(file: File, skipDuplicates: boolean = true): Promise<ImportResult> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post<ImportResult>(
    `/api/data/all/json?skip_duplicates=${skipDuplicates}`,
    formData
  );
  return response.data;
}
