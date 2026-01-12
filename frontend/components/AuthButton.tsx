"use client";

/**
 * Sync Button (로그인 없는 버전)
 *
 * - 기기 ID 표시 (복사 가능)
 * - 동기화 버튼
 * - 다른 기기 ID 입력 기능
 */

import { useState, useEffect } from "react";
import { isSupabaseEnabled, getDeviceId, setDeviceId } from "@/lib/supabase";
import { syncWithCloud, getLastSyncTime } from "@/lib/static-data";

export default function AuthButton() {
  const [deviceId, setDeviceIdState] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [showIdModal, setShowIdModal] = useState(false);
  const [inputId, setInputId] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setDeviceIdState(getDeviceId());
      setLastSync(getLastSyncTime());
    }
  }, []);

  // Supabase 미설정시 표시 안함
  if (!isSupabaseEnabled()) return null;

  const handleSync = async () => {
    setSyncing(true);
    const result = await syncWithCloud();
    setLastSync(getLastSyncTime());
    alert(result.message);
    setSyncing(false);
  };

  const handleCopyId = async () => {
    await navigator.clipboard.writeText(deviceId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleChangeId = () => {
    if (!inputId.trim()) return;
    setDeviceId(inputId.trim());
    setDeviceIdState(inputId.trim());
    setShowIdModal(false);
    setInputId("");
    // 새 ID로 동기화
    syncWithCloud().then((result) => {
      setLastSync(getLastSyncTime());
      alert(`ID 변경됨. ${result.message}`);
    });
  };

  const shortId = deviceId.slice(0, 8);

  return (
    <>
      <div className="flex items-center gap-2">
        {/* 기기 ID (클릭시 복사) */}
        <button
          onClick={handleCopyId}
          className="px-2 py-1 text-xs font-mono bg-gray-100 rounded hover:bg-gray-200"
          title={`기기 ID: ${deviceId}\n클릭하여 복사`}
        >
          {copied ? "복사됨!" : shortId}
        </button>

        {/* 동기화 버튼 */}
        <button
          onClick={handleSync}
          disabled={syncing}
          className="px-3 py-1.5 text-sm bg-green-50 text-green-700 rounded-lg hover:bg-green-100 disabled:opacity-50"
          title={lastSync ? `마지막: ${new Date(lastSync).toLocaleString()}` : "동기화"}
        >
          {syncing ? "⏳" : "☁️"}
        </button>

        {/* ID 변경 버튼 */}
        <button
          onClick={() => setShowIdModal(true)}
          className="px-2 py-1.5 text-sm text-gray-500 hover:text-gray-700"
          title="다른 기기 ID로 변경"
        >
          ⚙️
        </button>
      </div>

      {/* ID 변경 모달 */}
      {showIdModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
            <h2 className="text-lg font-semibold mb-4">기기 동기화</h2>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-600">현재 기기 ID</label>
                <div className="flex gap-2 mt-1">
                  <code className="flex-1 px-3 py-2 bg-gray-100 rounded text-xs break-all">
                    {deviceId}
                  </code>
                  <button
                    onClick={handleCopyId}
                    className="px-3 py-2 bg-blue-500 text-white rounded text-sm"
                  >
                    복사
                  </button>
                </div>
              </div>

              <hr />

              <div>
                <label className="text-sm text-gray-600">
                  다른 기기 ID 입력 (동기화용)
                </label>
                <input
                  type="text"
                  value={inputId}
                  onChange={(e) => setInputId(e.target.value)}
                  placeholder="다른 기기의 ID를 붙여넣기"
                  className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
                />
                <p className="mt-1 text-xs text-gray-400">
                  다른 기기의 ID를 입력하면 해당 기기의 학습 데이터를 가져옵니다.
                </p>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowIdModal(false)}
                className="flex-1 py-2 bg-gray-100 rounded-lg"
              >
                취소
              </button>
              <button
                onClick={handleChangeId}
                disabled={!inputId.trim()}
                className="flex-1 py-2 bg-blue-500 text-white rounded-lg disabled:opacity-50"
              >
                ID 변경
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
