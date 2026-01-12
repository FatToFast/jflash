# Story 5.2: 문법 목록 조회 및 검색

Status: done

## Story

As a 사용자,
I want 문법 목록을 조회하고 검색하고,
so that 원하는 문법을 빠르게 찾을 수 있다.

## Acceptance Criteria

1. **AC1: 문법 목록 표시**
   - Given: 문법 페이지에 접속했을 때
   - When: 페이지가 로드되면
   - Then: 등록된 문법 목록이 표시된다

2. **AC2: 문법 검색**
   - Given: 문법 목록 페이지에 있을 때
   - When: 검색어를 입력하고 검색하면
   - Then: 제목, 의미, 설명, 예문에서 일치하는 문법이 필터링된다

3. **AC3: 페이지네이션**
   - Given: 문법이 20개 이상 있을 때
   - When: 목록을 스크롤하면
   - Then: 페이지네이션으로 다음 페이지 문법을 볼 수 있다

## Tasks / Subtasks

- [x] Task 1: 문법 목록 API
  - [x] 1.1 GET /api/grammar - 목록 조회
  - [x] 1.2 검색 파라미터 (search)
  - [x] 1.3 페이지네이션 (page, page_size)
  - [x] 1.4 정렬 (sort_by, sort_order)

- [x] Task 2: 문법 목록 UI
  - [x] 2.1 문법 카드 컴포넌트
  - [x] 2.2 검색 입력창
  - [x] 2.3 페이지네이션 컴포넌트
  - [x] 2.4 빈 상태 UI

## Dev Notes

### API 응답 구조

```json
{
  "items": [
    {
      "id": 1,
      "title": "～ている",
      "meaning": "~하고 있다",
      "description": "진행/상태를 나타내는 문법",
      "example": "今、本を読んでいます。",
      "example_meaning": "지금, 책을 읽고 있습니다.",
      "level": "N5",
      "created_at": "2026-01-12T..."
    }
  ],
  "total": 100,
  "page": 1,
  "page_size": 20
}
```

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Change Log

- 2026-01-12: Story 5.2 구현 완료 (grammar/page.tsx에 통합)
