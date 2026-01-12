# Story 3.4: 원본 이미지 링크 저장

Status: done

## Story

As a 사용자,
I want 단어가 추출된 원본 이미지를 확인하고,
so that 문맥을 보며 단어를 복습할 수 있다.

## Acceptance Criteria

1. **AC1: 이미지 DB 저장**
   - Given: OCR로 추출된 단어가 저장될 때
   - When: 단어가 DB에 저장되면
   - Then: 원본 이미지가 Binary로 DB에 저장된다
   - And: 원본 파일은 uploads 디렉토리에서 삭제된다

2. **AC2: 이미지 표시**
   - Given: 단어 상세 보기에서
   - When: 원본 이미지가 있으면
   - Then: 이미지 썸네일이 표시된다
   - And: 이미지 클릭 시 원본 크기로 확대된다

## Tasks / Subtasks

- [x] Task 1: 이미지 DB 저장 (AC: 1)
  - [x] 1.1 Vocabulary 모델에 source_img_data 필드 추가 (LargeBinary/BLOB)
  - [x] 1.2 단어 저장 시 이미지 파일 읽어서 Binary 저장
  - [x] 1.3 저장 후 원본 파일 삭제

- [x] Task 2: 이미지 조회 API (AC: 2)
  - [x] 2.1 GET /api/vocab/{id}/image 엔드포인트
  - [x] 2.2 Binary 이미지 데이터 반환

- [x] Task 3: 프론트엔드 이미지 표시 (AC: 2)
  - [x] 3.1 썸네일에서 API 엔드포인트로 이미지 표시
  - [x] 3.2 클릭 시 모달로 확대

## Dev Notes

### DB 스키마 변경

```python
# SQLAlchemy 모델
source_img_data: Mapped[bytes | None] = mapped_column(LargeBinary, nullable=True)
```

### 이미지 저장 로직

```python
def read_and_delete_image(image_path: str | None) -> bytes | None:
    """Read image file, return bytes, and delete the original file."""
    if not image_path:
        return None
    filename = image_path.replace("/uploads/", "")
    file_path = UPLOADS_DIR / filename
    if not file_path.exists():
        return None
    try:
        with open(file_path, "rb") as f:
            data = f.read()
        file_path.unlink()  # Delete original file
        return data
    except Exception:
        return None
```

### 이미지 조회 API

```python
@router.get("/{vocab_id}/image")
def get_vocabulary_image(vocab_id: int, db: Session) -> Response:
    vocab = db.query(Vocabulary).filter(Vocabulary.id == vocab_id).first()
    if not vocab or not vocab.source_img_data:
        raise HTTPException(status_code=404, detail="Image not found")
    content_type = "image/png" if vocab.source_img.lower().endswith(".png") else "image/jpeg"
    return Response(content=vocab.source_img_data, media_type=content_type)
```

### References

- [Source: epics.md#Story 3.4] - Acceptance Criteria 정의
- [Source: epics.md#FR-009] - 단어별 원본 이미지 링크 저장

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Completion Notes List

- Vocabulary 모델에 source_img_data (LargeBinary) 필드 추가
- 벌크 저장 시 이미지 파일 읽어서 DB에 저장 후 원본 파일 삭제
- GET /api/vocab/{id}/image 엔드포인트로 이미지 조회
- VocabResponse에 has_image 필드 추가
- 프론트엔드에서 새 API 엔드포인트 사용하여 이미지 표시
- 이미지 클릭 시 확대 모달 표시

### File List

**수정됨**:
- `backend/models/vocabulary.py` - source_img_data 필드 추가
- `backend/api/vocab.py` - 이미지 저장/조회 로직, has_image 필드
- `frontend/lib/api.ts` - has_image 필드, getVocabImageUrl 헬퍼
- `frontend/app/vocab/page.tsx` - 이미지 썸네일 및 확대 모달

### Change Log

- 2026-01-12: Story 3.4 파일 생성 (ready-for-dev)
- 2026-01-12: Story 3.4 구현 완료 (이미지 DB 저장 + 파일 삭제 + 이미지 표시)
