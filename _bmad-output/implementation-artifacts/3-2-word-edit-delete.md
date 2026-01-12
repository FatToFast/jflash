# Story 3.2: 단어 수정 및 삭제

Status: done

## Story

As a 사용자,
I want 기존 단어 정보를 수정하거나 삭제하고,
so that 단어장을 최신 상태로 유지할 수 있다.

## Acceptance Criteria

1. **AC1: 단어 수정**
   - Given: 단어 목록에서 특정 단어를 선택했을 때
   - When: 수정 버튼을 클릭하면
   - Then: 해당 단어의 모든 필드가 편집 가능해진다
   - And: 저장 시 변경사항이 DB에 반영된다

2. **AC2: 단어 삭제**
   - Given: 단어를 삭제하려고 할 때
   - When: 삭제 버튼을 클릭하면
   - Then: 확인 다이얼로그가 표시된다
   - And: 확인 후 단어와 관련 SRS_Review가 함께 삭제된다

## Tasks / Subtasks

- [x] Task 1: 인라인 수정 기능 (AC: 1)
  - [x] 1.1 수정 버튼 클릭 시 행이 편집 모드로 변경
  - [x] 1.2 각 필드 입력 필드로 변환
  - [x] 1.3 저장/취소 버튼 표시

- [x] Task 2: 수정 API 연동 (AC: 1)
  - [x] 2.1 PUT /api/vocab/{id} 엔드포인트 활용
  - [x] 2.2 updateWord 함수 구현
  - [x] 2.3 성공 시 목록 업데이트

- [x] Task 3: 삭제 기능 (AC: 2)
  - [x] 3.1 삭제 확인 다이얼로그
  - [x] 3.2 DELETE /api/vocab/{id} 엔드포인트 활용
  - [x] 3.3 deleteWord 함수 구현
  - [x] 3.4 성공 시 목록에서 제거

## Dev Notes

### API 스펙

```
PUT /api/vocab/{id}
Content-Type: application/json

Request:
{
  "kanji": "新しい漢字",
  "reading": "あたらしいかんじ",
  "meaning": "새로운 한자",
  "pos": "名詞"
}

DELETE /api/vocab/{id}
Response: 204 No Content
```

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Completion Notes List

- 단어장 페이지에 인라인 수정 기능 통합
- 수정 버튼 클릭 시 해당 행이 편집 모드로 전환
- 저장/취소 버튼으로 편집 완료
- 삭제 확인 다이얼로그 구현
- PUT /api/vocab/{id}와 DELETE /api/vocab/{id} API 활용

### File List

**수정됨**:
- `frontend/app/vocab/page.tsx` - 인라인 수정, 삭제 확인 다이얼로그
- `frontend/lib/api.ts` - updateWord, deleteWord 함수

### Change Log

- 2026-01-12: Story 3.2 구현 완료 (Story 3.1과 함께 구현)
