# Story 4.5: TTS 발음 재생

Status: done

## Story

As a 사용자,
I want 단어의 일본어 발음을 들을 수 있고,
so that 정확한 발음을 학습할 수 있다.

## Acceptance Criteria

1. **AC1: TTS 버튼**
   - Given: 카드가 표시되어 있을 때
   - When: 발음 버튼(🔊)을 클릭하면
   - Then: 일본어 발음이 재생된다

2. **AC2: 키보드 단축키**
   - Given: 카드가 표시되어 있을 때
   - When: P키를 누르면
   - Then: 발음이 재생된다 (NFR-005)

3. **AC3: 읽기 우선 재생**
   - Given: 읽기(히라가나)가 있는 단어일 때
   - When: 발음 재생 시
   - Then: 읽기가 먼저 재생되고, 없으면 한자가 재생된다

## Tasks / Subtasks

- [x] Task 1: Web Speech API 통합
  - [x] 1.1 SpeechSynthesis API 사용
  - [x] 1.2 일본어 음성 (ja-JP) 설정
  - [x] 1.3 음성 속도 조절 (0.8)

- [x] Task 2: TTS UI
  - [x] 2.1 발음 버튼 (🔊 아이콘)
  - [x] 2.2 키보드 단축키 (P키)
  - [x] 2.3 뒷면에서도 재생 가능

## Dev Notes

### Web Speech API 구현

```typescript
const speakWord = () => {
  if (!currentCard) return;

  const textToSpeak = currentCard.reading || currentCard.kanji;
  const utterance = new SpeechSynthesisUtterance(textToSpeak);
  utterance.lang = "ja-JP";
  utterance.rate = 0.8;  // 약간 느리게

  window.speechSynthesis.speak(utterance);
};
```

### 키보드 단축키

- P키: 발음 재생 (Play pronunciation)
- 앞면/뒷면 모두에서 작동

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Change Log

- 2026-01-12: Story 4.5 구현 완료 (review/page.tsx에 Web Speech API 통합)
