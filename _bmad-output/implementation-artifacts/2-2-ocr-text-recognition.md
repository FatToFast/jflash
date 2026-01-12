# Story 2.2: OCR 텍스트 인식

Status: done

## Story

As a 사용자,
I want 업로드된 이미지에서 일본어 텍스트가 자동으로 인식되고,
so that 수동으로 텍스트를 입력할 필요 없이 단어를 추출할 수 있다.

## Acceptance Criteria

1. **AC1: OCR 처리 시작**
   - Given: 이미지가 업로드 완료되었을 때
   - When: OCR 처리를 시작하면
   - Then: EasyOCR이 일본어 텍스트를 인식하여 원본 텍스트를 반환한다

2. **AC2: 로딩 인디케이터**
   - Given: OCR 처리 중일 때
   - When: 사용자가 화면을 보면
   - Then: 처리 중 로딩 인디케이터가 표시된다

3. **AC3: 처리 시간 (NFR-001)**
   - Given: 이미지 OCR 처리 요청 시
   - When: 처리가 완료되면
   - Then: OCR 처리가 10초 이내에 완료된다

4. **AC4: 신뢰도 경고**
   - Given: OCR 처리가 완료되었을 때
   - When: 신뢰도가 낮은 결과가 있으면
   - Then: 해당 결과에 경고 표시가 된다

## Tasks / Subtasks

- [x] Task 1: EasyOCR 설치 및 설정 (AC: 1)
  - [x] 1.1 `requirements.txt`에 easyocr 추가 (이미 있음)
  - [x] 1.2 서비스 계층 `services/ocr_service.py` 개선
  - [x] 1.3 EasyOCR Reader 초기화 (일본어 모델)

- [x] Task 2: OCR 처리 API 구현 (AC: 1, 3)
  - [x] 2.1 POST `/api/ocr/process` 엔드포인트 생성
  - [x] 2.2 이미지 경로 받아서 EasyOCR 실행
  - [x] 2.3 텍스트 및 신뢰도 반환
  - [x] 2.4 타임아웃 설정 (10초)

- [x] Task 3: 신뢰도 검증 로직 (AC: 4)
  - [x] 3.1 신뢰도 임계값 설정 (0.8/0.5 기준)
  - [x] 3.2 결과에 confidence_level 필드 추가 (high/medium/low)
  - [x] 3.3 low confidence 결과에 warning 플래그

- [x] Task 4: Frontend OCR 호출 연동 (AC: 2)
  - [x] 4.1 `lib/api.ts`에 processOCR 함수 추가
  - [x] 4.2 업로드 후 자동 OCR 처리 옵션
  - [x] 4.3 로딩 인디케이터 표시

- [x] Task 5: OCR 결과 UI (AC: 1, 4)
  - [x] 5.1 OCR 결과 표시 컴포넌트 생성
  - [x] 5.2 인식된 텍스트 블록별 표시
  - [x] 5.3 신뢰도 낮은 부분 하이라이트

- [x] Task 6: 통합 테스트 (AC: 1, 2, 3, 4)
  - [x] 6.1 일본어 텍스트 이미지 OCR 테스트
  - [x] 6.2 처리 시간 10초 이내 확인 (~6초)
  - [x] 6.3 신뢰도 표시 확인

## Dev Notes

### API 스펙

```
POST /api/ocr/process
Content-Type: application/json

Request:
{
  "image_path": "/uploads/abc123.jpg"
}

Response (성공):
{
  "success": true,
  "results": [
    {
      "text": "日本語",
      "confidence": 0.999,
      "confidence_level": "high",
      "warning": false,
      "bbox": [[100, 76], [226, 76], [226, 128], [100, 128]]
    }
  ],
  "full_text": "日本語",
  "processing_time_ms": 5985
}
```

### EasyOCR 설정

```python
import easyocr

# Reader 초기화 (첫 실행 시 모델 다운로드)
reader = easyocr.Reader(['ja', 'en'], gpu=False)

# OCR 실행
results = reader.readtext(image_path)
# 반환: [(bbox, text, confidence), ...]
```

### 신뢰도 레벨 기준

| Confidence | Level | UI 표시 |
|------------|-------|---------|
| >= 0.8 | high | 녹색 배지 |
| 0.5 ~ 0.8 | medium | 노란색 배지 |
| < 0.5 | low | 빨간색 배지 + 경고 |

### 참고 사항

- EasyOCR 첫 실행 시 일본어 모델 다운로드 (~100MB)
- GPU 사용 시 처리 속도 향상 가능 (현재는 CPU 모드)
- 이미지 크기가 크면 처리 시간 증가 → 리사이징 고려
- Story 2.1에서 업로드된 이미지 경로 사용

### References

- [Source: epics.md#Story 2.2] - Acceptance Criteria 정의
- [Source: epics.md#FR-002] - OCR 일본어 텍스트 인식
- [Source: epics.md#NFR-001] - 이미지 OCR 처리 시간 10초 이내
- [Source: epics.md#AR-003] - OCR - EasyOCR 엔진 사용
- [EasyOCR Documentation](https://github.com/JaidedAI/EasyOCR)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- EasyOCR 미설치 → pip install easyocr로 해결
- 서버 재시작 필요 (모듈 import 후)

### Completion Notes List

- Backend: POST /api/ocr/process 엔드포인트 구현 완료
- OCR 서비스: EasyOCR Reader 캐싱, 신뢰도 레벨 분류
- 타임아웃: 10초 asyncio.wait_for 적용
- Frontend: 업로드 후 자동 OCR 처리, 로딩 인디케이터
- UI: OCR 결과 표시 (전체 텍스트, 개별 항목, 신뢰도 배지)
- 테스트: 일본어 "日本語" 텍스트 99.9% 신뢰도로 인식 성공

### File List

**수정됨**:
- `backend/services/ocr_service.py` - 신뢰도 레벨, OcrResult 클래스 추가
- `backend/main.py` - OCR 라우터 등록
- `frontend/lib/api.ts` - processOcr 함수 및 타입 추가
- `frontend/app/upload/page.tsx` - OCR 호출 및 결과 UI 통합

**생성됨**:
- `backend/api/ocr.py` - OCR 처리 API 라우터

### Change Log

- 2026-01-12: Story 2.2 구현 완료
  - Backend: POST /api/ocr/process 엔드포인트 (10초 타임아웃)
  - OCR 서비스: 신뢰도 레벨 분류 (high/medium/low)
  - Frontend: 업로드 후 자동 OCR, 결과 UI 표시
  - 테스트: 일본어 텍스트 인식 성공 (~6초, 99.9% 신뢰도)

- 2026-01-12: Code Review 수정 완료
  - **Critical**: asyncio.get_event_loop() → asyncio.to_thread() 변경 (deprecated API 수정)
  - **High**: Path traversal 보안 취약점 수정 (UUID filename 패턴 검증 + resolve() 체크)
  - **Medium**: 이미지 검증 로직 추가 (magic bytes 검증)
  - **Medium**: OCR 모델 앱 시작 시 미리 로드 (cold-start timeout 방지)
  - **Minor**: getConfidenceBadge switch문 default case 추가
  - **Fix**: OCR 결과 전달 메커니즘 추가 (query param으로 image path 전달)
