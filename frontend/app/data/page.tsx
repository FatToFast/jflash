"use client";

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
      loadStats(); // Refresh stats after import
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || "가져오기 실패");
    } finally {
      setImporting(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-gray-600 hover:text-gray-900">
                ← 홈
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">💾 데이터 관리</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept=".csv,.json"
          className="hidden"
        />

        {/* Stats */}
        {!loading && stats && (
          <section className="mb-8">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">현재 데이터</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-3xl font-bold text-blue-600">
                    {stats.vocabulary_count}
                  </p>
                  <p className="text-sm text-blue-700">단어</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <p className="text-3xl font-bold text-purple-600">
                    {stats.grammar_count}
                  </p>
                  <p className="text-sm text-purple-700">문법</p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Export Section */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">📤 내보내기</h2>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <p className="text-gray-600 mb-6">
              데이터를 CSV 또는 JSON 형식으로 내보내 백업하거나 다른 기기에서 사용할 수
              있습니다.
            </p>

            <div className="space-y-4">
              {/* Vocabulary Export */}
              <div className="border rounded-lg p-4">
                <h3 className="font-medium text-gray-800 mb-3">📚 단어장</h3>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleExport(getVocabCsvUrl())}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                  >
                    CSV 다운로드
                  </button>
                  <button
                    onClick={() => handleExport(getVocabJsonUrl())}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    JSON 다운로드
                  </button>
                </div>
              </div>

              {/* Grammar Export */}
              <div className="border rounded-lg p-4">
                <h3 className="font-medium text-gray-800 mb-3">📖 문법</h3>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleExport(getGrammarCsvUrl())}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                  >
                    CSV 다운로드
                  </button>
                  <button
                    onClick={() => handleExport(getGrammarJsonUrl())}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    JSON 다운로드
                  </button>
                </div>
              </div>

              {/* Full Backup */}
              <div className="border border-amber-200 bg-amber-50 rounded-lg p-4">
                <h3 className="font-medium text-amber-800 mb-3">
                  🗃️ 전체 백업 (단어 + 문법)
                </h3>
                <button
                  onClick={() => handleExport(getFullBackupUrl())}
                  className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
                >
                  전체 백업 다운로드 (JSON)
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Import Section */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">📥 가져오기</h2>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <p className="text-gray-600 mb-4">
              CSV 또는 JSON 파일에서 데이터를 가져옵니다.
            </p>

            {/* Options */}
            <div className="mb-6">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={skipDuplicates}
                  onChange={(e) => setSkipDuplicates(e.target.checked)}
                  className="rounded"
                />
                중복 항목 건너뛰기 (이미 존재하는 단어/문법은 가져오지 않음)
              </label>
            </div>

            <div className="space-y-4">
              {/* Vocabulary Import */}
              <div className="border rounded-lg p-4">
                <h3 className="font-medium text-gray-800 mb-3">📚 단어장</h3>
                <div className="flex gap-3">
                  <button
                    onClick={() => triggerImport("vocab-csv")}
                    disabled={importing}
                    className="px-4 py-2 border border-green-500 text-green-600 rounded-lg hover:bg-green-50 transition-colors disabled:opacity-50"
                  >
                    CSV 가져오기
                  </button>
                  <button
                    onClick={() => triggerImport("vocab-json")}
                    disabled={importing}
                    className="px-4 py-2 border border-blue-500 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50"
                  >
                    JSON 가져오기
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  CSV 형식: kanji, reading, meaning, pos (헤더 필수)
                </p>
              </div>

              {/* Grammar Import */}
              <div className="border rounded-lg p-4">
                <h3 className="font-medium text-gray-800 mb-3">📖 문법</h3>
                <div className="flex gap-3">
                  <button
                    onClick={() => triggerImport("grammar-csv")}
                    disabled={importing}
                    className="px-4 py-2 border border-green-500 text-green-600 rounded-lg hover:bg-green-50 transition-colors disabled:opacity-50"
                  >
                    CSV 가져오기
                  </button>
                  <button
                    onClick={() => triggerImport("grammar-json")}
                    disabled={importing}
                    className="px-4 py-2 border border-blue-500 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50"
                  >
                    JSON 가져오기
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  CSV 형식: title, meaning, description, example, example_meaning, level
                </p>
              </div>

              {/* Full Backup Import */}
              <div className="border border-amber-200 bg-amber-50 rounded-lg p-4">
                <h3 className="font-medium text-amber-800 mb-3">
                  🗃️ 전체 백업 복원
                </h3>
                <button
                  onClick={() => triggerImport("backup")}
                  disabled={importing}
                  className="px-4 py-2 border border-amber-500 text-amber-600 rounded-lg hover:bg-amber-100 transition-colors disabled:opacity-50"
                >
                  백업 파일 가져오기 (JSON)
                </button>
              </div>
            </div>

            {/* Importing indicator */}
            {importing && (
              <div className="mt-6 flex items-center gap-3 text-blue-600">
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500"></div>
                <span>가져오는 중...</span>
              </div>
            )}

            {/* Import Result */}
            {importResult && (
              <div
                className={`mt-6 p-4 rounded-lg ${
                  importResult.success ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"
                }`}
              >
                <h4 className="font-medium text-gray-800 mb-2">
                  {importResult.success ? "✅ 가져오기 완료" : "❌ 가져오기 실패"}
                </h4>
                <div className="text-sm text-gray-700 space-y-1">
                  {importResult.vocabulary_imported > 0 && (
                    <p>📚 단어: {importResult.vocabulary_imported}개 추가됨</p>
                  )}
                  {importResult.vocabulary_skipped > 0 && (
                    <p className="text-gray-500">
                      (단어 {importResult.vocabulary_skipped}개 중복으로 건너뜀)
                    </p>
                  )}
                  {importResult.grammar_imported > 0 && (
                    <p>📖 문법: {importResult.grammar_imported}개 추가됨</p>
                  )}
                  {importResult.grammar_skipped > 0 && (
                    <p className="text-gray-500">
                      (문법 {importResult.grammar_skipped}개 중복으로 건너뜀)
                    </p>
                  )}
                  {importResult.errors.length > 0 && (
                    <div className="mt-2 text-red-600">
                      <p className="font-medium">오류:</p>
                      <ul className="list-disc list-inside">
                        {importResult.errors.map((err, idx) => (
                          <li key={idx}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="mt-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700">
                {error}
              </div>
            )}
          </div>
        </section>

        {/* Format Examples */}
        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">📋 파일 형식 예시</h2>
          <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
            {/* CSV Example */}
            <div>
              <h3 className="font-medium text-gray-800 mb-2">단어장 CSV 형식</h3>
              <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
{`kanji,reading,meaning,pos
食べる,たべる,먹다,동사
飲む,のむ,마시다,동사
本,ほん,책,명사`}
              </pre>
            </div>

            {/* JSON Example */}
            <div>
              <h3 className="font-medium text-gray-800 mb-2">단어장 JSON 형식</h3>
              <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
{`{
  "items": [
    {"kanji": "食べる", "reading": "たべる", "meaning": "먹다", "pos": "동사"},
    {"kanji": "飲む", "reading": "のむ", "meaning": "마시다", "pos": "동사"}
  ]
}`}
              </pre>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
