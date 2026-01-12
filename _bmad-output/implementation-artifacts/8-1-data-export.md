# Story 8.1: CSV/JSON 내보내기

Status: done

## Story

As a 사용자,
I want 단어장과 문법 데이터를 CSV/JSON 형식으로 내보내고,
so that 데이터를 백업하거나 다른 기기에서 사용할 수 있다.

## Acceptance Criteria

1. **AC1: 단어장 CSV 내보내기**
   - Given: 데이터 관리 페이지에서
   - When: "단어장 CSV 다운로드" 버튼을 클릭하면
   - Then: 단어 데이터가 CSV 파일로 다운로드된다

2. **AC2: 단어장 JSON 내보내기**
   - Given: 데이터 관리 페이지에서
   - When: "단어장 JSON 다운로드" 버튼을 클릭하면
   - Then: 단어 데이터가 JSON 파일로 다운로드된다

3. **AC3: 문법 내보내기**
   - Given: 데이터 관리 페이지에서
   - When: "문법 CSV/JSON 다운로드" 버튼을 클릭하면
   - Then: 문법 데이터가 해당 형식으로 다운로드된다

4. **AC4: 전체 백업**
   - Given: 데이터 관리 페이지에서
   - When: "전체 백업 다운로드" 버튼을 클릭하면
   - Then: 단어 + 문법 데이터가 하나의 JSON 파일로 다운로드된다

## Tasks / Subtasks

- [x] Task 1: Export API
  - [x] 1.1 GET /api/data/vocab/csv - 단어 CSV
  - [x] 1.2 GET /api/data/vocab/json - 단어 JSON
  - [x] 1.3 GET /api/data/grammar/csv - 문법 CSV
  - [x] 1.4 GET /api/data/grammar/json - 문법 JSON
  - [x] 1.5 GET /api/data/all/json - 전체 백업

- [x] Task 2: Frontend 구현
  - [x] 2.1 데이터 관리 페이지
  - [x] 2.2 내보내기 버튼 UI
  - [x] 2.3 파일 다운로드 처리

## Dev Notes

### Export 파일 형식

**CSV 헤더:**
- 단어: kanji, reading, meaning, pos, reps, interval, ease_factor, next_review, created_at
- 문법: title, meaning, description, example, example_meaning, level, created_at

**JSON 구조:**
```json
{
  "version": "1.0",
  "type": "vocabulary|grammar|full_backup",
  "exported_at": "ISO timestamp",
  "count": 123,
  "items": [...]
}
```

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Change Log

- 2026-01-12: Story 8.1 구현 완료
  - Backend: api/export_import.py 생성
  - Frontend: data/page.tsx 생성
