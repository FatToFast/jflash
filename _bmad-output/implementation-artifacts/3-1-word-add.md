# Story 3.1: 단어 추가 기능

Status: done

## Story

As a 사용자,
I want 새로운 단어를 수동으로 추가하고,
so that OCR 없이도 원하는 단어를 단어장에 등록할 수 있다.

## Acceptance Criteria

1. **AC1: 단어 추가 UI**
   - Given: 단어장 페이지에 있을 때
   - When: "단어 추가" 버튼을 클릭하면
   - Then: 단어 입력 폼이 표시된다 (한자, 읽기, 뜻, 품사)

2. **AC2: 단어 저장**
   - Given: 단어 입력 폼이 열려있을 때
   - When: 필수 필드(한자)를 입력하고 저장하면
   - Then: 새 단어가 DB에 저장되고 단어 목록에 표시된다

3. **AC3: 필수 필드 검증**
   - Given: 단어 입력 폼이 열려있을 때
   - When: 필수 필드(한자)가 비어있으면
   - Then: 에러 메시지가 표시되고 저장이 차단된다

4. **AC4: SRS 레코드 자동 생성**
   - Given: 새 단어가 저장될 때
   - When: DB에 단어가 추가되면
   - Then: SRS_Review 레코드가 자동 생성되어 복습 일정에 포함된다

## Tasks / Subtasks

- [x] Task 1: 단어 추가 모달 컴포넌트 (AC: 1)
  - [x] 1.1 AddWordModal 컴포넌트 생성
  - [x] 1.2 폼 필드: 한자, 읽기, 의미, 품사
  - [x] 1.3 품사 선택 드롭다운 (名詞, 動詞, 形容詞 등)
  - [x] 1.4 모달 열기/닫기 상태 관리

- [x] Task 2: 폼 검증 로직 (AC: 3)
  - [x] 2.1 필수 필드(한자) 검증
  - [x] 2.2 에러 메시지 표시
  - [x] 2.3 저장 버튼 비활성화 (유효하지 않을 때)

- [x] Task 3: 단어 저장 API 호출 (AC: 2, 4)
  - [x] 3.1 POST /api/vocab 엔드포인트 활용
  - [x] 3.2 저장 성공 시 목록 갱신
  - [x] 3.3 저장 실패 시 에러 처리

- [x] Task 4: 단어장 페이지 개선 (AC: 1, 2)
  - [x] 4.1 "+ 새 단어 추가" 버튼 개선
  - [x] 4.2 모달 통합
  - [x] 4.3 저장 후 목록 자동 갱신

## Dev Notes

### UI 레이아웃

```
┌──────────────────────────────────────────────────┐
│ 단어 추가                                    [X] │
├──────────────────────────────────────────────────┤
│                                                  │
│  한자 *                                          │
│  ┌──────────────────────────────────────────┐   │
│  │ 日本語                                    │   │
│  └──────────────────────────────────────────┘   │
│                                                  │
│  읽기                                            │
│  ┌──────────────────────────────────────────┐   │
│  │ にほんご                                  │   │
│  └──────────────────────────────────────────┘   │
│                                                  │
│  의미                                            │
│  ┌──────────────────────────────────────────┐   │
│  │ 일본어                                    │   │
│  └──────────────────────────────────────────┘   │
│                                                  │
│  품사                                            │
│  ┌──────────────────────────────────────────┐   │
│  │ 名詞                               [▼]   │   │
│  └──────────────────────────────────────────┘   │
│                                                  │
│         [취소]              [저장하기]           │
│                                                  │
└──────────────────────────────────────────────────┘
```

### API 스펙

```
POST /api/vocab
Content-Type: application/json

Request:
{
  "kanji": "日本語",
  "reading": "にほんご",
  "meaning": "일본어",
  "pos": "名詞",
  "source_img": null
}

Response (성공):
{
  "id": 1,
  "kanji": "日本語",
  "reading": "にほんご",
  "meaning": "일본어",
  "pos": "名詞",
  "source_img": null,
  "created_at": "2026-01-12T...",
  "next_review": "2026-01-12T...",
  "reps": 0
}
```

### 품사 옵션

```typescript
const POS_OPTIONS = [
  { value: "名詞", label: "名詞 (명사)" },
  { value: "動詞", label: "動詞 (동사)" },
  { value: "形容詞", label: "形容詞 (형용사)" },
  { value: "副詞", label: "副詞 (부사)" },
  { value: "接続詞", label: "接続詞 (접속사)" },
  { value: "感動詞", label: "感動詞 (감동사)" },
  { value: "連体詞", label: "連体詞 (연체사)" },
];
```

### References

- [Source: epics.md#Story 3.1] - Acceptance Criteria 정의
- [Source: epics.md#FR-006] - 단어 추가 (한자, 읽기, 뜻, 품사)
- Backend API: `backend/api/vocab.py` - POST /api/vocab

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- Backend API (POST /api/vocab)가 이미 구현되어 있어 그대로 활용

### Completion Notes List

- AddWordModal 컴포넌트: 한자(필수), 읽기, 의미, 품사 입력 폼
- 품사 선택 드롭다운: 7가지 품사 옵션
- 필수 필드 검증: 한자 필드 비어있으면 저장 차단
- 저장 성공 시: 목록에 새 단어 추가, 모달 닫기
- ESC 키로 모달 닫기 지원

### File List

**수정됨**:
- `frontend/app/vocab/page.tsx` - 모달 통합, 목록 갱신 로직
- `frontend/lib/api.ts` - createWord 함수 추가

**생성됨**:
- `frontend/components/AddWordModal.tsx` - 단어 추가 모달 컴포넌트

### Change Log

- 2026-01-12: Story 3.1 파일 생성 (ready-for-dev)
- 2026-01-12: Story 3.1 구현 완료
  - AddWordModal 컴포넌트 생성
  - 폼 검증 및 에러 처리
  - 단어장 페이지에 모달 통합
