# J-Flash - 일본어 플래시카드 학습 앱

LLM을 활용하여 일본어 교재에서 단어/문법을 추출하고, SRS(Spaced Repetition System)로 복습하는 앱입니다.

## 아키텍처

```
[로컬: Claude로 이미지 추출] → [SQLite DB] → [Git Push] → [웹: 복습 전용]
```

- **Full Mode**: 로컬 환경에서 단어 추가/수정/삭제 가능
- **Lite Mode**: 웹 환경에서 복습만 가능 (읽기 전용)

---

## 사용법

### 1단계: 이미지에서 단어 추출 (수동)

Claude에게 일본어 교재 이미지를 첨부하고 아래 프롬프트를 사용하세요:

```
이 일본어 교재 이미지에서 단어와 문법을 추출해서 SQL INSERT 문으로 만들어줘.

## 규칙
1. 이미지에 보이는 단어만 (환각 금지)
2. 조사(は,が,を,に,で), 조동사(です,ます,た,ない) 제외
3. 동사는 사전형으로 (食べた → 食べる)
4. 예문 필수 - 없으면 자연스럽게 생성
5. 의미는 한국어로

## 출력 형식

### 단어
INSERT INTO Vocabulary (kanji, reading, meaning, pos, example_sentence, example_meaning, jlpt_level) VALUES
('食べる', 'たべる', '먹다', '動詞', '朝ごはんを食べる。', '아침밥을 먹는다.', 'N5'),
('学校', 'がっこう', '학교', '名詞', '学校に行きます。', '학교에 갑니다.', 'N5');

### 문법
INSERT INTO Grammar (title, explanation, example_jp, example_kr, level) VALUES
('〜ている', '진행/상태를 나타냄', '本を読んでいる。', '책을 읽고 있다.', 'N4');
```

### 2단계: DB에 저장

생성된 SQL을 SQLite에 실행:

```bash
# 백엔드 디렉토리에서
cd backend
sqlite3 data/japanese_learning.db < insert.sql
```

또는 DB 도구(DBeaver, DB Browser for SQLite 등)에서 직접 실행.

### 3단계: 복습

웹 앱에서 복습:
- http://localhost:3000/review

---

## 복습 모드 (4종)

| 모드 | 앞면 | 뒷면 |
|------|------|------|
| 기본 | 彼 | かれ / 남자친구 |
| 역방향 | 남자친구 | 彼 (かれ) |
| 듣기 | 🔊 TTS | 彼 / 남자친구 |
| 빈칸 | ___は学生です | 彼 |

---

## 실행 방법

### 백엔드

```bash
cd backend
source venv/bin/activate  # 가상환경 활성화
uvicorn main:app --reload --port 8000
```

### 프론트엔드

```bash
cd frontend
npm run dev
```

### 접속

- 프론트엔드: http://localhost:3000
- API 문서: http://localhost:8000/docs

---

## 환경 변수

### 백엔드 (.env)

```env
# Full mode (로컬 - 단어 추가 가능)
DEPLOY_MODE=full

# Lite mode (웹 배포 - 복습만 가능)
DEPLOY_MODE=lite
```

### 프론트엔드 (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## 핵심 페이지

| 경로 | 설명 |
|------|------|
| `/review` | SRS 플래시카드 복습 |
| `/vocab` | 단어장 조회/검색 |
| `/grammar` | 문법 조회/검색 |

### 보조 페이지

| 경로 | 설명 |
|------|------|
| `/stats` | 학습 통계 (스트릭, 정답률) |
| `/data` | 데이터 백업/복원 |
| `/kanji` | 한자 분석 |

---

## DB 스키마

### Vocabulary

```sql
CREATE TABLE Vocabulary (
    id INTEGER PRIMARY KEY,
    kanji TEXT NOT NULL,
    reading TEXT,
    meaning TEXT,
    pos TEXT,
    jlpt_level TEXT,
    example_sentence TEXT,
    example_meaning TEXT,
    source_context TEXT,
    confidence REAL DEFAULT 1.0,
    surface TEXT,
    needs_review INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Grammar

```sql
CREATE TABLE Grammar (
    id INTEGER PRIMARY KEY,
    title TEXT NOT NULL,
    explanation TEXT,
    example_jp TEXT,
    example_kr TEXT,
    level TEXT,
    similar_patterns TEXT,
    usage_notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### SRS_Review

```sql
CREATE TABLE SRS_Review (
    id INTEGER PRIMARY KEY,
    vocab_id INTEGER,
    interval INTEGER DEFAULT 1,
    ease_factor REAL DEFAULT 2.5,
    next_review DATETIME,
    reps INTEGER DEFAULT 0,
    FOREIGN KEY (vocab_id) REFERENCES Vocabulary(id)
);
```

---

## SRS 알고리즘

SM-2 알고리즘 기반:

```
정답 → interval × ease_factor
오답 → interval = 1, ease_factor 감소
연속 5회 정답 → 마스터
```

### 기본 간격

```
당일 → 1일 → 3일 → 7일 → 14일 → 30일
```

---

## 버전

- **앱 버전**: 1.2.0
- **복습 모드**: 4종 (기본, 역방향, 듣기, 빈칸)
- **TTS**: Web Speech API (ja-JP)
