-- J-Flash SRS Schema (간단 버전 - 인증 없음)
-- Supabase Dashboard > SQL Editor에서 실행

-- SRS Records 테이블
CREATE TABLE IF NOT EXISTS srs_records (
    id BIGSERIAL PRIMARY KEY,
    device_id TEXT NOT NULL,                    -- 기기 UUID (인증 대신 사용)
    vocab_id INTEGER NOT NULL,
    interval INTEGER NOT NULL DEFAULT 1,
    ease_factor REAL NOT NULL DEFAULT 2.5,
    next_review TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reps INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(device_id, vocab_id)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_srs_device_id ON srs_records(device_id);
CREATE INDEX IF NOT EXISTS idx_srs_device_vocab ON srs_records(device_id, vocab_id);

-- RLS 비활성화 (개인 사용, 인증 없음)
ALTER TABLE srs_records DISABLE ROW LEVEL SECURITY;

-- updated_at 자동 업데이트
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS srs_records_updated_at ON srs_records;
CREATE TRIGGER srs_records_updated_at
    BEFORE UPDATE ON srs_records
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();
