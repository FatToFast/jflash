# J-Flash NAS 배포 가이드

> **버전**: 1.0.0
> **최종 수정**: 2026-01-12
> **대상**: Synology NAS (Docker 지원 모델)

---

## 목차

1. [사전 준비](#1-사전-준비)
2. [Docker 이미지 빌드](#2-docker-이미지-빌드)
3. [NAS 배포](#3-nas-배포)
4. [외부 접속 설정](#4-외부-접속-설정)
5. [DB 동기화](#5-db-동기화)
6. [문제 해결](#6-문제-해결)

---

## 1. 사전 준비

### 1.1 NAS 요구사항

| 항목 | 요구사항 |
|------|----------|
| Synology NAS | Docker 패키지 지원 모델 (DS218+, DS920+ 등) |
| Docker 패키지 | Container Manager 또는 Docker 패키지 설치 |
| RAM | 최소 2GB (권장 4GB) |
| 저장 공간 | 최소 500MB |

### 1.2 로컬 PC 요구사항

- Docker Desktop 설치 (테스트용)
- SSH 클라이언트
- Git (선택사항)

### 1.3 NAS SSH 접속 설정

```bash
# ~/.ssh/config 파일에 추가
Host nas
    HostName 192.168.0.100  # NAS IP 주소
    User admin              # NAS 사용자명
    Port 22
    IdentityFile ~/.ssh/id_rsa

# 연결 테스트
ssh nas
```

---

## 2. Docker 이미지 빌드

### 2.1 로컬에서 테스트 빌드

```bash
cd /path/to/learning-japanese

# 전체 빌드
docker-compose build

# 또는 개별 빌드
docker build -t jflash-backend ./backend
docker build -t jflash-frontend ./frontend

# 로컬 테스트
docker-compose up -d

# 확인
curl http://localhost:8000/health
curl http://localhost:3000
```

### 2.2 이미지 내보내기 (NAS 직접 빌드가 어려운 경우)

```bash
# 이미지 저장
docker save jflash-backend:latest | gzip > jflash-backend.tar.gz
docker save jflash-frontend:latest | gzip > jflash-frontend.tar.gz

# NAS로 전송
scp jflash-*.tar.gz nas:/volume1/docker/jflash/

# NAS에서 이미지 로드
ssh nas
cd /volume1/docker/jflash
docker load < jflash-backend.tar.gz
docker load < jflash-frontend.tar.gz
```

---

## 3. NAS 배포

### 3.1 프로젝트 파일 복사

```bash
# 방법 1: Git clone (권장)
ssh nas
cd /volume1/docker
git clone <your-repo-url> jflash

# 방법 2: SCP 복사
scp -r ./learning-japanese nas:/volume1/docker/jflash
```

### 3.2 디렉토리 구조 확인

```
/volume1/docker/jflash/
├── backend/
│   └── Dockerfile
├── frontend/
│   └── Dockerfile
├── data/
│   └── japanese_learning.db
├── docker-compose.yml
└── scripts/
```

### 3.3 Docker Compose 실행

```bash
ssh nas
cd /volume1/docker/jflash

# 빌드 및 실행
docker-compose up -d --build

# 상태 확인
docker-compose ps

# 로그 확인
docker-compose logs -f

# 중지
docker-compose down
```

### 3.4 Synology Container Manager GUI 사용

1. Container Manager 열기
2. 프로젝트 → 생성
3. 경로: `/volume1/docker/jflash`
4. docker-compose.yml 선택
5. 빌드 및 시작

---

## 4. 외부 접속 설정

### 4.1 옵션 A: Tailscale (권장 - 가장 쉬움)

#### 장점
- 설정이 매우 간단
- 무료 (개인 사용)
- 보안 VPN 연결
- 포트 포워딩 불필요

#### 설정 방법

1. **Synology 패키지 센터에서 Tailscale 설치**

2. **Tailscale 계정 생성 및 로그인**
   - https://tailscale.com 에서 계정 생성
   - NAS에서 Tailscale 앱 실행 → 로그인

3. **모바일에서도 Tailscale 설치**
   - iOS/Android 앱 설치
   - 동일 계정으로 로그인

4. **접속**
   ```
   # NAS의 Tailscale IP 확인
   # 예: 100.x.x.x

   # 접속 URL
   http://100.x.x.x:3000  # Frontend
   http://100.x.x.x:8000  # Backend API
   ```

### 4.2 옵션 B: Cloudflare Tunnel (도메인 필요)

#### 장점
- HTTPS 자동 적용
- 커스텀 도메인 사용 가능
- 무료

#### 설정 방법

1. **Cloudflare 계정 및 도메인 설정**
   - Cloudflare에 도메인 등록

2. **Tunnel 생성**
   ```bash
   # NAS에서 cloudflared 설치
   docker run -d --name cloudflared \
     --restart unless-stopped \
     cloudflare/cloudflared:latest tunnel \
     --no-autoupdate run --token <YOUR_TUNNEL_TOKEN>
   ```

3. **Cloudflare Dashboard에서 라우팅 설정**
   ```
   jflash.yourdomain.com → http://localhost:3000
   api.jflash.yourdomain.com → http://localhost:8000
   ```

### 4.3 옵션 C: 포트 포워딩 + DDNS

#### 설정 방법

1. **공유기 포트 포워딩**
   - 외부 3000 → NAS:3000
   - 외부 8000 → NAS:8000

2. **Synology DDNS 설정**
   - 제어판 → 외부 액세스 → DDNS
   - Synology DDNS 활성화

3. **접속**
   ```
   http://yourname.synology.me:3000
   ```

⚠️ **주의**: 보안을 위해 HTTPS 설정을 권장합니다.

---

## 5. DB 동기화

### 5.1 수동 동기화

```bash
# 로컬에서 실행
./scripts/sync-db-to-nas.sh

# 또는 직접 scp
scp ./data/japanese_learning.db nas:/volume1/docker/jflash/data/
```

### 5.2 자동 동기화 (Cron)

```bash
# crontab -e
# 매 시간 동기화
0 * * * * /path/to/learning-japanese/scripts/sync-db-to-nas.sh >> /var/log/jflash-sync.log 2>&1

# 매일 자정 동기화
0 0 * * * /path/to/learning-japanese/scripts/sync-db-to-nas.sh >> /var/log/jflash-sync.log 2>&1
```

### 5.3 동기화 주의사항

- **단방향 동기화**: 로컬 → NAS (NAS에서는 읽기만)
- **동기화 전 백업**: 스크립트가 자동으로 백업 생성
- **동기화 후 재시작**: 필요 시 Docker 컨테이너 재시작

---

## 6. 문제 해결

### 6.1 Docker 빌드 실패

```bash
# 캐시 없이 다시 빌드
docker-compose build --no-cache

# 로그 확인
docker-compose logs jflash-backend
docker-compose logs jflash-frontend
```

### 6.2 포트 충돌

```bash
# 사용 중인 포트 확인
netstat -tlnp | grep :3000
netstat -tlnp | grep :8000

# docker-compose.yml에서 포트 변경
ports:
  - "3001:3000"  # 외부:내부
```

### 6.3 DB 연결 오류

```bash
# 볼륨 마운트 확인
docker exec -it jflash-backend ls -la /app/data/

# DB 파일 권한 확인
ls -la ./data/japanese_learning.db
chmod 644 ./data/japanese_learning.db
```

### 6.4 메모리 부족

```yaml
# docker-compose.yml에 메모리 제한 추가
services:
  jflash-backend:
    deploy:
      resources:
        limits:
          memory: 512M
```

### 6.5 Tailscale 연결 안됨

```bash
# Tailscale 상태 확인
tailscale status

# 재로그인
tailscale up --reset
```

---

## 7. 체크리스트

### 배포 전
- [ ] 로컬에서 모든 기능 테스트 완료
- [ ] Docker 빌드 테스트 완료
- [ ] NAS SSH 접속 설정 완료

### 배포 중
- [ ] 프로젝트 파일 NAS 복사
- [ ] docker-compose up -d --build 실행
- [ ] 컨테이너 상태 확인 (docker-compose ps)
- [ ] 헬스체크 확인 (curl localhost:8000/health)

### 배포 후
- [ ] 외부 접속 설정 (Tailscale/Tunnel)
- [ ] 모바일에서 접속 테스트
- [ ] DB 동기화 스크립트 테스트
- [ ] 자동 동기화 설정 (선택)

---

## 8. 비용 요약

| 항목 | 비용 |
|------|------|
| NAS Docker | $0 (이미 보유한 NAS 활용) |
| Tailscale | $0 (개인 무료) |
| Cloudflare Tunnel | $0 (도메인 비용 별도) |
| **총 비용** | **$0** |

---

## 9. 참고 링크

- [Synology Docker 가이드](https://kb.synology.com/en-global/DSM/help/Docker/docker_desc)
- [Tailscale Synology 설정](https://tailscale.com/kb/1131/synology)
- [Cloudflare Tunnel 문서](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/)
