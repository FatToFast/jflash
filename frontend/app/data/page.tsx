"use client";

/**
 * Data Page - Minimal Japanese aesthetic
 */

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  getExportStats,
  getVocabCsvUrl,
  getVocabJsonUrl,
  getGrammarCsvUrl,
  getGrammarJsonUrl,
  getFullBackupUrl,
  importVocabCsv,
  importVocabJson,
  importGrammarCsv,
  importGrammarJson,
  importFullBackup,
  ExportStats,
  ImportResult,
} from "@/lib/api";

export default function DataPage() {
  const [stats, setStats] = useState<ExportStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [skipDuplicates, setSkipDuplicates] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importType, setImportType] = useState<string>("");

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    setLoading(true);
    try {
      const data = await getExportStats();
      setStats(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function handleExport(url: string) {
    window.open(url, "_blank");
  }

  function triggerImport(type: string) {
    setImportType(type);
    setImportResult(null);
    setError(null);
    fileInputRef.current?.click();
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setError(null);
    setImportResult(null);

    try {
      let result: ImportResult;

      switch (importType) {
        case "vocab-csv":
          result = await importVocabCsv(file, skipDuplicates);
          break;
        case "vocab-json":
          result = await importVocabJson(file, skipDuplicates);
          break;
        case "grammar-csv":
          result = await importGrammarCsv(file, skipDuplicates);
          break;
        case "grammar-json":
          result = await importGrammarJson(file, skipDuplicates);
          break;
        case "backup":
          result = await importFullBackup(file, skipDuplicates);
          break;
        default:
          throw new Error("알 수 없는 가져오기 타입입니다.");
      }

      setImportResult(result);
      loadStats();
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || "가져오기 실패");
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

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
          <h1 className="mt-3 text-lg ">データ</h1>
        </header>

        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept=".csv,.json"
          className="hidden"
        />

        {/* Loading */}
        {loading && (
          <div className="py-20 text-center">
            <p className="text-sm text-neutral-500">불러오는 중...</p>
          </div>
        )}

        {/* Stats */}
        {!loading && stats && (
          <div className="mb-12 grid grid-cols-2 gap-px bg-neutral-100">
            <div className="bg-white p-6 text-center">
              <p className="text-2xl ">{stats.vocabulary_count}</p>
              <p className="mt-1 text-xs text-neutral-500">단어</p>
            </div>
            <div className="bg-white p-6 text-center">
              <p className="text-2xl ">{stats.grammar_count}</p>
              <p className="mt-1 text-xs text-neutral-500">문법</p>
            </div>
          </div>
        )}

        {/* Export Section */}
        <section className="mb-12">
          <h2 className="text-sm text-neutral-500 mb-6">내보내기</h2>

          <div className="space-y-6">
            {/* Vocabulary Export */}
            <div className="border-b border-neutral-100 pb-6">
              <p className="text-sm mb-3">단어장</p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleExport(getVocabCsvUrl())}
                  className="px-4 py-2 text-xs border border-neutral-200 text-neutral-600 hover:border-neutral-400 transition-colors"
                >
                  CSV
                </button>
                <button
                  onClick={() => handleExport(getVocabJsonUrl())}
                  className="px-4 py-2 text-xs border border-neutral-200 text-neutral-600 hover:border-neutral-400 transition-colors"
                >
                  JSON
                </button>
              </div>
            </div>

            {/* Grammar Export */}
            <div className="border-b border-neutral-100 pb-6">
              <p className="text-sm mb-3">문법</p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleExport(getGrammarCsvUrl())}
                  className="px-4 py-2 text-xs border border-neutral-200 text-neutral-600 hover:border-neutral-400 transition-colors"
                >
                  CSV
                </button>
                <button
                  onClick={() => handleExport(getGrammarJsonUrl())}
                  className="px-4 py-2 text-xs border border-neutral-200 text-neutral-600 hover:border-neutral-400 transition-colors"
                >
                  JSON
                </button>
              </div>
            </div>

            {/* Full Backup */}
            <div>
              <p className="text-sm mb-3">전체 백업</p>
              <button
                onClick={() => handleExport(getFullBackupUrl())}
                className="px-4 py-2 text-xs bg-neutral-900 text-white hover:bg-neutral-800 transition-colors"
              >
                JSON 다운로드
              </button>
            </div>
          </div>
        </section>

        {/* Import Section */}
        <section className="mb-12">
          <h2 className="text-sm text-neutral-500 mb-6">가져오기</h2>

          {/* Options */}
          <div className="mb-6 flex items-center gap-2">
            <input
              type="checkbox"
              id="skipDuplicates"
              checked={skipDuplicates}
              onChange={(e) => setSkipDuplicates(e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="skipDuplicates" className="text-xs text-neutral-600">
              중복 항목 건너뛰기
            </label>
          </div>

          <div className="space-y-6">
            {/* Vocabulary Import */}
            <div className="border-b border-neutral-100 pb-6">
              <p className="text-sm mb-3">단어장</p>
              <div className="flex gap-2">
                <button
                  onClick={() => triggerImport("vocab-csv")}
                  disabled={importing}
                  className="px-4 py-2 text-xs border border-neutral-200 text-neutral-600 hover:border-neutral-400 transition-colors disabled:opacity-50"
                >
                  CSV
                </button>
                <button
                  onClick={() => triggerImport("vocab-json")}
                  disabled={importing}
                  className="px-4 py-2 text-xs border border-neutral-200 text-neutral-600 hover:border-neutral-400 transition-colors disabled:opacity-50"
                >
                  JSON
                </button>
              </div>
              <p className="mt-2 text-[10px] text-neutral-500">
                CSV: kanji, reading, meaning, pos
              </p>
            </div>

            {/* Grammar Import */}
            <div className="border-b border-neutral-100 pb-6">
              <p className="text-sm mb-3">문법</p>
              <div className="flex gap-2">
                <button
                  onClick={() => triggerImport("grammar-csv")}
                  disabled={importing}
                  className="px-4 py-2 text-xs border border-neutral-200 text-neutral-600 hover:border-neutral-400 transition-colors disabled:opacity-50"
                >
                  CSV
                </button>
                <button
                  onClick={() => triggerImport("grammar-json")}
                  disabled={importing}
                  className="px-4 py-2 text-xs border border-neutral-200 text-neutral-600 hover:border-neutral-400 transition-colors disabled:opacity-50"
                >
                  JSON
                </button>
              </div>
              <p className="mt-2 text-[10px] text-neutral-500">
                CSV: title, meaning, description, example, example_meaning, level
              </p>
            </div>

            {/* Full Backup Import */}
            <div>
              <p className="text-sm mb-3">백업 복원</p>
              <button
                onClick={() => triggerImport("backup")}
                disabled={importing}
                className="px-4 py-2 text-xs border border-neutral-900 text-neutral-900 hover:bg-neutral-50 transition-colors disabled:opacity-50"
              >
                JSON 가져오기
              </button>
            </div>
          </div>

          {/* Importing indicator */}
          {importing && (
            <div className="mt-6 text-sm text-neutral-500">
              가져오는 중...
            </div>
          )}

          {/* Import Result */}
          {importResult && (
            <div className={`mt-6 p-4 border ${importResult.success ? "border-neutral-200" : "border-red-200"}`}>
              <p className="text-sm mb-2">
                {importResult.success ? "완료" : "실패"}
              </p>
              <div className="text-xs text-neutral-600 space-y-1">
                {importResult.vocabulary_imported > 0 && (
                  <p>단어: {importResult.vocabulary_imported}개 추가</p>
                )}
                {importResult.vocabulary_skipped > 0 && (
                  <p className="text-neutral-500">
                    단어 {importResult.vocabulary_skipped}개 건너뜀
                  </p>
                )}
                {importResult.grammar_imported > 0 && (
                  <p>문법: {importResult.grammar_imported}개 추가</p>
                )}
                {importResult.grammar_skipped > 0 && (
                  <p className="text-neutral-500">
                    문법 {importResult.grammar_skipped}개 건너뜀
                  </p>
                )}
                {importResult.errors.length > 0 && (
                  <div className="mt-2 text-red-600">
                    {importResult.errors.map((err, idx) => (
                      <p key={idx}>{err}</p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-6 p-4 border border-red-200 text-sm text-red-600">
              {error}
            </div>
          )}
        </section>

        {/* Format Examples */}
        <section className="mb-12">
          <h2 className="text-sm text-neutral-500 mb-6">파일 형식</h2>

          <div className="space-y-6">
            <div>
              <p className="text-xs text-neutral-500 mb-2">단어장 CSV</p>
              <pre className="bg-neutral-50 p-4 text-xs overflow-x-auto border border-neutral-100">
{`kanji,reading,meaning,pos
食べる,たべる,먹다,동사
飲む,のむ,마시다,동사`}
              </pre>
            </div>

            <div>
              <p className="text-xs text-neutral-500 mb-2">단어장 JSON</p>
              <pre className="bg-neutral-50 p-4 text-xs overflow-x-auto border border-neutral-100">
{`{
  "items": [
    {"kanji": "食べる", "reading": "たべる", "meaning": "먹다", "pos": "동사"}
  ]
}`}
              </pre>
            </div>
          </div>
        </section>

        {/* Navigation */}
        <div className="flex gap-3">
          <Link
            href="/"
            className="flex-1 py-3 text-center text-sm border border-neutral-200 text-neutral-600 hover:bg-neutral-50 transition-colors"
          >
            홈
          </Link>
          <Link
            href="/stats"
            className="flex-1 py-3 text-center text-sm bg-neutral-900 text-white hover:bg-neutral-800 transition-colors"
          >
            통계
          </Link>
        </div>
      </main>
    </div>
  );
}
