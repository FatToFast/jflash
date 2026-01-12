/**
 * Supabase Client - 간단 버전 (인증 없음)
 *
 * 로그인 없이 기기 ID(UUID)로만 데이터 구분
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";

// 로컬 SRS 상태 인터페이스
export interface SRSStateLocal {
  vocab_id: number;
  interval: number;
  ease_factor: number;
  next_review: string;
  reps: number;
}

// Supabase 레코드 인터페이스
export interface SRSRecord {
  id?: number;
  device_id: string;
  vocab_id: number;
  interval: number;
  ease_factor: number;
  next_review: string;
  reps: number;
  updated_at?: string;
}

// Supabase 클라이언트
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase: SupabaseClient | null =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

export const isSupabaseEnabled = (): boolean => supabase !== null;

// 기기 ID 관련 상수
const DEVICE_ID_KEY = "jflash_device_id";

/**
 * 기기 ID 가져오기 (없으면 생성)
 */
export function getDeviceId(): string {
  if (typeof window === "undefined") return "";

  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
}

/**
 * 기기 ID 설정 (다른 기기에서 복사해온 경우)
 */
export function setDeviceId(id: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(DEVICE_ID_KEY, id);
}

/**
 * 클라우드에서 SRS 데이터 가져오기
 */
export async function fetchFromCloud(
  deviceId: string
): Promise<Record<number, SRSStateLocal> | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("srs_records")
    .select("*")
    .eq("device_id", deviceId);

  if (error) {
    console.error("Fetch error:", error);
    return null;
  }

  const result: Record<number, SRSStateLocal> = {};
  for (const record of data || []) {
    result[record.vocab_id] = {
      vocab_id: record.vocab_id,
      interval: record.interval,
      ease_factor: record.ease_factor,
      next_review: record.next_review,
      reps: record.reps,
    };
  }
  return result;
}

/**
 * 클라우드에 SRS 데이터 저장
 */
export async function saveToCloud(
  deviceId: string,
  records: Record<number, SRSStateLocal>
): Promise<boolean> {
  if (!supabase) return false;

  const data = Object.values(records).map((r) => ({
    device_id: deviceId,
    vocab_id: r.vocab_id,
    interval: r.interval,
    ease_factor: r.ease_factor,
    next_review: r.next_review,
    reps: r.reps,
    updated_at: new Date().toISOString(),
  }));

  if (data.length === 0) return true;

  const { error } = await supabase.from("srs_records").upsert(data, {
    onConflict: "device_id,vocab_id",
  });

  if (error) {
    console.error("Save error:", error);
    return false;
  }

  return true;
}

/**
 * 단일 레코드 저장 (복습 시 호출)
 */
export async function saveSingleRecord(
  deviceId: string,
  state: SRSStateLocal
): Promise<void> {
  if (!supabase) return;

  await supabase.from("srs_records").upsert(
    {
      device_id: deviceId,
      vocab_id: state.vocab_id,
      interval: state.interval,
      ease_factor: state.ease_factor,
      next_review: state.next_review,
      reps: state.reps,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "device_id,vocab_id" }
  );
}
