# Story 4.1: 오늘의 복습 카드 조회

Status: done

## Story

As a 사용자,
I want 오늘 복습해야 할 카드 목록을 확인하고,
so that 매일 적절한 양의 단어를 복습할 수 있다.

## Acceptance Criteria

1. **AC1: 복습 카드 조회**
   - Given: 복습 페이지에 접속했을 때
   - When: "오늘의 복습" 버튼을 클릭하면
   - Then: next_review <= 오늘인 단어들이 조회된다

2. **AC2: 복습 카드 수 표시**
   - Given: 복습할 카드가 있을 때
   - When: 페이지가 로드되면
   - Then: 복습할 카드 수가 표시된다 (예: "오늘의 복습: 15장")

3. **AC3: 빈 상태 처리**
   - Given: 복습할 카드가 없을 때
   - When: 페이지가 로드되면
   - Then: "오늘 복습할 카드가 없습니다" 메시지가 표시된다

## Tasks / Subtasks

- [ ] Task 1: 복습 API 엔드포인트 (AC: 1)
  - [ ] 1.1 GET /api/review/today - 오늘 복습할 카드 목록
  - [ ] 1.2 next_review <= now 필터링
  - [ ] 1.3 복습 카드 수 반환

- [ ] Task 2: 복습 페이지 UI (AC: 2, 3)
  - [ ] 2.1 /review 페이지 생성
  - [ ] 2.2 복습할 카드 수 표시
  - [ ] 2.3 복습 시작 버튼
  - [ ] 2.4 빈 상태 UI

## Dev Notes

### API 설계

```
GET /api/review/today

Response:
{
  "cards": [
    {
      "vocab_id": 1,
      "kanji": "日本語",
      "reading": "にほんご",
      "meaning": "일본어",
      "pos": "名詞",
      "interval": 1,
      "ease_factor": 2.5,
      "reps": 0
    }
  ],
  "total_due": 15,
  "new_count": 5,
  "review_count": 10
}
```

### References

- [Source: epics.md#Story 4.1] - Acceptance Criteria 정의
- [Source: epics.md#FR-011] - 오늘의 복습 카드 조회

## Dev Agent Record

### Agent Model Used

(작업 후 기록)

### Change Log

- 2026-01-12: Story 4.1 파일 생성 (in-progress)
