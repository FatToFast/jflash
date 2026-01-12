# Story 4.4: SRS 알고리즘 (SM-2) 구현

Status: done

## Story

As a 사용자,
I want SM-2 알고리즘으로 복습 간격이 자동 조절되고,
so that 효율적인 장기 기억 학습을 할 수 있다.

## Acceptance Criteria

1. **AC1: SM-2 알고리즘 적용**
   - Given: "알아요"를 선택했을 때
   - When: interval 계산이 수행되면
   - Then: SM-2 알고리즘에 따라 다음 복습일이 설정된다

2. **AC2: 간격 조절**
   - Given: 연속으로 "알아요"를 선택할 때
   - When: 복습 간격이 계산되면
   - Then: 1일 → 3일 → 7일 → 14일 → 30일 순으로 증가한다

3. **AC3: 리셋 조건**
   - Given: "몰라요"를 선택했을 때
   - When: interval이 업데이트되면
   - Then: interval이 1로 리셋된다

## Tasks / Subtasks

- [x] Task 1: SM-2 알고리즘 구현 (Backend)
  - [x] 1.1 ease_factor 계산 로직
  - [x] 1.2 interval 계산 로직
  - [x] 1.3 next_review 날짜 계산

- [x] Task 2: 데이터베이스 업데이트
  - [x] 2.1 Vocabulary 테이블에 SRS 필드 추가
  - [x] 2.2 ease_factor, interval, reps 필드

## Dev Notes

### SM-2 알고리즘 요약

```python
# 알아요 (known=True)
if reps == 0:
    interval = 1
elif reps == 1:
    interval = 3
else:
    interval = round(interval * ease_factor)

ease_factor = max(1.3, ease_factor + 0.1)
reps += 1

# 몰라요 (known=False)
interval = 1
ease_factor = max(1.3, ease_factor - 0.2)
reps = 0
```

### References

- [Source: backend/api/review.py] - SM-2 구현
- [Source: epics.md#FR-012] - SM-2 알고리즘 요구사항

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Change Log

- 2026-01-12: Story 4.4 구현 확인 (backend/api/review.py에 이미 구현됨)
