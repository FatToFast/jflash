# J-Flash 일본어 학습 웹앱 - 시스템 아키텍처

> **버전**: 2.0.0
> **최종 수정**: 2026-01-12
> **상태**: Static JSON + Supabase 하이브리드 아키텍처

---

## 1. 전체 개요

### 1.1 프로젝트 목적
Claude Code를 활용하여 일본어 교재에서 단어/문장을 추출하고, SRS 기반 플래시카드로 복습하는 **서버리스** 웹 애플리케이션

### 1.2 핵심 가치
| 가치 | 설명 |
|------|------|
| 🤖 AI 추출 | Claude Code로 이미지에서 단어/문장 자동 추출 |
| 📚 맞춤형 학습 | 본인 교재에 최적화된 단어장 |
| 🧠 과학적 암기 | SM-2 SRS 알고리즘 기반 장기 기억 강화 |
| 🌐 어디서든 복습 | Vercel 배포로 모바일/PC 어디서든 |
| 💰 무료 운영 | Vercel + Supabase 무료 티어 활용 |

### 1.3 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────────────┐
│                    📸 단어 추출 (Claude Code)                    │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ 1. 교재 이미지 첨부                                         │ │
│  │ 2. "단어 추출" 또는 "문장 추출" 요청                         │ │
│  │ 3. Claude가 JSON 파일에 저장 + Git 커밋/푸시                │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                         git push
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        🐙 GitHub                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ frontend/public/data/                                      │ │
│  │ ├── words.json         # 학습 중인 단어                    │ │
│  │ ├── sentences.json     # 학습 중인 문장                    │ │
│  │ └── mastered/          # 마스터된 항목 (JLPT 레벨별)        │ │
│  └───────────────────────────────────────────────────────────┘ │
│                              │                                   │
│                    GitHub Actions (on push)                     │
│                              ▼                                   │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ npm run sync:supabase                                      │ │
│  │ → Supabase vocabulary 테이블에 동기화                      │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼                               ▼
┌─────────────────────────┐     ┌─────────────────────────┐
│      🌐 Vercel          │     │     🗄️ Supabase         │
│  ┌───────────────────┐  │     │  ┌───────────────────┐  │
│  │ Next.js 14        │  │     │  │ vocabulary 테이블  │  │
│  │ - Static JSON     │  │     │  │ - 단어 데이터      │  │
│  │ - 복습 UI         │  │     │  │ - status 관리      │  │
│  │ - SRS 알고리즘    │  │     │  └───────────────────┘  │
│  └───────────────────┘  │     │  ┌───────────────────┐  │
│                         │ ◄──►│  │ srs_records 테이블│  │
│  📱 브라우저            │     │  │ - 복습 진행도     │  │
│  - localStorage         │────►│  │ - 디바이스별 동기화│  │
│  - SRS 상태 저장        │     │  └───────────────────┘  │
└─────────────────────────┘     └─────────────────────────┘
```

---

## 2. 기술 스택

### 2.1 Frontend
| 기술 | 버전 | 용도 |
|------|------|------|
| Next.js | 14.x | React 프레임워크 (App Router) |
| TypeScript | 5.x | 정적 타입 |
| Tailwind CSS | 3.x | 유틸리티 기반 스타일링 |
| @supabase/supabase-js | 2.x | Supabase 클라이언트 |

### 2.2 Backend (서버리스)
| 기술 | 용도 |
|------|------|
| Static JSON | 단어/문장 데이터 저장 |
| Supabase | SRS 진행도 동기화 + 단어 백업 |
| GitHub Actions | 자동 동기화 CI/CD |

### 2.3 배포
| 서비스 | 용도 |
|--------|------|
| Vercel | 프론트엔드 호스팅 (무료) |
| Supabase | 데이터베이스 (무료 500MB) |
| GitHub | 소스 코드 + 데이터 버전 관리 |

---

## 3. 데이터 흐름

### 3.1 단어 추가 플로우
```
1. Claude Code에 이미지 첨부 + "단어 추출" 요청
   ↓
2. Claude가 이미지에서 단어/문장 추출
   ↓
3. words.json 또는 sentences.json에 추가
   ↓
4. Git 커밋 및 푸시
   ↓
5. GitHub Actions 트리거 → npm run sync:supabase
   ↓
6. Supabase vocabulary 테이블에 upsert
```

### 3.2 복습 플로우
```
1. 사용자가 웹앱 접속 (/review)
   ↓
2. Static JSON에서 단어 로드 (또는 Supabase에서)
   ↓
3. localStorage에서 SRS 상태 로드
   ↓
4. 오늘 복습할 카드 필터링 (next_review <= today)
   ↓
5. 플래시카드 표시 → 사용자 응답
   ↓
6. SM-2 알고리즘으로 다음 복습일 계산
   ↓
7. localStorage에 저장 + Supabase에 동기화
```

### 3.3 마스터 아카이브 플로우
```
1. npm run archive 실행
   ↓
2. Supabase에서 SRS 데이터 조회
   ↓
3. 마스터 조건 확인 (reps ≥ 5 AND interval ≥ 30)
   ↓
4. 마스터된 항목을 JLPT 레벨별 파일로 이동
   - words.json → mastered/N5.json (레벨에 따라)
   ↓
5. Git 커밋 및 푸시
```

---

## 4. 디렉토리 구조

```
jflash/
├── 📁 frontend/               # Next.js 애플리케이션
│   ├── app/                   # App Router 페이지
│   │   ├── layout.tsx         # 루트 레이아웃
│   │   ├── page.tsx           # 홈 페이지
│   │   ├── review/            # 복습 페이지
│   │   ├── vocab/             # 단어장 페이지
│   │   └── stats/             # 통계 페이지
│   ├── components/            # 재사용 컴포넌트
│   │   └── FlashCard.tsx      # 플래시카드 UI
│   ├── lib/                   # 유틸리티
│   │   ├── static-data.ts     # JSON 데이터 로더
│   │   └── supabase.ts        # Supabase 클라이언트
│   └── public/
│       └── data/              # 📊 단어 데이터
│           ├── words.json
│           ├── sentences.json
│           └── mastered/
│
├── 📁 scripts/                # 유틸리티 스크립트
│   ├── split-vocabulary.ts    # 단어/문장 분리
│   ├── archive-mastered.ts    # 마스터 아카이브
│   └── sync-to-supabase.ts    # Supabase 동기화
│
├── 📁 supabase/               # Supabase 설정
│   └── schema.sql             # 테이블 스키마
│
├── 📁 .github/
│   └── workflows/
│       └── sync-supabase.yml  # 자동 동기화 워크플로우
│
├── .env                       # 환경 변수 (로컬)
├── .env.example               # 환경 변수 예시
├── package.json               # 루트 스크립트
├── CLAUDE.md                  # Claude 가이드라인
├── README.md                  # 프로젝트 소개
└── ARCHITECTURE.md            # 이 문서
```

---

## 5. Supabase 스키마

### 5.1 vocabulary 테이블
```sql
CREATE TABLE vocabulary (
    id INTEGER PRIMARY KEY,
    kanji TEXT NOT NULL,
    reading TEXT,
    meaning TEXT,
    pos TEXT,
    jlpt_level TEXT,
    example_sentence TEXT,
    example_meaning TEXT,
    notes TEXT,
    status TEXT DEFAULT 'active',  -- 'active' or 'mastered'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 5.2 srs_records 테이블
```sql
CREATE TABLE srs_records (
    id SERIAL PRIMARY KEY,
    device_id UUID NOT NULL,
    vocab_id INTEGER NOT NULL,
    interval INTEGER DEFAULT 1,
    ease_factor REAL DEFAULT 2.5,
    next_review TIMESTAMPTZ DEFAULT NOW(),
    reps INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(device_id, vocab_id)
);
```

---

## 6. SRS 알고리즘 (SM-2)

### 6.1 파라미터
- **interval**: 복습 간격 (일)
- **ease_factor**: 난이도 계수 (1.3 ~ 2.5)
- **reps**: 연속 정답 횟수
- **next_review**: 다음 복습일

### 6.2 알고리즘
```typescript
if (correct) {
  reps += 1;
  if (reps === 1) interval = 1;
  else if (reps === 2) interval = 3;
  else interval = Math.round(interval * ease_factor);
  ease_factor = Math.max(1.3, ease_factor + 0.1 - (4 - quality) * 0.08);
} else {
  reps = 0;
  interval = 1;
  ease_factor = Math.max(1.3, ease_factor - 0.2);
}
next_review = today + interval days;
```

### 6.3 마스터 조건
- reps ≥ 5 AND interval ≥ 30일
- 마스터된 항목은 `mastered/*.json`으로 아카이브

---

## 7. 환경 변수

### 7.1 로컬 (.env)
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key
DEVICE_ID=your-device-uuid
```

### 7.2 GitHub Secrets
| Secret | 용도 |
|--------|------|
| `SUPABASE_URL` | Supabase 프로젝트 URL |
| `SUPABASE_SERVICE_KEY` | 쓰기 권한 키 |

### 7.3 Vercel 환경 변수
| 변수 | 용도 |
|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | 프론트엔드 Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 프론트엔드 anon key |

---

## 8. 변경 이력

| 날짜 | 버전 | 변경 내용 |
|------|------|----------|
| 2025-01-11 | 1.0.0 | 초기 구축 (Python 백엔드 + SQLite) |
| 2026-01-12 | 1.2.0 | Epic 1-9 완료 |
| 2026-01-12 | 2.0.0 | 아키텍처 전환: Static JSON + Supabase 하이브리드 |

### v2.0.0 주요 변경사항
- Python 백엔드 제거 → 순수 프론트엔드
- SQLite → Static JSON + Supabase
- Claude Code를 통한 단어 추출 워크플로우
- GitHub Actions 자동 동기화
- 단어/문장/마스터 파일 분리
