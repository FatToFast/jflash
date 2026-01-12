# Story 8.2: 데이터 가져오기

Status: done

## Story

As a 사용자,
I want 외부에서 만든 단어장과 문법 데이터를 가져오고,
so that 다른 기기에서 만든 데이터나 공유받은 데이터를 사용할 수 있다.

## Acceptance Criteria

1. **AC1: 단어장 CSV 가져오기**
   - Given: 데이터 관리 페이지에서
   - When: CSV 파일을 선택하면
   - Then: 단어 데이터가 DB에 추가된다

2. **AC2: 단어장 JSON 가져오기**
   - Given: 데이터 관리 페이지에서
   - When: JSON 파일을 선택하면
   - Then: 단어 데이터가 DB에 추가된다

3. **AC3: 중복 처리**
   - Given: 이미 존재하는 단어를 가져올 때
   - When: "중복 건너뛰기" 옵션이 켜져 있으면
   - Then: 중복 단어는 건너뛰고 새 단어만 추가된다

4. **AC4: 가져오기 결과**
   - Given: 가져오기가 완료되면
   - When: 결과가 표시될 때
   - Then: 추가된 수, 건너뛴 수, 오류 목록이 표시된다

5. **AC5: 전체 백업 복원**
   - Given: 전체 백업 JSON 파일이 있을 때
   - When: 복원을 실행하면
   - Then: 단어와 문법 데이터가 모두 복원된다

## Tasks / Subtasks

- [x] Task 1: Import API
  - [x] 1.1 POST /api/data/vocab/csv - 단어 CSV
  - [x] 1.2 POST /api/data/vocab/json - 단어 JSON
  - [x] 1.3 POST /api/data/grammar/csv - 문법 CSV
  - [x] 1.4 POST /api/data/grammar/json - 문법 JSON
  - [x] 1.5 POST /api/data/all/json - 전체 복원

- [x] Task 2: Frontend 구현
  - [x] 2.1 파일 선택 UI
  - [x] 2.2 중복 건너뛰기 옵션
  - [x] 2.3 가져오기 결과 표시

## Dev Notes

### Import 처리 로직

```python
# 중복 체크 (skip_duplicates=True일 때)
existing = db.query(Vocabulary).filter(Vocabulary.kanji == kanji).first()
if existing:
    skipped += 1
    continue
```

### ImportResult 구조

```typescript
interface ImportResult {
  success: boolean;
  vocabulary_imported: number;
  vocabulary_skipped: number;
  grammar_imported: number;
  grammar_skipped: number;
  errors: string[];  // 최대 10개
}
```

### 지원 인코딩

- UTF-8 (기본)
- CP949 (한국어 Windows 폴백)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Change Log

- 2026-01-12: Story 8.2 구현 완료
  - Import API 엔드포인트 추가
  - Frontend 파일 업로드 및 결과 표시 구현
