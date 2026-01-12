# J-Flash 개선 제안 목록

> **작성일**: 2025-01-11
> **상태**: MVP 개발 중 - 로컬 완성 후 적용 예정

---

## 1. OCR 검증 로직 개선

### 1.1 MIN_CHAR_COUNT 기준 변경
**현재**: 공백 제외 문자 수만 카운트 (문장부호 포함)
**제안**: `is_japanese_char` 기반 카운트로 변경하거나, `total_chars`와 `jp_chars` 둘 다 기준으로 사용

```python
# 현재
total_chars = len(text.replace(" ", "").replace("\n", ""))

# 제안
jp_chars = sum(1 for c in text if is_japanese_char(c))
total_chars = len(text.replace(" ", "").replace("\n", ""))
# 둘 다 기준으로 활용
```

### 1.2 avg_confidence 극단값 취약성
**현재**: 단순 평균 사용
**제안**: median 또는 p25 분위값 함께 계산하여 warn 기준에 활용

```python
import statistics

confidences = [item[2] for item in ocr_result]
avg_confidence = statistics.mean(confidences)
median_confidence = statistics.median(confidences)
p25_confidence = statistics.quantiles(confidences, n=4)[0]  # 25th percentile
```

### 1.3 디버깅/튜닝용 메트릭 추가
**제안**: 결과에 상세 메트릭 반환

```python
"validation": {
    "status": "pass",
    "avg_confidence": 0.82,
    "median_confidence": 0.85,
    "jp_char_ratio": 0.64,
    "issues": [],
    # 추가 메트릭
    "metrics": {
        "total_chars": 150,
        "jp_chars": 96,
        "item_count": 12,
        "p25_confidence": 0.75
    }
}
```

### 1.4 임계치 환경변수화
**제안**: 실험/튜닝 쉽게 하기 위해 환경변수로 분리

```python
# ocr_validation.py
import os

MIN_CONFIDENCE = float(os.getenv("OCR_MIN_CONFIDENCE", "0.5"))
MIN_JP_RATIO = float(os.getenv("OCR_MIN_JP_RATIO", "0.3"))
MIN_CHAR_COUNT = int(os.getenv("OCR_MIN_CHAR_COUNT", "10"))
```

---

## 2. 업로드/에러 처리 개선

### 2.1 이미지 파일 위장 방지
**현재**: 확장자만 검증
**제안**: Pillow로 실제 이미지 검증

```python
from PIL import Image

def verify_image(file_path: str) -> bool:
    try:
        with Image.open(file_path) as img:
            img.verify()
        return True
    except Exception:
        return False
```

### 2.2 OCR 실패 예외 처리
**제안**: OCR 실패 시 graceful 응답

```python
try:
    ocr_result = ocr_service.process(image_path)
except Exception as e:
    return {
        "success": False,
        "validation": {
            "status": "fail",
            "issues": ["ocr_failed"],
            "error_message": str(e)
        },
        "words": []
    }
```

### 2.3 대용량 파일 스트리밍 저장
**현재**: 전체 파일 메모리 로드
**제안**: `shutil.copyfileobj`로 스트리밍 저장

```python
import shutil

async def save_upload_file(upload_file: UploadFile, destination: Path):
    with destination.open("wb") as buffer:
        shutil.copyfileobj(upload_file.file, buffer)
```

---

## 3. 구성/유지보수 개선

### 3.1 OCR 언어 설정 분리
**제안**: 언어 리스트를 설정값으로 분리

```python
# config.py 또는 환경변수
OCR_LANGS = os.getenv("OCR_LANGS", "ja,en").split(",")

# ocr_service.py
reader = easyocr.Reader(OCR_LANGS)
```

---

## 4. 프론트엔드 UX 개선

### 4.1 재촬영 가이드 CTA
**제안**: `status=fail`일 때 재촬영 가이드 노출

```tsx
{validation.status === 'fail' && (
  <div className="bg-red-50 p-4 rounded-lg">
    <h3 className="font-bold text-red-700">OCR 실패</h3>
    <p>이미지를 다시 촬영해주세요.</p>
    <ul className="mt-2 text-sm">
      <li>- 밝은 조명에서 촬영</li>
      <li>- 텍스트가 선명하게 보이도록</li>
      <li>- 기울어지지 않게</li>
    </ul>
    <button className="mt-3 bg-red-600 text-white px-4 py-2 rounded">
      다시 촬영하기
    </button>
  </div>
)}
```

### 4.2 조건부 경고 표시
**제안**: `issues`가 있을 때만 "추천 액션" 영역 표시

```tsx
{validation.issues.length > 0 && (
  <div className="bg-yellow-50 p-3 rounded">
    <h4 className="font-semibold">개선 가능</h4>
    <ul className="text-sm">
      {validation.issues.includes('low_confidence') && (
        <li>- 더 선명한 이미지 권장</li>
      )}
      {validation.issues.includes('low_jp_ratio') && (
        <li>- 일본어 텍스트가 적습니다</li>
      )}
    </ul>
  </div>
)}

{/* issues 없으면 깔끔하게 결과만 표시 */}
{validation.issues.length === 0 && (
  <div className="text-green-600">
    ✅ OCR 완료 - {words.length}개 단어 추출
  </div>
)}
```

---

## 우선순위

| 순위 | 항목 | 난이도 | 영향도 |
|------|------|--------|--------|
| 1 | 이미지 파일 위장 방지 | 낮음 | 보안 |
| 2 | OCR 실패 예외 처리 | 낮음 | UX |
| 3 | 재촬영 가이드 CTA | 낮음 | UX |
| 4 | 임계치 환경변수화 | 낮음 | 유지보수 |
| 5 | 메트릭 확장 | 중간 | 디버깅 |
| 6 | median confidence | 중간 | 정확도 |
| 7 | 스트리밍 저장 | 중간 | 성능 |

---

## 적용 시점

- **MVP 완성 전**: 1, 2, 3번 (필수 안정성)
- **MVP 완성 후**: 4, 5, 6, 7번 (최적화)
- **NAS 배포 전**: 전체 검토

---

> 이 문서는 개발 진행에 따라 업데이트됩니다.
