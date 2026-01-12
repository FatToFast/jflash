# Story 2.3: 형태소 분석 및 단어 추출

Status: done

## Story

As a 사용자,
I want 인식된 텍스트가 단어 단위로 분리되고,
so that 개별 단어를 단어장에 추가할 수 있다.

## Acceptance Criteria

1. **AC1: 형태소 분석 실행**
   - Given: OCR로 텍스트가 인식되었을 때
   - When: 형태소 분석을 실행하면
   - Then: Fugashi(MeCab)가 텍스트를 형태소 단위로 분리한다

2. **AC2: 단어 정보 추출**
   - Given: 형태소 분석이 완료되었을 때
   - When: 결과를 확인하면
   - Then: 각 단어의 한자, 읽기(후리가나), 품사가 추출된다

3. **AC3: 불필요 요소 필터링**
   - Given: 형태소 분석 결과가 있을 때
   - When: 필터링을 적용하면
   - Then: 조사, 기호 등 불필요한 요소는 필터링된다

4. **AC4: API 응답 시간**
   - Given: 형태소 분석 API 호출 시
   - When: 분석이 완료되면
   - Then: 일반적인 문장(100자 이내)은 1초 이내에 처리된다

## Tasks / Subtasks

- [x] Task 1: Fugashi 설치 및 설정 (AC: 1)
  - [x] 1.1 `requirements.txt`에 fugashi, unidic-lite 추가 (이미 있음)
  - [x] 1.2 서비스 계층 `services/morphology_service.py` 생성
  - [x] 1.3 MeCab 사전 초기화 (unidic-lite) - lru_cache로 캐싱

- [x] Task 2: 형태소 분석 API 구현 (AC: 1, 2, 4)
  - [x] 2.1 POST `/api/morphology/analyze` 엔드포인트 생성
  - [x] 2.2 텍스트 입력 받아 Fugashi 실행
  - [x] 2.3 결과에서 surface(원형), reading(읽기), pos(품사) 추출
  - [x] 2.4 응답 스키마 정의 (WordInfoResponse, MorphologyAnalyzeResponse)

- [x] Task 3: 품사 필터링 로직 (AC: 3)
  - [x] 3.1 제외할 품사 목록 정의 (조사, 기호, 접미사 등)
  - [x] 3.2 단어 필터링 함수 구현 (is_content_word 플래그)
  - [x] 3.3 필터링 옵션 (전체 보기 / 필터링 보기) 지원

- [x] Task 4: Frontend 연동 (AC: 1, 2)
  - [x] 4.1 `lib/api.ts`에 analyzeMorphology 함수 추가
  - [x] 4.2 OCR 결과 후 자동 형태소 분석 호출 (/extract 페이지)
  - [x] 4.3 추출된 단어 목록 상태 관리

- [x] Task 5: 통합 테스트 (AC: 1, 2, 3, 4)
  - [x] 5.1 일본어 문장 형태소 분석 테스트 - "日本語を勉強しています" 성공
  - [x] 5.2 품사 필터링 동작 확인 - 8개 형태소 중 5개 단어 추출
  - [x] 5.3 처리 시간 1초 이내 확인 - 16ms (캐시 후)

## Dev Notes

### API 스펙

```
POST /api/morphology/analyze
Content-Type: application/json

Request:
{
  "text": "日本語を勉強しています",
  "filter_particles": true,
  "include_reading_hiragana": true
}

Response (성공):
{
  "success": true,
  "words": [
    {
      "surface": "日本",
      "reading": "ニッポン",
      "reading_hiragana": "にっぽん",
      "pos": "名詞",
      "pos_detail": "名詞,固有名詞",
      "base_form": "日本",
      "is_content_word": true
    },
    {
      "surface": "語",
      "reading": "ゴ",
      "reading_hiragana": "ご",
      "pos": "名詞",
      "pos_detail": "名詞,接尾辞",
      "base_form": "語",
      "is_content_word": true
    }
  ],
  "total_count": 8,
  "filtered_count": 5,
  "processing_time_ms": 16
}
```

### 품사 필터링 기준

| 품사 | 포함 여부 | 설명 |
|------|----------|------|
| 名詞 (명사) | ✅ 포함 | 학습 대상 |
| 動詞 (동사) | ✅ 포함 | 학습 대상 |
| 形容詞 (형용사) | ✅ 포함 | 학습 대상 |
| 副詞 (부사) | ✅ 포함 | 학습 대상 |
| 接続詞 (접속사) | ✅ 포함 | 학습 대상 |
| 感動詞 (감동사) | ✅ 포함 | 학습 대상 |
| 連体詞 (연체사) | ✅ 포함 | 학습 대상 |
| 助詞 (조사) | ❌ 제외 | 문법 요소 |
| 助動詞 (조동사) | ❌ 제외 | 문법 요소 |
| 記号 (기호) | ❌ 제외 | 불필요 |
| 補助記号 (보조기호) | ❌ 제외 | 불필요 |
| 接頭辞 (접두사) | ❌ 제외 | 불필요 |
| 接尾辞 (접미사) | ❌ 제외 | 불필요 |

### References

- [Source: epics.md#Story 2.3] - Acceptance Criteria 정의
- [Source: epics.md#FR-003] - 형태소 분석으로 단어 단위 분리
- [Source: epics.md#AR-004] - Fugashi (MeCab) 사용
- [Fugashi Documentation](https://github.com/polm/fugashi)
- [UniDic-Lite](https://github.com/polm/unidic-lite)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- fugashi, unidic-lite 미설치 → pip install로 해결
- 첫 호출 시 사전 로딩 시간 (~448ms) → lru_cache로 캐싱

### Completion Notes List

- Backend: POST /api/morphology/analyze 엔드포인트 구현 완료
- 형태소 분석 서비스: Fugashi Tagger 캐싱, 품사 필터링 로직
- 카타카나→히라가나 변환 함수 포함
- 앱 시작 시 Fugashi tagger 미리 로드 (cold-start 방지)
- Frontend: /extract 페이지 생성, OCR 결과 연동, 형태소 분석 결과 표시
- UI: 품사별 컬러 배지, 필터 토글, 통계 표시

### File List

**수정됨**:
- `backend/main.py` - morphology 라우터 등록, Fugashi preload 추가
- `frontend/lib/api.ts` - WordInfo, MorphologyAnalyzeResponse 타입 및 analyzeMorphology 함수 추가

**생성됨**:
- `backend/api/morphology.py` - 형태소 분석 API 라우터
- `backend/services/morphology_service.py` - 형태소 분석 서비스
- `frontend/app/extract/page.tsx` - 단어 추출 페이지

### Change Log

- 2026-01-12: Story 2.3 파일 생성 (ready-for-dev)
- 2026-01-12: Story 2.3 구현 완료
  - Backend: Fugashi 형태소 분석 API 구현
  - 품사 필터링: 조사, 기호 등 자동 제외
  - 히라가나 변환: 카타카나 읽기를 히라가나로 변환
  - Frontend: /extract 페이지에서 OCR 결과 연동 및 분석 결과 표시
  - 테스트: "日本語を勉強しています" → 5개 단어 추출 (16ms)
