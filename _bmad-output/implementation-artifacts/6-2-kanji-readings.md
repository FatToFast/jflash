# Story 6.2: 음독/훈독 표시

Status: done

## Story

As a 사용자,
I want 한자의 음독과 훈독을 확인하고,
so that 정확한 발음을 학습할 수 있다.

## Acceptance Criteria

1. **AC1: 음독 표시**
   - Given: 한자를 선택했을 때
   - When: 상세 정보가 표시되면
   - Then: 음독(オン)이 카타카나로 표시된다

2. **AC2: 훈독 표시**
   - Given: 한자를 선택했을 때
   - When: 상세 정보가 표시되면
   - Then: 훈독(くん)이 히라가나로 표시된다

3. **AC3: 색상 구분**
   - Given: 음독과 훈독이 표시될 때
   - When: UI를 보면
   - Then: 음독은 빨간색 배경, 훈독은 파란색 배경으로 구분된다

## Tasks / Subtasks

- [x] Task 1: 읽기 데이터 구조
  - [x] 1.1 on_readings 필드 (음독 - 카타카나)
  - [x] 1.2 kun_readings 필드 (훈독 - 히라가나)
  - [x] 1.3 내장 사전에 읽기 정보 포함

- [x] Task 2: 읽기 표시 UI
  - [x] 2.1 음독 영역 (빨간색)
  - [x] 2.2 훈독 영역 (파란색)
  - [x] 2.3 배지 형태로 개별 읽기 표시

## Dev Notes

### 음독/훈독 UI 색상

```typescript
// 음독 (オン) - Chinese reading
<div className="bg-red-50 rounded-lg p-4">
  <h3 className="text-sm font-medium text-red-700">음독 (オン)</h3>
  // ...
</div>

// 훈독 (くん) - Japanese reading
<div className="bg-blue-50 rounded-lg p-4">
  <h3 className="text-sm font-medium text-blue-700">훈독 (くん)</h3>
  // ...
</div>
```

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Change Log

- 2026-01-12: Story 6.2 구현 완료 (kanji/page.tsx에 통합)
