# Story 4.2: 플래시카드 앞면/뒷면 표시

Status: done

## Story

As a 사용자,
I want 카드 앞면에서 한자를 보고, 뒷면에서 읽기와 뜻을 확인하고,
so that 암기 테스트를 수행할 수 있다.

## Acceptance Criteria

1. **AC1: 앞면 표시**
   - Given: 복습 세션이 시작되었을 때
   - When: 카드가 표시되면
   - Then: 앞면에 한자(또는 단어)가 크게 표시된다

2. **AC2: 카드 뒤집기**
   - Given: 앞면이 표시되어 있을 때
   - When: 스페이스바 또는 "뒷면 보기" 버튼 클릭 시
   - Then: 뒷면이 표시된다 (NFR-005)

3. **AC3: 뒷면 표시**
   - Given: 카드가 뒤집혔을 때
   - When: 뒷면이 표시되면
   - Then: 읽기(후리가나), 뜻, 품사가 표시된다

## Tasks / Subtasks

- [x] Task 1: 플래시카드 UI 컴포넌트
  - [x] 1.1 카드 앞면 (한자 크게 표시)
  - [x] 1.2 카드 뒷면 (읽기, 뜻, 품사)
  - [x] 1.3 카드 뒤집기 애니메이션/전환

- [x] Task 2: 키보드 단축키 (NFR-005)
  - [x] 2.1 스페이스바로 카드 뒤집기
  - [x] 2.2 클릭으로도 뒤집기 가능

## Dev Notes

- 앞면: 한자만 큰 글씨로 표시
- 뒷면: 한자 + 읽기 + 의미 + 품사 표시
- Web Speech API로 TTS 발음 버튼 추가

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Change Log

- 2026-01-12: Story 4.2 구현 완료 (review/page.tsx에 통합)
