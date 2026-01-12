# Story 4.3: 학습 결과 입력

Status: done

## Story

As a 사용자,
I want "알아요"/"몰라요" 버튼으로 학습 결과를 입력하고,
so that 복습 결과가 기록된다.

## Acceptance Criteria

1. **AC1: 알아요/몰라요 버튼**
   - Given: 뒷면이 표시되어 있을 때
   - When: "알아요" 또는 "몰라요" 버튼을 클릭하면
   - Then: 결과가 서버에 전송된다

2. **AC2: 키보드 단축키**
   - Given: 뒷면이 표시되어 있을 때
   - When: 화살표 키를 누르면 (← 몰라요, → 알아요)
   - Then: 해당 결과가 기록된다 (NFR-005)

3. **AC3: 다음 카드로 이동**
   - Given: 결과가 제출되면
   - When: 서버 응답을 받으면
   - Then: 자동으로 다음 카드가 표시된다

## Tasks / Subtasks

- [x] Task 1: 답변 제출 API
  - [x] 1.1 POST /api/review/answer 엔드포인트
  - [x] 1.2 요청: vocab_id, known (boolean)
  - [x] 1.3 응답: next_review, new_interval

- [x] Task 2: 답변 버튼 UI
  - [x] 2.1 "알아요" 버튼 (초록색)
  - [x] 2.2 "몰라요" 버튼 (빨간색)
  - [x] 2.3 키보드 단축키 (← →)

- [x] Task 3: 상태 업데이트
  - [x] 3.1 결과 제출 후 다음 카드 이동
  - [x] 3.2 진행률 업데이트

## Dev Notes

- 알아요: known=true → 간격 증가
- 몰라요: known=false → 간격 리셋
- 키보드: ← (몰라요), → (알아요)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Change Log

- 2026-01-12: Story 4.3 구현 완료 (review/page.tsx에 통합)
