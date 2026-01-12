# Story 5.3: 문법 난이도 레벨 설정

Status: done

## Story

As a 사용자,
I want 문법을 JLPT 레벨(N5~N1)별로 분류하고,
so that 내 수준에 맞는 문법을 학습할 수 있다.

## Acceptance Criteria

1. **AC1: 레벨 선택**
   - Given: 문법 추가/수정 폼에서
   - When: JLPT 레벨을 선택하면
   - Then: N5, N4, N3, N2, N1 중 선택할 수 있다

2. **AC2: 레벨 필터링**
   - Given: 문법 목록 페이지에서
   - When: 레벨 필터를 선택하면
   - Then: 해당 레벨의 문법만 표시된다

3. **AC3: 레벨 표시**
   - Given: 문법 목록에서
   - When: 문법 카드가 표시되면
   - Then: 레벨이 색상 배지로 표시된다

## Tasks / Subtasks

- [x] Task 1: 레벨 필터 API
  - [x] 1.1 GET /api/grammar?level=N5 쿼리 파라미터
  - [x] 1.2 GET /api/grammar/levels - JLPT 레벨 목록
  - [x] 1.3 레벨 validation (N5~N1만 허용)

- [x] Task 2: 레벨 필터 UI
  - [x] 2.1 레벨 드롭다운 필터
  - [x] 2.2 레벨 색상 배지 (N5=초록, N4=파랑, N3=노랑, N2=주황, N1=빨강)
  - [x] 2.3 폼에서 레벨 선택

## Dev Notes

### JLPT 레벨 색상 매핑

```typescript
const levelColors = {
  N5: "bg-green-100 text-green-800",   // 초급
  N4: "bg-blue-100 text-blue-800",     // 초중급
  N3: "bg-yellow-100 text-yellow-800", // 중급
  N2: "bg-orange-100 text-orange-800", // 중상급
  N1: "bg-red-100 text-red-800",       // 상급
};
```

### 레벨별 특징

- **N5**: 가장 기초적인 문법 (ます형, です형 등)
- **N4**: 기초 연결 문법 (～て, ～から 등)
- **N3**: 중급 표현 (～ようになる, ～ことがある 등)
- **N2**: 고급 표현 (～にもかかわらず 등)
- **N1**: 최고급 표현 (문어체, 고급 접속 등)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Change Log

- 2026-01-12: Story 5.3 구현 완료 (grammar/page.tsx에 통합)
