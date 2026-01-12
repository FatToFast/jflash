# Story 6.3: 한자 획수/의미 표시

Status: done

## Story

As a 사용자,
I want 한자의 획수와 의미를 확인하고,
so that 한자를 더 깊이 이해할 수 있다.

## Acceptance Criteria

1. **AC1: 획수 표시**
   - Given: 한자를 선택했을 때
   - When: 상세 정보가 표시되면
   - Then: 획수가 "n획" 형태로 표시된다

2. **AC2: 의미 표시 (한국어)**
   - Given: 한자를 선택했을 때
   - When: 상세 정보가 표시되면
   - Then: 한국어 의미가 표시된다

3. **AC3: 의미 표시 (영어)**
   - Given: 한자를 선택했을 때
   - When: 상세 정보가 표시되면
   - Then: 영어 의미도 함께 표시된다

4. **AC4: JLPT 레벨 표시**
   - Given: 한자에 JLPT 레벨 정보가 있을 때
   - When: 상세 정보가 표시되면
   - Then: N5~N1 레벨이 배지로 표시된다

## Tasks / Subtasks

- [x] Task 1: 한자 상세 정보 데이터
  - [x] 1.1 stroke_count 필드
  - [x] 1.2 meanings 필드 (영어)
  - [x] 1.3 meanings_ko 필드 (한국어)
  - [x] 1.4 jlpt_level 필드

- [x] Task 2: 상세 정보 UI
  - [x] 2.1 획수 표시
  - [x] 2.2 의미 표시 (한/영)
  - [x] 2.3 JLPT 레벨 배지

## Dev Notes

### 내장 한자 사전 구조

```python
KANJI_DICT = {
    "日": {
        "on": ["ニチ", "ジツ"],
        "kun": ["ひ", "か"],
        "meanings": ["day", "sun", "Japan"],
        "meanings_ko": ["날", "해", "일본"],
        "strokes": 4,
        "jlpt": 5
    },
    # ...
}
```

### JLPT 레벨 색상

```typescript
const jlptColors = {
  5: "bg-green-100 text-green-800",   // N5
  4: "bg-blue-100 text-blue-800",     // N4
  3: "bg-yellow-100 text-yellow-800", // N3
  2: "bg-orange-100 text-orange-800", // N2
  1: "bg-red-100 text-red-800",       // N1
};
```

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Change Log

- 2026-01-12: Story 6.3 구현 완료 (kanji/page.tsx에 통합)
