-- 일본어 학습 웹앱 데이터베이스 스키마
-- SQLite용 DDL (Data Definition Language)

-- ============================================
-- 1. 어휘 테이블 (Vocabulary)
-- OCR을 통해 추출된 개별 단어를 저장
-- ============================================
CREATE TABLE IF NOT EXISTS Vocabulary (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kanji TEXT NOT NULL,              -- 한자가 포함된 표기 (예: 食べる)
    reading TEXT,                      -- 후리가나/히라가나 표기 (예: たべる)
    meaning TEXT,                      -- 뜻 (한국어)
    pos TEXT,                          -- 품사 (동사, 명사, 형용사 등)
    source_img TEXT,                   -- 추출된 원본 사진 파일 경로
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스 생성 (검색 성능 향상)
CREATE INDEX IF NOT EXISTS idx_vocab_kanji ON Vocabulary(kanji);
CREATE INDEX IF NOT EXISTS idx_vocab_reading ON Vocabulary(reading);
CREATE INDEX IF NOT EXISTS idx_vocab_created ON Vocabulary(created_at);

-- ============================================
-- 2. SRS 복습 관리 테이블 (SRS_Review)
-- Anki의 핵심인 간격 반복(Spaced Repetition) 로직을 처리
-- ============================================
CREATE TABLE IF NOT EXISTS SRS_Review (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vocab_id INTEGER NOT NULL,         -- Vocabulary 테이블 참조
    interval INTEGER DEFAULT 0,        -- 복습 간격 (일 단위)
    ease_factor FLOAT DEFAULT 2.5,     -- 학습 난이도 계수 (기본값 2.5)
    next_review DATETIME DEFAULT CURRENT_TIMESTAMP,  -- 다음 복습 예정일
    reps INTEGER DEFAULT 0,            -- 총 성공 복습 횟수
    last_review DATETIME,              -- 마지막 복습 일시
    FOREIGN KEY (vocab_id) REFERENCES Vocabulary(id) ON DELETE CASCADE
);

-- 인덱스 생성 (오늘의 복습 카드 조회 성능 향상)
CREATE INDEX IF NOT EXISTS idx_srs_next_review ON SRS_Review(next_review);
CREATE INDEX IF NOT EXISTS idx_srs_vocab_id ON SRS_Review(vocab_id);

-- ============================================
-- 3. 문법 테이블 (Grammar)
-- 교재에서 정리한 핵심 문법 내용을 저장
-- ============================================
CREATE TABLE IF NOT EXISTS Grammar (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,               -- 문법 항목 (예: ~ている)
    explanation TEXT,                  -- 문법 설명 및 용법
    example_jp TEXT,                   -- 일본어 예문
    example_kr TEXT,                   -- 예문 해석 (한국어)
    level TEXT,                        -- 난이도 레벨 (N5, N4, N3, N2, N1)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_grammar_title ON Grammar(title);
CREATE INDEX IF NOT EXISTS idx_grammar_level ON Grammar(level);

-- ============================================
-- 4. 한자 테이블 (Kanji)
-- 단어와 별도로 한자 자체의 정보를 공부하기 위한 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS Kanji (
    kanji_char TEXT PRIMARY KEY,       -- 한자 글자 (예: 食)
    onyomi TEXT,                       -- 음독 (예: ショク)
    kunyomi TEXT,                      -- 훈독 (예: たべる)
    stroke_count INTEGER,              -- 획수
    meaning TEXT,                      -- 대표 의미
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 5. 단어-한자 연결 테이블 (Vocab_Kanji)
-- 여러 단어가 같은 한자를 포함할 수 있으므로 다대다 관계
-- ============================================
CREATE TABLE IF NOT EXISTS Vocab_Kanji (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vocab_id INTEGER NOT NULL,
    kanji_char TEXT NOT NULL,
    FOREIGN KEY (vocab_id) REFERENCES Vocabulary(id) ON DELETE CASCADE,
    FOREIGN KEY (kanji_char) REFERENCES Kanji(kanji_char) ON DELETE CASCADE,
    UNIQUE(vocab_id, kanji_char)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_vk_vocab_id ON Vocab_Kanji(vocab_id);
CREATE INDEX IF NOT EXISTS idx_vk_kanji_char ON Vocab_Kanji(kanji_char);

-- ============================================
-- 6. OCR 로그 테이블 (OCR_Logs)
-- OCR로 읽어온 가공되지 않은 원본 텍스트 저장
-- 나중에 오인식된 단어를 재수정할 때 원본 확인 용도
-- ============================================
CREATE TABLE IF NOT EXISTS OCR_Logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    image_path TEXT NOT NULL,          -- 원본 이미지 경로
    raw_text TEXT,                     -- OCR로 추출된 원본 텍스트
    processed_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 7. 학습 기록 테이블 (Study_Logs)
-- 사용자의 학습 활동 기록 (통계 및 분석용)
-- ============================================
CREATE TABLE IF NOT EXISTS Study_Logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vocab_id INTEGER NOT NULL,
    review_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    result TEXT,                       -- 'known' 또는 'unknown'
    FOREIGN KEY (vocab_id) REFERENCES Vocabulary(id) ON DELETE CASCADE
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_study_vocab_id ON Study_Logs(vocab_id);
CREATE INDEX IF NOT EXISTS idx_study_date ON Study_Logs(review_date);

-- ============================================
-- 트리거: Vocabulary 업데이트 시 updated_at 자동 갱신
-- ============================================
CREATE TRIGGER IF NOT EXISTS update_vocabulary_timestamp 
AFTER UPDATE ON Vocabulary
BEGIN
    UPDATE Vocabulary 
    SET updated_at = CURRENT_TIMESTAMP 
    WHERE id = NEW.id;
END;

-- ============================================
-- 트리거: Grammar 업데이트 시 updated_at 자동 갱신
-- ============================================
CREATE TRIGGER IF NOT EXISTS update_grammar_timestamp 
AFTER UPDATE ON Grammar
BEGIN
    UPDATE Grammar 
    SET updated_at = CURRENT_TIMESTAMP 
    WHERE id = NEW.id;
END;

-- ============================================
-- 샘플 데이터 삽입 (테스트용)
-- ============================================

-- 샘플 단어 데이터
INSERT OR IGNORE INTO Vocabulary (kanji, reading, meaning, pos) VALUES
('食べる', 'たべる', '먹다', '동사'),
('学校', 'がっこう', '학교', '명사'),
('大きい', 'おおきい', '큰', '형용사'),
('見る', 'みる', '보다', '동사'),
('勉強', 'べんきょう', '공부', '명사');

-- 샘플 SRS 복습 데이터 (첫 단어에 대해)
INSERT OR IGNORE INTO SRS_Review (vocab_id, interval, next_review) 
SELECT id, 0, CURRENT_TIMESTAMP 
FROM Vocabulary 
WHERE kanji = '食べる' 
LIMIT 1;

-- 샘플 문법 데이터
INSERT OR IGNORE INTO Grammar (title, explanation, example_jp, example_kr, level) VALUES
('~ている', '진행형 또는 상태를 나타냄', '今、本を読んでいる。', '지금 책을 읽고 있다.', 'N4'),
('~てください', '~해 주세요 (의뢰 표현)', '窓を開けてください。', '창문을 열어 주세요.', 'N5');

-- 샘플 한자 데이터
INSERT OR IGNORE INTO Kanji (kanji_char, onyomi, kunyomi, stroke_count, meaning) VALUES
('食', 'ショク', 'たべる', 9, '먹다'),
('校', 'コウ', 'こう', 10, '학교'),
('大', 'ダイ', 'おおきい', 3, '큰');

-- ============================================
-- 유용한 쿼리 예제
-- ============================================

-- 오늘의 복습 카드 조회
-- SELECT v.*, s.next_review, s.interval, s.reps
-- FROM Vocabulary v
-- JOIN SRS_Review s ON v.id = s.vocab_id
-- WHERE s.next_review <= CURRENT_TIMESTAMP
-- ORDER BY s.next_review ASC;

-- 특정 단어에 포함된 한자 조회
-- SELECT k.*
-- FROM Kanji k
-- JOIN Vocab_Kanji vk ON k.kanji_char = vk.kanji_char
-- WHERE vk.vocab_id = 1;

-- 통계: 전체 단어 수
-- SELECT COUNT(*) as total_words FROM Vocabulary;

-- 통계: 오늘 복습해야 할 카드 수
-- SELECT COUNT(*) as today_review_count
-- FROM SRS_Review
-- WHERE next_review <= CURRENT_TIMESTAMP;