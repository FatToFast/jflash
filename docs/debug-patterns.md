# Debug Patterns - J-Flash

반복 발생 가능한 버그 패턴과 해결책을 기록합니다.

---

### 1. 날짜만 비교하여 복습 카드가 다시 표시됨

**문제**: 복습 완료한 카드가 같은 날 다시 접속하면 처음부터 다시 표시됨

```typescript
// ❌ 잘못된 패턴 - 날짜만 비교
const today = new Date().toISOString().split("T")[0];
return allItems.filter((item) => {
  const state = states[item.id];
  if (!state) return true;
  return state.next_review.split("T")[0] <= today;  // 시간 무시!
});

// ✅ 올바른 패턴 - FSRS의 isDue() 함수로 정확한 시간 비교
import { isDue, getFSRSStates } from "./fsrs";

const fsrsStates = getFSRSStates();
return allItems.filter((item) => {
  const fsrsState = fsrsStates[item.id];
  if (!fsrsState) return true;
  return isDue(fsrsState);  // 정확한 시간 기반 비교
});
```

**원인**:
- FSRS는 복습 후 `due` 시간을 정확하게 설정 (예: 내일 10:00)
- 하지만 날짜만 비교하면 오늘 안에는 모든 시간이 "오늘"로 판단됨
- 결과: 오전에 복습해도 오후에 다시 접속하면 같은 카드가 due로 표시

**적용 위치**:
- `frontend/lib/static-data.ts`: `getDueCards()`, `getStatsAsync()`

**수정일**: 2025-01-12
