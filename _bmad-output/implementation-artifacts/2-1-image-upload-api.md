# Story 2.1: 이미지 업로드 API

Status: done

## Story

As a 사용자,
I want 교재 이미지를 드래그 앤 드롭 또는 파일 선택으로 업로드하고,
so that OCR 처리를 위한 이미지를 서버에 전송할 수 있다.

## Acceptance Criteria

1. **AC1: 파일 업로드 기능**
   - Given: 이미지 업로드 페이지가 열려 있을 때
   - When: JPG 또는 PNG 이미지를 드래그 앤 드롭하면
   - Then: 이미지가 서버에 업로드되고 업로드 완료 메시지가 표시된다
   - And: 업로드된 이미지 경로가 반환된다

2. **AC2: 파일 크기 제한**
   - Given: 업로드할 이미지가 있을 때
   - When: 10MB 이상의 파일을 업로드하면
   - Then: 에러 메시지와 함께 업로드가 거부된다

3. **AC3: 파일 형식 검증**
   - Given: 업로드할 파일이 있을 때
   - When: JPG/PNG가 아닌 파일을 업로드하면
   - Then: 지원하지 않는 형식 에러 메시지가 표시된다

4. **AC4: 프론트엔드 UI**
   - Given: 업로드 페이지가 열려 있을 때
   - When: 드래그 앤 드롭 영역에 파일을 끌어오면
   - Then: 드롭 영역이 시각적으로 하이라이트된다
   - And: 파일 선택 버튼으로도 업로드가 가능하다

## Tasks / Subtasks

- [x] Task 1: Backend 이미지 업로드 API (AC: 1, 2, 3)
  - [x] 1.1 `api/upload.py` 라우터 생성
  - [x] 1.2 POST `/api/upload/image` 엔드포인트 구현
  - [x] 1.3 파일 크기 검증 (10MB 제한)
  - [x] 1.4 파일 형식 검증 (JPG, PNG)
  - [x] 1.5 `backend/uploads/` 디렉토리에 저장
  - [x] 1.6 고유 파일명 생성 (UUID)

- [x] Task 2: main.py 라우터 등록 (AC: 1)
  - [x] 2.1 upload 라우터 import 및 등록
  - [x] 2.2 정적 파일 서빙 설정 (`/uploads/`)

- [x] Task 3: Frontend 업로드 UI (AC: 4)
  - [x] 3.1 `app/upload/page.tsx` 구현
  - [x] 3.2 드래그 앤 드롭 영역 컴포넌트
  - [x] 3.3 파일 선택 버튼
  - [x] 3.4 업로드 진행 표시
  - [x] 3.5 성공/에러 메시지 표시

- [x] Task 4: API 클라이언트 연동 (AC: 1)
  - [x] 4.1 `lib/api.ts`에 uploadImage 함수 추가
  - [x] 4.2 FormData로 이미지 전송

- [x] Task 5: 통합 테스트 (AC: 1, 2, 3, 4)
  - [x] 5.1 JPG 업로드 테스트
  - [x] 5.2 PNG 업로드 테스트
  - [x] 5.3 대용량 파일 거부 테스트
  - [x] 5.4 잘못된 형식 거부 테스트

## Dev Notes

### API 스펙

```
POST /api/upload/image
Content-Type: multipart/form-data

Request:
  - file: 이미지 파일 (JPG, PNG)

Response (성공):
{
  "success": true,
  "filename": "abc123-uuid.jpg",
  "path": "/uploads/abc123-uuid.jpg"
}

Response (실패):
{
  "success": false,
  "error": "File too large. Maximum size is 10MB."
}
```

### 파일 저장 경로

```
backend/
└── uploads/
    ├── abc123-uuid.jpg
    ├── def456-uuid.png
    └── ...
```

### 드래그 앤 드롭 UI 구조

```tsx
// app/upload/page.tsx 기본 구조
<div className="upload-container">
  <DropZone onDrop={handleUpload} />
  <input type="file" accept="image/jpeg,image/png" onChange={handleFileSelect} />
  {uploading && <LoadingSpinner />}
  {result && <UploadResult {...result} />}
</div>
```

### 참고 사항

- FastAPI의 `UploadFile` 타입 사용
- `python-multipart` 패키지 필요 (이미 설치됨)
- 파일명에 UUID 사용하여 충돌 방지
- 업로드 후 반환된 경로는 Story 2.2 OCR 처리에 사용

### References

- [Source: epics.md#Story 2.1] - Acceptance Criteria 정의
- [Source: epics.md#FR-001] - 이미지 업로드 (드래그앤드롭/파일선택)
- [FastAPI File Upload](https://fastapi.tiangolo.com/tutorial/request-files/)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- 기존 upload.py에 OCR 코드가 포함되어 있어 Story 2.1 범위로 축소
- 기존 서버 프로세스가 port 8000을 점유하여 재시작 필요

### Completion Notes List

- Backend: POST /api/upload/image 엔드포인트 구현 완료
- 파일 검증: 10MB 크기 제한, JPG/PNG 형식만 허용
- 파일 저장: UUID 기반 고유 파일명으로 uploads/ 디렉토리에 저장
- 정적 파일 서빙: /uploads/ 경로로 업로드된 이미지 접근 가능
- Frontend: 드래그 앤 드롭 및 파일 선택 UI 구현
- 통합 테스트: 4가지 시나리오 모두 통과

### File List

**수정됨**:
- `backend/api/upload.py` - 이미지 업로드 API (OCR 코드 제거, Story 2.1 범위로 단순화)
- `backend/main.py` - upload 라우터 등록, 정적 파일 서빙 설정
- `frontend/lib/api.ts` - uploadImage 함수 및 타입 추가

**생성됨**:
- `frontend/app/upload/page.tsx` - 드래그 앤 드롭 업로드 UI
- `backend/uploads/` - 업로드 파일 저장 디렉토리 (자동 생성)

### Change Log

- 2026-01-12: Story 2.1 구현 완료
  - Backend: POST /api/upload/image 엔드포인트 (10MB 제한, JPG/PNG 검증)
  - Frontend: 드래그 앤 드롭 업로드 UI 구현
  - 통합 테스트 4건 통과 (PNG, JPG 업로드, 대용량 거부, 형식 거부)

- 2026-01-12: Code Review 수정 완료
  - **[Critical] Magic bytes 검증 추가**: 실제 파일 내용(JPEG/PNG 시그니처) 검증으로 보안 강화
  - **[Major] 에러 응답 일관성**: 모든 에러 응답에 `{success: false, error: string, code: string}` 형식 적용
  - **[Major] 이미지 미리보기 추가**: 업로드 성공 시 이미지 미리보기 표시
  - **[Major] 파일 정리 로직 추가**: 에러 발생 시 부분 저장된 파일 cleanup
  - **[Minor] Content-Type 헤더 제거**: FormData 업로드 시 axios가 boundary 자동 설정하도록 수정
  - **[Minor] 로깅 추가**: 업로드 성공/실패 시 로그 기록
  - 추가 테스트: Magic bytes 검증 테스트 통과 (가짜 이미지 거부 확인)
