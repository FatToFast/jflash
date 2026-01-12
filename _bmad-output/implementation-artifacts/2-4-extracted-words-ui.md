# Story 2.4: 추출 단어 목록 UI

Status: done

## Story

As a 사용자,
I want 추출된 단어 목록을 테이블 형태로 확인하고,
so that 어떤 단어가 추출되었는지 한눈에 파악할 수 있다.

## Acceptance Criteria

1. **AC1: 테이블 형태 표시**
   - Given: 형태소 분석이 완료되었을 때
   - When: 결과 페이지가 표시되면
   - Then: 단어 목록이 테이블로 표시된다 (한자, 읽기, 품사 컬럼)

2. **AC2: 체크박스 선택**
   - Given: 단어 목록이 표시되어 있을 때
   - When: 사용자가 단어를 선택하면
   - Then: 각 단어 옆에 체크박스가 있어 저장할 단어를 선택할 수 있다

3. **AC3: 원본 이미지 썸네일**
   - Given: OCR로 추출된 단어가 표시될 때
   - When: 결과 페이지를 보면
   - Then: 원본 이미지가 썸네일로 함께 표시된다

## Tasks / Subtasks

- [x] Task 1: 테이블 컴포넌트 구현 (AC: 1)
  - [x] 1.1 단어 목록 테이블 레이아웃 (한자, 읽기, 품사 컬럼)
  - [x] 1.2 품사별 배지 스타일링
  - [x] 1.3 빈 상태 처리 (단어 없음)

- [x] Task 2: 체크박스 선택 기능 (AC: 2)
  - [x] 2.1 각 행에 체크박스 추가
  - [x] 2.2 전체 선택/해제 기능
  - [x] 2.3 선택된 단어 수 표시
  - [x] 2.4 선택 상태 관리 (useState)

- [x] Task 3: 원본 이미지 표시 (AC: 3)
  - [x] 3.1 이미지 썸네일 컴포넌트
  - [x] 3.2 클릭 시 원본 크기로 확대 (모달)
  - [x] 3.3 이미지 로딩 에러 처리

- [x] Task 4: 통합 및 테스트 (AC: 1, 2, 3)
  - [x] 4.1 /extract 페이지에 통합
  - [x] 4.2 반응형 레이아웃 확인
  - [x] 4.3 사용성 테스트

## Dev Notes

### UI 레이아웃

```
┌─────────────────────────────────────────────────────────────┐
│ 단어 추출                                                    │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────┐  ┌───────────────────────────────────────┐ │
│ │             │  │ 원본 텍스트                            │ │
│ │   이미지    │  │ 日本語を勉強しています                  │ │
│ │   썸네일    │  │                                       │ │
│ │             │  └───────────────────────────────────────┘ │
│ └─────────────┘                                             │
├─────────────────────────────────────────────────────────────┤
│ ☑ 전체 선택 (3/5 선택됨)                                    │
├────┬────────┬──────────┬────────┬───────────────────────────┤
│ ☑  │ 한자   │ 읽기     │ 품사   │ 기본형                    │
├────┼────────┼──────────┼────────┼───────────────────────────┤
│ ☑  │ 日本   │ にっぽん │ 名詞   │ 日本                      │
│ ☑  │ 語     │ ご       │ 名詞   │ 語                        │
│ ☐  │ 勉強   │ べんきょう│ 名詞   │ 勉強                      │
│ ☑  │ し     │ し       │ 動詞   │ 為る                      │
│ ☐  │ い     │ い       │ 動詞   │ 居る                      │
└────┴────────┴──────────┴────────┴───────────────────────────┘
│                                                             │
│  [다른 이미지 분석]  [선택한 단어 저장 (3)]                   │
└─────────────────────────────────────────────────────────────┘
```

### 컴포넌트 구조

```tsx
// WordTable.tsx
interface WordTableProps {
  words: WordInfo[];
  selectedWords: Set<number>;
  onSelectionChange: (selected: Set<number>) => void;
}

// ImageThumbnail.tsx
interface ImageThumbnailProps {
  src: string;
  alt: string;
  onClick?: () => void;
}

// ImageModal.tsx
interface ImageModalProps {
  isOpen: boolean;
  src: string;
  onClose: () => void;
}
```

### 선택 상태 관리

```tsx
const [selectedWords, setSelectedWords] = useState<Set<number>>(new Set());

// 전체 선택
const handleSelectAll = () => {
  if (selectedWords.size === words.length) {
    setSelectedWords(new Set());
  } else {
    setSelectedWords(new Set(words.map((_, i) => i)));
  }
};

// 개별 선택
const handleToggle = (index: number) => {
  const newSet = new Set(selectedWords);
  if (newSet.has(index)) {
    newSet.delete(index);
  } else {
    newSet.add(index);
  }
  setSelectedWords(newSet);
};
```

### References

- [Source: epics.md#Story 2.4] - Acceptance Criteria 정의
- [Source: epics.md#FR-004] - 추출 단어 목록 UI 표시
- Story 2.3 /extract 페이지 기반으로 확장

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- 이슈 없음 - 기존 /extract 페이지 확장으로 순조롭게 구현 완료

### Completion Notes List

- 12컬럼 그리드 테이블 레이아웃 구현 (체크박스, 한자, 읽기, 품사, 기본형)
- 품사별 색상 배지 (명사: 파랑, 동사: 초록, 형용사: 보라 등)
- 빈 상태 처리 (📭 아이콘 + 메시지)
- 체크박스: 개별 선택, 전체 선택/해제, 부분 선택 표시 (-)
- 선택된 단어 수 실시간 표시
- Set<number>로 선택 상태 관리
- 이미지 썸네일 (128x128px) + 클릭 시 모달 확대
- 모달: 어두운 배경 + 닫기 버튼 + 배경 클릭으로 닫기
- 이미지 로딩 에러 시 숨김 처리
- 기본값: 모든 단어 선택됨

### File List

**수정됨**:
- `frontend/app/extract/page.tsx` - 테이블 UI, 체크박스, 이미지 썸네일 통합

### Change Log

- 2026-01-12: Story 2.4 파일 생성 (ready-for-dev)
- 2026-01-12: Story 2.4 구현 완료
  - 12컬럼 그리드 테이블 (체크박스, 한자, 읽기, 품사, 기본형)
  - 체크박스: 개별/전체 선택, Set<number>로 상태 관리
  - 이미지 썸네일 + 모달 확대 기능
  - 품사별 컬러 배지, 빈 상태 처리
