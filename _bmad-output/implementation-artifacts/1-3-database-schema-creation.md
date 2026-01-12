# Story 1.3: 데이터베이스 스키마 생성

Status: done

## Story

As a 개발자,
I want SQLite 데이터베이스와 핵심 테이블을 생성하고,
so that 단어와 복습 데이터를 저장할 수 있다.

## Acceptance Criteria

1. **AC1: 테이블 생성**
   - Given: SQLite DB 파일이 생성될 위치가 있을 때
   - When: 스키마를 적용하면
   - Then: Vocabulary, SRS_Review 테이블이 생성된다

2. **AC2: 외래키 관계**
   - Given: 테이블이 생성되었을 때
   - When: 관계를 확인하면
   - Then: SRS_Review.vocab_id → Vocabulary.id 외래키가 설정된다
   - And: CASCADE DELETE가 적용된다

3. **AC3: SQLAlchemy 모델 매핑**
   - Given: 모델 클래스가 정의되었을 때
   - When: 데이터베이스와 연결하면
   - Then: Vocabulary, SRSReview 모델이 테이블과 매핑된다

## Tasks / Subtasks

- [x] Task 1: 모델 활성화 (AC: 3)
  - [x] 1.1 `models/__init__.py`에서 모델 import 활성화
  - [x] 1.2 `models/vocabulary.py` 확인

- [x] Task 2: 테이블 생성 스크립트 (AC: 1)
  - [x] 2.1 `init_db.py` 스크립트 생성
  - [x] 2.2 `Base.metadata.create_all()` 실행
  - [x] 2.3 `data/` 디렉토리 자동 생성

- [x] Task 3: 스키마 검증 (AC: 1, 2)
  - [x] 3.1 SQLite DB 파일 생성 확인
  - [x] 3.2 테이블 구조 확인 (Vocabulary, SRS_Review)
  - [x] 3.3 외래키 관계 확인

- [x] Task 4: 통합 테스트 (AC: 1, 2, 3)
  - [x] 4.1 단어 추가 테스트
  - [x] 4.2 SRS Review 자동 생성 테스트
  - [x] 4.3 CASCADE DELETE 테스트

## Dev Notes

### 데이터베이스 스키마

```
┌─────────────────────┐       ┌─────────────────────┐
│     Vocabulary      │       │     SRS_Review      │
├─────────────────────┤       ├─────────────────────┤
│ id (PK)             │◄──────│ vocab_id (FK)       │
│ kanji (NOT NULL)    │       │ id (PK)             │
│ reading             │       │ interval            │
│ meaning             │       │ ease_factor         │
│ pos                 │       │ next_review         │
│ source_img          │       │ reps                │
│ created_at          │       └─────────────────────┘
└─────────────────────┘
```

### Vocabulary 테이블

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | INTEGER (PK) | 자동 증가 |
| kanji | TEXT (NOT NULL) | 한자/단어 |
| reading | TEXT | 읽기 (후리가나) |
| meaning | TEXT | 뜻 |
| pos | TEXT | 품사 |
| source_img | TEXT | 원본 이미지 경로 |
| created_at | DATETIME | 생성일시 |

### SRS_Review 테이블

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | INTEGER (PK) | 자동 증가 |
| vocab_id | INTEGER (FK) | Vocabulary.id 참조 |
| interval | INTEGER | 복습 간격 (일) |
| ease_factor | FLOAT | 난이도 계수 (기본 2.5) |
| next_review | DATETIME | 다음 복습일 |
| reps | INTEGER | 복습 횟수 |

### 기존 파일 현황

**이미 존재하는 파일**:
- `backend/database.py` - SQLAlchemy 엔진, 세션 설정
- `backend/models/vocabulary.py` - Vocabulary, SRSReview 모델
- `backend/models/__init__.py` - 모델 import (현재 비활성화 상태)

### 필요한 작업

1. `models/__init__.py` 수정하여 모델 활성화
2. DB 초기화 스크립트 생성/실행
3. 테이블 생성 검증

### 테이블 생성 스크립트 예시

```python
# init_db.py
from database import Base, engine
from models.vocabulary import Vocabulary, SRSReview

def init_database():
    """Create all database tables."""
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully!")

if __name__ == "__main__":
    init_database()
```

### 검증 명령어

```bash
# 가상환경 활성화
cd backend
source ../.venv/bin/activate

# DB 초기화 실행
python init_db.py

# SQLite로 테이블 확인
sqlite3 ../data/japanese_learning.db ".schema"

# 테이블 목록 확인
sqlite3 ../data/japanese_learning.db ".tables"
```

### References

- [Source: epics.md#Story 1.3] - Acceptance Criteria 정의
- [Source: epics.md#AR-005] - 데이터베이스 (SQLite + SQLAlchemy ORM)
- [SQLAlchemy 2.0 Documentation](https://docs.sqlalchemy.org/en/20/)

## Dev Agent Record

### Agent Model Used

(To be filled after implementation)

### Debug Log References

(To be filled during implementation)

### Completion Notes List

(To be filled after implementation)

### File List

**기존 파일**:
- `backend/database.py` - SQLAlchemy 설정
- `backend/models/vocabulary.py` - Vocabulary, SRSReview 모델

**수정 예정**:
- `backend/models/__init__.py` - 모델 import 활성화

**생성 예정**:
- `backend/init_db.py` - DB 초기화 스크립트
- `data/japanese_learning.db` - SQLite 데이터베이스 파일

### Change Log

- 2026-01-11: Story 1.3 구현 완료
  - `models/__init__.py` 수정 - Vocabulary, SRSReview 모델 import 활성화
  - `init_db.py` 생성 - DB 초기화 스크립트
  - DB 테이블 생성 검증 (Vocabulary, SRS_Review)
  - 통합 테스트 통과: CRUD, Relationship, CASCADE DELETE, Foreign Key Constraint
