# Story 6.1: 한자 정보 자동 추출

Status: done

## Story

As a 사용자,
I want 단어에 포함된 한자 정보를 자동으로 추출하고,
so that 각 한자의 상세 정보를 학습할 수 있다.

## Acceptance Criteria

1. **AC1: 한자 추출**
   - Given: 일본어 텍스트가 있을 때
   - When: 한자 분석을 실행하면
   - Then: 텍스트에서 한자만 추출되어 목록으로 표시된다

2. **AC2: 한자 판별**
   - Given: 텍스트에 한자, 히라가나, 가타카나가 섞여 있을 때
   - When: 분석을 실행하면
   - Then: CJK Unified Ideographs 범위의 문자만 한자로 인식된다

3. **AC3: 중복 제거**
   - Given: 같은 한자가 여러 번 나올 때
   - When: 추출 결과가 표시되면
   - Then: 중복 없이 한 번씩만 표시된다

## Tasks / Subtasks

- [x] Task 1: Kanji 모델 및 서비스 (Backend)
  - [x] 1.1 Kanji SQLAlchemy 모델
  - [x] 1.2 kanji_service.py - 한자 추출 로직
  - [x] 1.3 내장 한자 사전 (N5-N4 레벨)

- [x] Task 2: Kanji API 엔드포인트
  - [x] 2.1 POST /api/kanji/analyze - 텍스트 분석
  - [x] 2.2 GET /api/kanji/word/{word} - 단어 분석
  - [x] 2.3 GET /api/kanji/info/{character} - 단일 한자

- [x] Task 3: Frontend 한자 페이지
  - [x] 3.1 한자 입력 및 분석 UI
  - [x] 3.2 추출된 한자 목록 표시
  - [x] 3.3 API 연동

## Dev Notes

### 한자 Unicode 범위

```python
def is_kanji(char: str) -> bool:
    code = ord(char)
    # CJK Unified Ideographs
    if 0x4E00 <= code <= 0x9FFF:
        return True
    # CJK Unified Ideographs Extension A
    if 0x3400 <= code <= 0x4DBF:
        return True
    return False
```

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Change Log

- 2026-01-12: Story 6.1 구현 완료
  - Backend: models/kanji.py, services/kanji_service.py, api/kanji.py 생성
  - Frontend: kanji/page.tsx 생성, api.ts 업데이트
