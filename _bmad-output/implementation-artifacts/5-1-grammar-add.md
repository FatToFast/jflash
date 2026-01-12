# Story 5.1: 문법 항목 추가

Status: done

## Story

As a 사용자,
I want 새로운 문법 항목을 추가하고,
so that 학습하고 싶은 문법을 관리할 수 있다.

## Acceptance Criteria

1. **AC1: 문법 추가 폼**
   - Given: 문법 페이지에 있을 때
   - When: "문법 추가" 버튼을 클릭하면
   - Then: 문법 추가 모달이 표시된다

2. **AC2: 필수 필드**
   - Given: 문법 추가 폼이 열려 있을 때
   - When: 제목 없이 저장하려고 하면
   - Then: 에러 메시지가 표시된다

3. **AC3: 문법 저장**
   - Given: 문법 정보를 입력했을 때
   - When: "추가" 버튼을 클릭하면
   - Then: 문법이 DB에 저장되고 목록에 표시된다

## Tasks / Subtasks

- [x] Task 1: Grammar 모델 생성 (Backend)
  - [x] 1.1 Grammar SQLAlchemy 모델
  - [x] 1.2 필드: title, meaning, description, example, example_meaning, level
  - [x] 1.3 init_db.py 업데이트

- [x] Task 2: Grammar API 엔드포인트
  - [x] 2.1 POST /api/grammar - 문법 생성
  - [x] 2.2 PUT /api/grammar/{id} - 문법 수정
  - [x] 2.3 DELETE /api/grammar/{id} - 문법 삭제

- [x] Task 3: Frontend 문법 추가 UI
  - [x] 3.1 문법 추가 모달
  - [x] 3.2 폼 validation
  - [x] 3.3 API 연동

## Dev Notes

### Grammar 테이블 스키마

```sql
CREATE TABLE Grammar (
  id INTEGER PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  meaning VARCHAR(500),
  description TEXT,
  example TEXT,
  example_meaning TEXT,
  level VARCHAR(10),  -- N5, N4, N3, N2, N1
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Change Log

- 2026-01-12: Story 5.1 구현 완료
  - Backend: models/grammar.py, api/grammar.py 생성
  - Frontend: grammar/page.tsx 생성, api.ts 업데이트
