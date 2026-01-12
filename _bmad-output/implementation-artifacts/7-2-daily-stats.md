# Story 7.2: 일별 학습 통계

Status: done

## Story

As a 사용자,
I want 일별 학습 통계를 확인하고,
so that 꾸준히 학습하고 있는지 파악할 수 있다.

## Acceptance Criteria

1. **AC1: 일별 복습 횟수**
   - Given: 대시보드에 접속했을 때
   - When: 일별 통계가 표시되면
   - Then: 각 날짜별 총 복습 횟수가 표시된다

2. **AC2: 정답/오답 횟수**
   - Given: 대시보드에 접속했을 때
   - When: 일별 통계가 표시되면
   - Then: 정답과 오답 횟수가 구분되어 표시된다

3. **AC3: 일별 정답률**
   - Given: 대시보드에 접속했을 때
   - When: 일별 통계가 표시되면
   - Then: 각 날짜별 정답률이 백분율로 표시된다

4. **AC4: 최근 7일 표시**
   - Given: 대시보드에 접속했을 때
   - When: 일별 통계가 표시되면
   - Then: 최근 7일간의 데이터가 테이블로 표시된다

## Tasks / Subtasks

- [x] Task 1: 일별 통계 API
  - [x] 1.1 GET /api/stats/daily 엔드포인트
  - [x] 1.2 날짜별 집계 쿼리
  - [x] 1.3 정답률 계산 로직

- [x] Task 2: Frontend 구현
  - [x] 2.1 일별 통계 테이블 컴포넌트
  - [x] 2.2 정답률 색상 구분 (80%+: 녹색, 50-79%: 노란색, 50% 미만: 빨간색)
  - [x] 2.3 API 연동

## Dev Notes

### DailyStats 구조

```typescript
interface DailyStats {
  date: string;           // "YYYY-MM-DD"
  total_reviews: number;  // 총 복습 횟수
  correct: number;        // 정답 횟수
  incorrect: number;      // 오답 횟수
  accuracy: number;       // 정답률 (%)
  new_words_learned: number;  // 새로 학습한 단어
}
```

### 정답률 색상 규칙

- 80% 이상: 녹색 (bg-green-100)
- 50-79%: 노란색 (bg-yellow-100)
- 50% 미만: 빨간색 (bg-red-100)
- 복습 없음: 회색 (bg-gray-100)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Change Log

- 2026-01-12: Story 7.2 구현 완료 (stats/page.tsx 테이블 섹션)
