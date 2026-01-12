# Story 7.3: 정답률 그래프

Status: done

## Story

As a 사용자,
I want 정답률 추이를 그래프로 확인하고,
so that 학습 성과가 향상되고 있는지 파악할 수 있다.

## Acceptance Criteria

1. **AC1: 14일 정답률 추이**
   - Given: 대시보드에 접속했을 때
   - When: 정답률 그래프가 표시되면
   - Then: 최근 14일간의 정답률이 막대 그래프로 표시된다

2. **AC2: 색상 구분**
   - Given: 그래프가 표시될 때
   - When: 막대를 보면
   - Then: 정답률에 따라 색상이 다르게 표시된다 (녹색/노란색/빨간색)

3. **AC3: 호버 정보**
   - Given: 그래프가 표시될 때
   - When: 막대에 마우스를 올리면
   - Then: 해당 날짜의 정답률과 복습 횟수가 툴팁으로 표시된다

4. **AC4: 학습 스트릭**
   - Given: 대시보드에 접속했을 때
   - When: 스트릭 정보가 표시되면
   - Then: 현재 연속 학습일과 최장 기록이 표시된다

## Tasks / Subtasks

- [x] Task 1: 정답률 추이 API
  - [x] 1.1 GET /api/stats/accuracy 엔드포인트
  - [x] 1.2 AccuracyData 응답 모델
  - [x] 1.3 날짜별 집계 로직

- [x] Task 2: 스트릭 API
  - [x] 2.1 GET /api/stats/streak 엔드포인트
  - [x] 2.2 연속 학습일 계산 로직
  - [x] 2.3 최장 기록 계산 로직

- [x] Task 3: Frontend 구현
  - [x] 3.1 막대 그래프 컴포넌트 (CSS 기반)
  - [x] 3.2 툴팁 표시
  - [x] 3.3 스트릭 카드 컴포넌트
  - [x] 3.4 API 연동

## Dev Notes

### AccuracyData 구조

```typescript
interface AccuracyData {
  dates: string[];      // ["01/01", "01/02", ...]
  accuracy: number[];   // [85.0, 90.5, ...]
  total_reviews: number[]; // [10, 15, ...]
}
```

### StreakInfo 구조

```typescript
interface StreakInfo {
  current_streak: number;   // 현재 연속 학습일
  longest_streak: number;   // 최장 연속 학습일
  last_study_date: string | null; // 마지막 학습일
}
```

### 그래프 색상 규칙

```typescript
const getBarColor = (accuracy: number, reviews: number) => {
  if (reviews === 0) return "#e5e7eb"; // gray
  if (accuracy >= 80) return "#22c55e"; // green
  if (accuracy >= 50) return "#eab308"; // yellow
  return "#ef4444"; // red
};
```

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Change Log

- 2026-01-12: Story 7.3 구현 완료
  - Backend: api/stats.py에 accuracy, streak 엔드포인트 추가
  - Frontend: stats/page.tsx에 그래프 및 스트릭 섹션 추가
