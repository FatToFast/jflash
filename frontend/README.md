# J-Flash - 일본어 플래시카드

LLM으로 단어를 추출하고, SRS 알고리즘으로 복습하는 일본어 학습 앱입니다.

## 기능

- **복습 모드 4종**: 기본, 역방향, 듣기, 빈칸 채우기
- **SRS 알고리즘**: SM-2 기반 간격 반복 학습
- **단어장**: 일본어 단어 목록 및 검색
- **문법**: JLPT 레벨별 문법 정리
- **통계**: 학습 진행 현황
- **클라우드 동기화**: Supabase로 기기 간 동기화 (선택)

## 아키텍처

```
[Local: LLM으로 단어 추출] → [SQLite DB] → [JSON Export] → [Vercel: 정적 사이트]
                                                                    ↓
                                                           [Supabase: SRS 동기화]
```

- **단어/문법 데이터**: `/public/data/` 폴더의 JSON 파일
- **SRS 상태**: localStorage (기본) + Supabase (로그인 시)
- **서버**: 백엔드 없음 (정적 사이트 + Supabase)

## 데이터 저장 방식

| 로그인 상태 | 저장 위치 | 기기 간 동기화 |
|------------|-----------|---------------|
| 비로그인 | localStorage | ❌ |
| 로그인 | localStorage + Supabase | ✅ |

## 배포 방법

### 1. Vercel 배포 (권장)

```bash
# 1. GitHub에 푸시
git add .
git commit -m "Deploy to Vercel"
git push origin main

# 2. Vercel 연결
# - https://vercel.com 에서 GitHub 저장소 연결
# - Root Directory: frontend
# - Framework Preset: Next.js
# - Build Command: npm run build
# - Output Directory: .next
```

### 2. Supabase 설정 (선택)

클라우드 동기화가 필요한 경우:

1. [Supabase](https://app.supabase.com) 에서 무료 프로젝트 생성
2. SQL Editor에서 `supabase/schema.sql` 실행
3. Vercel 환경변수 설정:
   - `NEXT_PUBLIC_SUPABASE_URL`: 프로젝트 URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: anon/public key
4. Authentication > URL Configuration에서 Site URL 설정

### 3. 로컬 개발

```bash
cd frontend
npm install
npm run dev
```

http://localhost:3000 에서 확인

## 데이터 업데이트

### 단어 추가

1. SQLite DB (`/data/japanese_learning.db`)에 단어 추가
2. JSON 파일 다시 export:

```bash
# Python 스크립트로 export
python scripts/export_to_json.py

# 또는 수동으로 JSON 파일 편집
# /public/data/vocabulary.json
# /public/data/grammar.json
```

3. Git push → Vercel 자동 배포

### LLM 단어 추출 프롬프트

```
이 일본어 교재 이미지를 분석해주세요.

추출 규칙:
1. 이미지에 실제로 보이는 단어만 추출
2. 조사, 조동사는 제외
3. 동사는 기본형으로 변환 (勉強した → 勉強する)
4. 의미는 한국어로

출력 형식 (JSON):
{
  "words": [
    {
      "kanji": "勉強する",
      "reading": "べんきょうする",
      "meaning": "공부하다",
      "pos": "動詞",
      "jlpt_level": "N5",
      "example_sentence": "毎日日本語を勉強する。",
      "example_meaning": "매일 일본어를 공부한다."
    }
  ]
}
```

## 파일 구조

```
frontend/
├── app/
│   ├── page.tsx          # 홈
│   ├── auth/callback/    # Supabase 인증 콜백
│   ├── review/           # 복습 페이지
│   ├── vocab/            # 단어장
│   ├── grammar/          # 문법
│   └── stats/            # 통계
├── components/
│   └── AuthButton.tsx    # 로그인/동기화 버튼
├── lib/
│   ├── static-data.ts    # 정적 데이터 + SRS 로직
│   ├── supabase.ts       # Supabase 클라이언트
│   ├── constants.ts      # 상수 정의
│   └── config.ts         # 환경 설정
├── public/
│   └── data/
│       ├── vocabulary.json
│       └── grammar.json
└── next.config.ts

supabase/
└── schema.sql            # DB 스키마
```

## 환경 변수

`.env.local` (로컬 개발):

```bash
# Supabase (선택 - 클라우드 동기화 사용 시)
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Vercel 환경변수:
- 같은 변수들을 Vercel Dashboard > Settings > Environment Variables에 추가

## 라이선스

Private - Personal Use Only
