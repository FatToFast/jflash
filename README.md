# J-Flash - 일본어 플래시카드 학습 앱

LLM(Claude)을 활용하여 일본어 교재에서 단어/문장을 추출하고, SRS(Spaced Repetition System)로 복습하는 앱입니다.

## 아키텍처

```
[이미지] → [Claude Code 추출] → [JSON 파일] → [Git Push] → [GitHub Actions] → [Supabase DB]
                                                                ↓
                                                        [Vercel 웹앱] ← 복습
```

- **단어 추출**: Claude Code로 이미지에서 단어/문장 추출 → JSON 파일 저장
- **데이터 저장**: Static JSON 파일 (words.json, sentences.json)
- **클라우드 동기화**: GitHub Actions → Supabase 자동 동기화
- **복습**: 웹앱에서 SRS 기반 복습

---

## 데이터 구조

```
frontend/public/data/
├── words.json          # 학습 중인 단어
├── sentences.json      # 학습 중인 문장
└── mastered/           # 마스터된 항목 (JLPT 레벨별)
    ├── N5.json
    ├── N4.json
    ├── N3.json
    ├── N2.json
    ├── N1.json
    └── unknown.json
```

---

## 사용법

### 1. 단어 추출 (Claude Code)

Claude Code에 일본어 교재 이미지를 첨부하고 "단어 추출" 또는 "문장 추출" 요청:

```
이 이미지에서 단어를 추출해줘
```

→ Claude가 자동으로 JSON 파일에 저장하고 Git 커밋/푸시

### 2. Supabase 동기화

**자동 동기화**: `frontend/public/data/**` 파일이 main 브랜치에 push되면 GitHub Actions가 자동 실행

**수동 동기화**:
```bash
npm run sync:supabase
```

### 3. 복습

웹앱에서 복습: https://jflash.vercel.app

---

## 스크립트

| 명령어 | 설명 |
|--------|------|
| `npm run dev` | 개발 서버 실행 |
| `npm run build` | 프로덕션 빌드 |
| `npm run split` | vocabulary.json → words.json + sentences.json 분리 |
| `npm run archive` | 마스터된 항목을 JLPT 레벨별 파일로 아카이브 |
| `npm run sync:supabase` | JSON 파일을 Supabase에 동기화 |

---

## 환경 변수

### 로컬 (.env)

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key
DEVICE_ID=your-device-uuid
```

### GitHub Secrets (자동 동기화용)

| Secret | 설명 |
|--------|------|
| `SUPABASE_URL` | Supabase 프로젝트 URL |
| `SUPABASE_SERVICE_KEY` | Supabase service role key |

---

## 복습 모드 (5종)

| 모드 | 앞면 | 뒷면 |
|------|------|------|
| 기본 | 食べる | たべる / 먹다 |
| 역방향 | 먹다 | 食べる (たべる) |
| 듣기 | 🔊 TTS | 食べる / 먹다 |
| 빈칸 | ___を食べる | ご飯 |
| 타이핑 | 食べる | 입력: たべる |

---

## 기술 스택

| 항목 | 기술 |
|------|------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS |
| 데이터 | Static JSON + Supabase |
| SRS | localStorage + Supabase 동기화 |
| 배포 | Vercel |
| CI/CD | GitHub Actions |

---

## 버전

- **앱 버전**: 2.0.0
- **복습 모드**: 5종 (기본, 역방향, 듣기, 빈칸, 타이핑)
- **TTS**: Web Speech API (ja-JP)
