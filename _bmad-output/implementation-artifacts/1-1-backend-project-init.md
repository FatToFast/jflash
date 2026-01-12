# Story 1.1: Backend 프로젝트 초기화

Status: done

## Story

As a 개발자,
I want FastAPI 백엔드 프로젝트 구조를 설정하고,
so that API 개발을 시작할 수 있다.

## Acceptance Criteria

1. **AC1: FastAPI 앱 실행**
   - Given: 빈 backend 디렉토리가 있을 때
   - When: 프로젝트를 초기화하면
   - Then: FastAPI 앱이 실행되고 `/health` 엔드포인트가 200 OK를 반환한다

2. **AC2: SQLAlchemy 설정**
   - Given: FastAPI 앱이 실행 중일 때
   - When: 데이터베이스 연결을 테스트하면
   - Then: SQLAlchemy 설정이 완료되고 SQLite DB 연결이 확인된다

3. **AC3: CORS 설정**
   - Given: FastAPI 앱이 실행 중일 때
   - When: localhost:3000에서 API를 호출하면
   - Then: CORS 설정이 localhost:3000을 허용한다

## Tasks / Subtasks

- [x] Task 1: 프로젝트 디렉토리 구조 생성 (AC: 1)
  - [x] 1.1 `backend/` 디렉토리 생성
  - [x] 1.2 `backend/api/` 디렉토리 생성
  - [x] 1.3 `backend/models/` 디렉토리 생성
  - [x] 1.4 `backend/services/` 디렉토리 생성
  - [x] 1.5 `backend/uploads/` 디렉토리 생성
  - [x] 1.6 `data/` 디렉토리 생성

- [x] Task 2: Python 의존성 설정 (AC: 1, 2)
  - [x] 2.1 `pyproject.toml` 생성 (Python 3.10+ 명시)
  - [x] 2.2 `requirements.txt` 생성
  - [x] 2.3 가상환경 생성 및 의존성 설치

- [x] Task 3: FastAPI 앱 생성 (AC: 1, 3)
  - [x] 3.1 `main.py` 생성 (FastAPI 앱 인스턴스)
  - [x] 3.2 CORS 미들웨어 설정 (localhost:3000 허용)
  - [x] 3.3 `/health` 엔드포인트 구현
  - [x] 3.4 `/` 루트 엔드포인트 구현 (API 정보)

- [x] Task 4: SQLAlchemy 설정 (AC: 2)
  - [x] 4.1 `database.py` 생성 (엔진, 세션 설정)
  - [x] 4.2 `models/__init__.py` 생성 (Base 클래스)
  - [x] 4.3 SQLite 연결 문자열 설정 (`data/japanese_learning.db`)

- [x] Task 5: 검증 및 테스트 (AC: 1, 2, 3)
  - [x] 5.1 `uvicorn main:app --reload --port 8000` 실행
  - [x] 5.2 `/health` 엔드포인트 응답 확인
  - [x] 5.3 `/docs` Swagger UI 접근 확인
  - [x] 5.4 CORS 헤더 확인 (curl 또는 브라우저)

## Dev Notes

### 기술 스택 및 버전

| 패키지 | 버전 | 용도 |
|--------|------|------|
| Python | 3.10+ (권장 3.11) | 런타임 |
| FastAPI | 0.115+ (최신 0.128) | 웹 프레임워크 |
| Uvicorn | 0.27+ | ASGI 서버 |
| SQLAlchemy | 2.0+ | ORM |
| Pydantic | 2.5+ | 데이터 검증 |

**참고**: FastAPI 최신 버전은 Python 3.8 지원을 중단함. Python 3.10+ 필수.

### 아키텍처 가이드라인

1. **동기 모드 사용**: SQLite는 파일 기반이므로 동기 SQLAlchemy 사용 권장
   - `aiosqlite`는 실제 비동기가 아닌 백그라운드 스레드 사용
   - 단일 사용자 로컬 앱이므로 동기 모드로 충분

2. **디렉토리 구조**:
   ```
   backend/
   ├── main.py           # FastAPI 앱 엔트리포인트
   ├── database.py       # SQLAlchemy 설정
   ├── api/              # API 라우터들
   ├── models/           # SQLAlchemy 모델
   ├── services/         # 비즈니스 로직
   └── uploads/          # 업로드 이미지 저장
   ```

3. **CORS 설정**:
   - 개발 환경: `localhost:3000` (Next.js 개발 서버)
   - 모바일 테스트: `0.0.0.0:3000` (같은 네트워크)

### 핵심 코드 패턴

#### main.py 기본 구조
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="J-Flash API",
    description="일본어 플래시카드 학습 API",
    version="0.1.0"
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    return {"status": "ok"}

@app.get("/")
async def root():
    return {
        "name": "J-Flash API",
        "version": "0.1.0",
        "docs": "/docs"
    }
```

#### database.py 기본 구조
```python
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

DATABASE_URL = "sqlite:///./data/japanese_learning.db"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}  # SQLite 전용
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class Base(DeclarativeBase):
    pass

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

### requirements.txt 권장 내용
```
fastapi>=0.115.0
uvicorn[standard]>=0.27.0
sqlalchemy>=2.0.25
pydantic>=2.5.3
python-multipart>=0.0.9
```

### Project Structure Notes

- **경로 규칙**: `backend/` 디렉토리 내에서 상대 경로 사용
- **DB 위치**: `data/japanese_learning.db` (프로젝트 루트 기준)
- **업로드 경로**: `backend/uploads/` (이미지 저장용)

### 검증 명령어

```bash
# 서버 실행
cd backend
uvicorn main:app --reload --port 8000

# Health Check 테스트
curl http://localhost:8000/health
# 예상 출력: {"status":"ok"}

# CORS 테스트
curl -I -X OPTIONS http://localhost:8000/health \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: GET"
# Access-Control-Allow-Origin: http://localhost:3000 확인
```

### References

- [Source: ARCHITECTURE.md#2. 기술 스택] - FastAPI 0.109+, SQLAlchemy 2.0+
- [Source: ARCHITECTURE.md#4. 디렉토리 구조] - 프로젝트 구조 정의
- [Source: ARCHITECTURE.md#5.1 기본 엔드포인트] - /health, / 엔드포인트 스펙
- [Source: epics.md#Story 1.1] - Acceptance Criteria 정의
- [Source: FastAPI Release Notes](https://fastapi.tiangolo.com/release-notes/) - 최신 버전 정보
- [Source: SQLAlchemy 2.0 Documentation](https://docs.sqlalchemy.org/en/20/dialects/sqlite.html) - SQLite 설정

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- 가상환경 생성 필요 확인 (FastAPI 모듈 없음 오류)
- `.venv` 생성 및 의존성 설치로 해결

### Completion Notes List

- 프로젝트 구조가 이미 이전에 구축되어 있었음
- 가상환경(.venv) 생성 및 기본 의존성 설치 완료
- 모든 Acceptance Criteria 검증 완료:
  - AC1: `/health` 엔드포인트 200 OK 반환 확인
  - AC2: SQLAlchemy + SQLite 연결 설정 확인 (database.py)
  - AC3: CORS `http://localhost:3000` 허용 확인

### File List

**기존 파일 (이미 존재)**:
- `backend/main.py` - FastAPI 앱 엔트리포인트
- `backend/database.py` - SQLAlchemy 설정
- `backend/requirements.txt` - Python 의존성
- `backend/pyproject.toml` - 프로젝트 설정
- `backend/api/` - API 라우터 디렉토리
- `backend/models/` - SQLAlchemy 모델 디렉토리
- `backend/services/` - 비즈니스 로직 디렉토리
- `backend/uploads/` - 업로드 이미지 저장 디렉토리
- `data/japanese_learning.db` - SQLite 데이터베이스

**새로 생성**:
- `backend/.venv/` - Python 가상환경

### Change Log

- 2026-01-11: Story 1.1 구현 완료 - Backend 프로젝트 초기화 및 검증
- 2026-01-11: Code Review 수정 - 스토리 범위 초과 코드 정리 (H1, H2 해결)
  - main.py: API 라우터 import 주석 처리 (Epic 2-4에서 활성화 예정)
  - models/__init__.py: 모델 import 주석 처리 (Story 1.3에서 활성화 예정)
