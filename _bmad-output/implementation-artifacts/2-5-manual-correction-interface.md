# Story 2.5: 단어 수동 교정 인터페이스

Status: done

## Story

As a 사용자,
I want OCR이 잘못 인식한 단어를 수동으로 수정하고,
so that 정확한 단어만 단어장에 저장할 수 있다.

## Acceptance Criteria

1. **AC1: 인라인 편집 기능**
   - Given: 추출된 단어 목록이 표시되어 있을 때
   - When: 특정 단어의 한자, 읽기, 품사 필드를 클릭하면
   - Then: 해당 필드가 편집 가능한 입력 필드로 변경된다

2. **AC2: 의미 필드 입력**
   - Given: 단어 편집 모드일 때
   - When: "의미" 필드에 값을 입력하면
   - Then: 해당 단어의 뜻(meaning)이 저장된다

3. **AC3: 선택 단어 저장**
   - Given: 단어를 편집하고 체크박스로 선택한 상태에서
   - When: "저장하기" 버튼을 클릭하면
   - Then: 선택된 단어들이 DB에 저장된다
   - And: 저장 완료 시 성공 메시지가 표시된다
   - And: 단어장 페이지로 이동한다

## Tasks / Subtasks

- [x] Task 1: 인라인 편집 컴포넌트 구현 (AC: 1)
  - [x] 1.1 클릭 시 입력 필드로 변경 (한자, 읽기, 품사)
  - [x] 1.2 입력 완료 시 (blur/enter) 값 저장
  - [x] 1.3 ESC 키로 편집 취소

- [x] Task 2: 의미 필드 추가 (AC: 2)
  - [x] 2.1 테이블에 "의미" 컬럼 추가
  - [x] 2.2 의미 인라인 편집 기능
  - [x] 2.3 빈 의미 필드 placeholder 표시

- [x] Task 3: 단어 저장 API 구현 (AC: 3)
  - [x] 3.1 POST /api/vocab/bulk 엔드포인트 (기존 구현 활용)
  - [x] 3.2 단어 데이터 스키마 정의 (VocabCreate, BulkVocabResponse)
  - [x] 3.3 Vocabulary 테이블에 저장
  - [x] 3.4 SRS_Review 레코드 자동 생성

- [x] Task 4: 저장 버튼 및 성공 처리 (AC: 3)
  - [x] 4.1 "선택한 단어 저장" 버튼 클릭 핸들러
  - [x] 4.2 저장 중 로딩 상태 표시
  - [x] 4.3 성공 시 토스트 메시지 + 페이지 이동
  - [x] 4.4 실패 시 에러 메시지 표시

## Dev Notes

### UI 레이아웃 (확장)

```
┌─────────────────────────────────────────────────────────────────────────┐
│ 단어 추출                                                                │
├─────────────────────────────────────────────────────────────────────────┤
│ [이미지 썸네일]  [원본 텍스트]                                            │
├─────────────────────────────────────────────────────────────────────────┤
│ ☑ 전체 선택 (3/5 선택됨)                                                 │
├────┬────────┬──────────┬────────┬──────────────┬───────────────────────┤
│ ☑  │ 한자   │ 읽기     │ 품사   │ 기본형       │ 의미 (새로 추가)       │
├────┼────────┼──────────┼────────┼──────────────┼───────────────────────┤
│ ☑  │ [日本] │ [にっぽん]│ [名詞] │ 日本         │ [일본____________]    │
│ ☑  │ [語]   │ [ご]     │ [名詞] │ 語           │ [말, 언어________]    │
│ ☐  │ [勉強] │ [べんきょう]│ [名詞]│ 勉強        │ [공부____________]    │
└────┴────────┴──────────┴────────┴──────────────┴───────────────────────┘
│                                                                         │
│  [다른 이미지 분석]  [✓ 선택한 단어 저장 (3)]                             │
└─────────────────────────────────────────────────────────────────────────┘
```

### 인라인 편집 동작

```tsx
// EditableCell 컴포넌트
interface EditableCellProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

// 상태: viewing | editing
// 클릭 → editing 모드
// Enter/Blur → viewing 모드 + 값 저장
// ESC → viewing 모드 + 값 롤백
```

### 단어 저장 API

```
POST /api/vocab/batch
Content-Type: application/json

Request:
{
  "words": [
    {
      "kanji": "日本",
      "reading": "にっぽん",
      "pos": "名詞",
      "meaning": "일본",
      "source_img": "/uploads/xxx.jpg"
    },
    ...
  ]
}

Response (성공):
{
  "success": true,
  "saved_count": 3,
  "words": [
    { "id": 1, "kanji": "日本", ... },
    ...
  ]
}
```

### References

- [Source: epics.md#Story 2.5] - Acceptance Criteria 정의
- [Source: epics.md#FR-005] - 수동 교정 편집 인터페이스
- Story 2.4 /extract 페이지 확장

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- Backend vocab API 및 모델이 이미 구현되어 있어 재사용
- vocab router가 main.py에 등록되지 않아 등록 추가

### Completion Notes List

- EditableCell 컴포넌트: useState로 editing 상태 관리, useRef로 input focus
- 키보드 핸들링: Enter=저장, Escape=취소, Blur=저장
- EditableWord 인터페이스: WordInfo 확장 + meaning 필드
- 저장 기능: saveWordsBulk API 호출 → 성공 메시지 → 2초 후 /vocab으로 이동
- 단어장 페이지: GET /api/vocab으로 저장된 단어 목록 표시

### File List

**수정됨**:
- `frontend/app/extract/page.tsx` - EditableCell 컴포넌트, 의미 컬럼, 저장 버튼, 성공 메시지
- `frontend/lib/api.ts` - VocabCreate, BulkVocabResponse 타입, saveWordsBulk 함수
- `backend/main.py` - vocab router 등록

**생성됨**:
- `frontend/app/vocab/page.tsx` - 단어장 목록 페이지

**기존 구현 활용**:
- `backend/api/vocab.py` - CRUD API (POST /api/vocab/bulk 포함)
- `backend/models/vocabulary.py` - Vocabulary, SRSReview 모델

### Change Log

- 2026-01-12: Story 2.5 파일 생성 (ready-for-dev)
- 2026-01-12: Story 2.5 구현 완료
  - EditableCell 컴포넌트로 인라인 편집 구현
  - 의미 필드 추가 및 편집 기능
  - 선택한 단어 일괄 저장 (POST /api/vocab/bulk)
  - 성공 메시지 및 단어장 페이지 자동 이동
  - 단어장 목록 페이지 구현
