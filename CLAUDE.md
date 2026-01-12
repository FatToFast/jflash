# J-Flash - LLM 기반 일본어 학습 가이드라인

## 프로젝트 개요

J-Flash는 LLM(Claude)을 활용하여 일본어 교재 이미지에서 단어와 문법을 추출하고, SRS(Spaced Repetition System)로 복습하는 일본어 학습 앱입니다.

### 아키텍처
```
[이미지] → [Claude 추출] → [JSON 저장] → [Git Push] → [Web 복습]
```

- **Full Mode**: 로컬 환경에서 단어 추가/수정/삭제 가능
- **Lite Mode**: 웹 환경에서 복습만 가능 (읽기 전용)

---

## 이미지 추출 워크플로우

### 방법 1: Claude Code CLI (권장)

Claude Code에서 이미지를 첨부하고 "단어 추출" 또는 "문장 추출" 요청 시 **자동으로** 처리됩니다.

```
사용자: [이미지 첨부] 단어 추출해줘
Claude Code:
1. 이미지에서 단어 추출
2. words.json 파일에 자동 저장
3. git commit & push
4. GitHub Actions → Supabase 자동 동기화
```

### 방법 2: Claude 앱 (모바일/웹)

Claude 앱에서는 파일을 직접 수정할 수 없으므로, JSON 출력 후 수동으로 복사해야 합니다.

**프롬프트 예시:**
```
이 일본어 교재 이미지에서 단어를 추출해서 JSON 배열로 만들어줘.

## 규칙
1. 이미지에 보이는 단어만 (환각 금지)
2. 조사(は,が,を,に,で), 조동사(です,ます,た,ない) 제외
3. 동사는 사전형으로 (食べた → 食べる)
4. 예문 필수 - 없으면 자연스럽게 생성
5. 의미는 한국어로
6. id는 [마지막 ID + 1]부터 시작

## 출력 형식
[
  {"id": 62, "kanji": "...", "reading": "...", "meaning": "...", "pos": "...", "jlpt_level": "N5", "example_sentence": "...", "example_meaning": "..."}
]
```

**수동 적용 방법:**
1. Claude가 출력한 JSON 복사
2. `frontend/public/data/words.json` 파일 열기
3. 배열 끝에 새 항목 추가 (마지막 `]` 앞에)
4. 저장 후 커밋 & 푸시

---

### 추출 규칙

| 사용자 요청 | 모드 | pos 값 | 저장 파일 |
|-------------|------|--------|-----------|
| "단어 추출" | 단어 모드 | 名詞, 動詞, 形容詞 등 | words.json |
| "문장 추출" | 문장 모드 | 文 | sentences.json |

**이미지 처리:**
- 이미지에 보이는 단어/문장만 추출 (환각 금지)
- 조사, 조동사 제외
- 동사는 사전형으로 정규화
- 예문 필수 (없으면 생성)

---

### JSON 스키마

**단어:**
```json
{
  "id": 1,
  "kanji": "食べる",
  "reading": "たべる",
  "meaning": "먹다",
  "pos": "動詞",
  "jlpt_level": "N5",
  "example_sentence": "朝ごはんを食べます。",
  "example_meaning": "아침밥을 먹습니다."
}
```

**문장:**
```json
{
  "id": 15,
  "kanji": "ぼくは学生。",
  "reading": "ぼくはがくせい。",
  "meaning": "나는 학생이야.",
  "pos": "文",
  "jlpt_level": "N5",
  "example_sentence": "",
  "example_meaning": ""
}
```

---

### 처리 규칙 (Claude Code 자동 처리)

1. 기존 JSON 파일 읽기
2. 마지막 id 확인 후 새 id 부여
3. 중복 확인 (동일 kanji + reading → 스킵)
4. 새 항목 추가 후 저장
5. Git 커밋 & 푸시
6. 결과 테이블 출력:

| id | 단어 | 읽기 | 의미 | 품사 |
|----|------|------|------|------|

---

## LLM 단어 추출 가이드라인

### 1. 핵심 원칙: 환각 방지

```
❌ 금지: OCR 텍스트에 없는 단어 생성
✅ 필수: 실제 이미지에 존재하는 토큰만 추출
```

**검증 방법**: 추출된 모든 단어는 원본 이미지에서 확인 가능해야 함

### 2. 기본형 정규화

| 필드 | 설명 | 예시 |
|------|------|------|
| `surface` | 원문 그대로 (활용형) | 勉強した |
| `kanji` | 사전형 (기본형) | 勉強する |
| `reading` | 히라가나 읽기 | べんきょうする |

### 3. 제외 항목

다음 품사/항목은 단어장에 추가하지 않습니다:

- **조사**: は, が, を, に, で, と, も, から, まで, より, へ
- **조동사**: です, ます, た, ない, れる, られる
- **기호/숫자만**: 1, 2, !, ? 등
- **1글자 히라가나**: あ, い, う, え, お

### 4. 신뢰도 기준

| confidence | 처리 | needs_review |
|------------|------|--------------|
| ≥ 0.8 | 자동 저장 | 0 |
| 0.5 ~ 0.8 | 저장 + 검토 표시 | 1 |
| < 0.5 | 경고 반환, 재촬영 권장 | - |

### 5. 중복 처리

```
동일 lemma → 1개로 병합
다양한 표기 → surface에 보존
```

---

## 출력 스키마

### 입력
- 이미지 파일 (교재 사진)
- 메타 정보: 페이지 번호, 교재명 (선택)

### 출력 JSON 형식

```json
{
  "status": "ok",
  "source_context": "みんなの日本語 1課",
  "words": [
    {
      "surface": "勉強した",
      "kanji": "勉強する",
      "reading": "べんきょうする",
      "meaning": "공부하다",
      "pos": "動詞",
      "jlpt_level": "N5",
      "example_sentence": "毎日日本語を勉強する。",
      "example_meaning": "매일 일본어를 공부한다.",
      "confidence": 0.9
    }
  ],
  "grammar": [
    {
      "title": "〜は〜です",
      "meaning": "~은/는 ~입니다",
      "description": "명사 술어문의 기본 형태",
      "level": "N5",
      "example": "私は学生です。",
      "example_meaning": "저는 학생입니다."
    }
  ],
  "warnings": []
}
```

### 경고 유형
- `low_ocr_quality`: 이미지 품질 낮음
- `many_unknown_chars`: 인식 불가 문자 다수
- `needs_manual_review`: 수동 검토 권장

---

## 품사(POS) 값

| 값 | 한국어 | 설명 |
|----|--------|------|
| 名詞 | 명사 | 사람, 사물, 개념 |
| 動詞 | 동사 | 동작, 상태 |
| 形容詞 | 형용사 | い형용사 |
| 副詞 | 부사 | 정도, 빈도 |
| 接続詞 | 접속사 | 문장 연결 |
| 感動詞 | 감동사 | 감탄 |
| 連体詞 | 연체사 | 수식어 |

---

## 학습 효율 전략

### A. 신규 단어 제한
- 하루 신규: 10~20개로 시작
- 정답률 80% 이상 → 증가 허용
- 오답률 높으면 → 신규 투입 감소

### B. 복습 모드 (4종)

| 모드 | 앞면 | 뒷면 |
|------|------|------|
| 기본 | 彼 | かれ / 남자친구 |
| 역방향 | 남자친구 | 彼 (かれ) |
| 듣기 | 🔊 TTS | 彼 / 남자친구 |
| 빈칸 | ___は学生です | 彼 |

### C. SRS 간격
```
초기: 당일 → 다음날 → 3일 → 7일 → 14일 → 30일
오답: 즉시 1일로 축소
연속 5회 정답: 숙달 분류
```

### D. 예문 학습 (필수)

**원칙**: 단어만 외우지 말고, 반드시 예문과 함께 학습

| 단어만 | 예문과 함께 |
|--------|-------------|
| 彼 = 그 | 彼は学生です。 (그는 학생입니다) |
| 理解력 낮음 | 실제 용법 체득 |

**추출 시 예문 포함 필수**:
```json
{
  "kanji": "勉強する",
  "example_sentence": "毎日日本語を勉強します。",
  "example_meaning": "매일 일본어를 공부합니다."
}
```

- 교재에 예문이 있으면 반드시 함께 추출
- 예문이 없으면 LLM이 자연스러운 예문 생성
- 모든 복습 모드에서 뒷면에 예문 표시

### E. 맥락 강화
- 원문 예문 저장 (example_sentence)
- 출처 정보 보존 (source_context)

---

## 데이터베이스 스키마

### Vocabulary 테이블

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | INTEGER | PK |
| kanji | TEXT | 기본형 (사전형) |
| reading | TEXT | 히라가나 읽기 |
| meaning | TEXT | 한국어 의미 |
| pos | TEXT | 품사 |
| source_img | TEXT | 이미지 경로 |
| source_img_data | BLOB | 이미지 바이트 |
| created_at | DATETIME | 생성일 |
| jlpt_level | TEXT | N5~N1 |
| example_sentence | TEXT | 예문 |
| example_meaning | TEXT | 예문 해석 |
| source_context | TEXT | 출처 (교재/페이지) |
| confidence | REAL | LLM 신뢰도 0~1 |
| surface | TEXT | 원문 표기 |
| needs_review | INTEGER | 검토 필요 여부 |

### SRS_Review 테이블

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | INTEGER | PK |
| vocab_id | INTEGER | FK → Vocabulary |
| interval | INTEGER | 복습 간격 (일) |
| ease_factor | REAL | 난이도 계수 |
| next_review | DATETIME | 다음 복습일 |
| reps | INTEGER | 정답 횟수 |

### Grammar 테이블

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | INTEGER | PK |
| title | TEXT | 문법 패턴 |
| meaning | TEXT | 한국어 의미 |
| description | TEXT | 설명 |
| example | TEXT | 예문 |
| example_meaning | TEXT | 예문 해석 |
| level | TEXT | JLPT 레벨 |
| similar_patterns | TEXT | 유사 문법 |
| usage_notes | TEXT | 사용 주의사항 |

---

---

## 스크립트

### npm run split
vocabulary.json을 words.json과 sentences.json으로 분리합니다.

```bash
npm run split
```

### npm run archive
마스터된 항목(reps ≥ 5, interval ≥ 30)을 JLPT 레벨별 파일로 아카이브합니다.

```bash
# Supabase에서 SRS 데이터 가져와서 아카이브
npm run archive

# 또는 로컬 파일 사용
# 1. 브라우저에서: localStorage.getItem('jflash_srs_state')
# 2. scripts/srs-state.json에 저장
# 3. npm run archive
```

### npm run sync:supabase
JSON 파일을 Supabase vocabulary 테이블에 동기화합니다.

```bash
npm run sync:supabase
```

**GitHub Actions 자동 동기화**:
- `frontend/public/data/**` 파일이 main에 push되면 자동 실행
- GitHub Secrets 필요: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`

---

## 데이터 파일 구조

```
frontend/public/data/
├── words.json          # 학습 중인 단어 (pos ≠ 文)
├── sentences.json      # 학습 중인 문장 (pos = 文)
└── mastered/           # 마스터된 항목 (JLPT 레벨별)
    ├── N5.json
    ├── N4.json
    ├── N3.json
    ├── N2.json
    ├── N1.json
    └── unknown.json
```

---

## Supabase 테이블

### vocabulary
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | INTEGER | PK |
| kanji | TEXT | 단어/문장 |
| reading | TEXT | 읽기 |
| meaning | TEXT | 의미 |
| pos | TEXT | 품사 |
| jlpt_level | TEXT | JLPT 레벨 |
| example_sentence | TEXT | 예문 |
| example_meaning | TEXT | 예문 해석 |
| notes | TEXT | 추가 설명 |
| status | TEXT | active / mastered |

### srs_records
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | SERIAL | PK |
| device_id | UUID | 기기 식별자 |
| vocab_id | INTEGER | 단어 ID |
| interval | INTEGER | 복습 간격 (일) |
| ease_factor | REAL | 난이도 계수 |
| next_review | TIMESTAMP | 다음 복습일 |
| reps | INTEGER | 정답 횟수 |

---

## 버전 정보

- **앱 버전**: 2.0.0
- **데이터**: Static JSON + Supabase 동기화
- **복습 모드**: 5종 (기본, 역방향, 듣기, 빈칸, 타이핑)
