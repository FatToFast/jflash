#!/bin/bash
# J-Flash DB 동기화 스크립트
# 로컬 SQLite DB를 NAS로 복사
# Usage: ./scripts/sync-db-to-nas.sh [NAS_HOST]

set -e

# 설정 (필요에 따라 수정)
LOCAL_DB="./data/japanese_learning.db"
NAS_HOST="${1:-nas}"  # 기본값: nas (SSH config에서 설정)
NAS_PATH="/volume1/docker/jflash/data"

# 색상 정의
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== J-Flash DB 동기화 ===${NC}"
echo "시작 시간: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

# 로컬 DB 파일 확인
if [ ! -f "$LOCAL_DB" ]; then
    echo -e "${RED}오류: 로컬 DB 파일을 찾을 수 없습니다: $LOCAL_DB${NC}"
    exit 1
fi

# DB 파일 정보
DB_SIZE=$(du -h "$LOCAL_DB" | cut -f1)
echo "로컬 DB 파일: $LOCAL_DB"
echo "파일 크기: $DB_SIZE"
echo ""

# 백업 생성 (선택사항)
BACKUP_DIR="./data/backups"
mkdir -p "$BACKUP_DIR"
BACKUP_FILE="$BACKUP_DIR/japanese_learning_$(date '+%Y%m%d_%H%M%S').db"
cp "$LOCAL_DB" "$BACKUP_FILE"
echo -e "${GREEN}백업 생성 완료: $BACKUP_FILE${NC}"

# NAS 연결 확인
echo ""
echo "NAS 연결 확인 중: $NAS_HOST..."
if ! ssh -q -o ConnectTimeout=5 "$NAS_HOST" exit 2>/dev/null; then
    echo -e "${RED}오류: NAS에 연결할 수 없습니다.${NC}"
    echo "SSH 설정을 확인하세요: ~/.ssh/config"
    echo ""
    echo "예시 설정:"
    echo "  Host nas"
    echo "    HostName 192.168.0.100"
    echo "    User admin"
    echo "    IdentityFile ~/.ssh/id_rsa"
    exit 1
fi
echo -e "${GREEN}NAS 연결 성공${NC}"

# NAS 디렉토리 생성 (없는 경우)
echo ""
echo "NAS 디렉토리 확인 중..."
ssh "$NAS_HOST" "mkdir -p $NAS_PATH"

# DB 복사
echo ""
echo "DB 동기화 중..."
scp "$LOCAL_DB" "$NAS_HOST:$NAS_PATH/"

# 동기화 확인
REMOTE_SIZE=$(ssh "$NAS_HOST" "du -h $NAS_PATH/japanese_learning.db" | cut -f1)
echo ""
echo -e "${GREEN}=== 동기화 완료 ===${NC}"
echo "로컬 파일 크기: $DB_SIZE"
echo "NAS 파일 크기: $REMOTE_SIZE"
echo "완료 시간: $(date '+%Y-%m-%d %H:%M:%S')"

# Docker 컨테이너 재시작 (선택사항)
read -p "Docker 컨테이너를 재시작하시겠습니까? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Docker 컨테이너 재시작 중..."
    ssh "$NAS_HOST" "cd /volume1/docker/jflash && docker-compose restart jflash-backend"
    echo -e "${GREEN}재시작 완료${NC}"
fi

echo ""
echo -e "${GREEN}모든 작업이 완료되었습니다!${NC}"
