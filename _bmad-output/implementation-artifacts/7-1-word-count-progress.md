# Story 7.1: 전체 단어 수/진행도

Status: done

## Story

As a 사용자,
I want 전체 단어 수와 학습 진행도를 확인하고,
so that 내 학습 현황을 한눈에 파악할 수 있다.

## Acceptance Criteria

1. **AC1: 전체 단어 수 표시**
   - Given: 대시보드에 접속했을 때
   - When: 통계 페이지가 로드되면
   - Then: 전체 단어 수가 표시된다

2. **AC2: 학습 상태별 분류**
   - Given: 대시보드에 접속했을 때
   - When: 통계가 표시되면
   - Then: 새 단어, 학습 중, 마스터 단어 수가 각각 표시된다

3. **AC3: 학습 진행률**
   - Given: 대시보드에 접속했을 때
   - When: 통계가 표시되면
   - Then: 학습 진행률이 백분율(%)로 표시된다

4. **AC4: 오늘 복습 예정**
   - Given: 대시보드에 접속했을 때
   - When: 통계가 표시되면
   - Then: 오늘 복습해야 할 단어 수가 표시된다

## Tasks / Subtasks

- [x] Task 1: 통계 데이터 모델
  - [x] 1.1 StudyLog 모델 생성
  - [x] 1.2 OverviewStats 응답 모델

- [x] Task 2: 통계 API
  - [x] 2.1 GET /api/stats/overview 엔드포인트
  - [x] 2.2 총 단어 수 쿼리
  - [x] 2.3 학습 상태별 집계

- [x] Task 3: Frontend 구현
  - [x] 3.1 통계 카드 컴포넌트
  - [x] 3.2 진행률 바 컴포넌트
  - [x] 3.3 API 연동

## Dev Notes

### OverviewStats 구조

```typescript
interface OverviewStats {
  total_words: number;      // 전체 단어 수
  learned_words: number;    // reps > 0
  mastered_words: number;   // reps >= 5
  new_words: number;        // reps == 0
  due_today: number;        // 오늘 복습 예정
  total_grammar: number;    // 문법 항목 수
  learning_progress: number; // 백분율
}
```

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Change Log

- 2026-01-12: Story 7.1 구현 완료
  - Backend: models/study_log.py, api/stats.py 생성
  - Frontend: stats/page.tsx 생성
