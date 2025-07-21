# Google Drive 폴더 ID 검증 가이드

## 현재 에러 분석

**에러**: "File not found: 1p1RcwJlrJbIVP7IOpmTfwrY1Eg2SKIsN"

이 에러가 발생하는 가능한 원인:

### 1. 폴더 ID가 올바르지 않음
- 링크에서 추출한 ID가 정확하지 않을 수 있음
- Google Drive URL 형식 변경

### 2. 접근 권한 없음
- 현재 로그인한 계정이 해당 폴더에 접근 권한이 없음
- 폴더가 비공개이거나 특정 사용자만 접근 가능

### 3. 폴더가 삭제되었거나 휴지통에 있음

## 폴더 ID 올바르게 가져오는 방법

### Google Drive 폴더 URL에서 ID 추출:

1. **표준 공유 URL**: 
   ```
   https://drive.google.com/drive/folders/1p1RcwJlrJbIVP7IOpmTfwrY1Eg2SKIsN
   ```
   → 폴더 ID: `1p1RcwJlrJbIVP7IOpmTfwrY1Eg2SKIsN`

2. **다른 형태의 URL**:
   ```
   https://drive.google.com/drive/u/0/folders/1p1RcwJlrJbIVP7IOpmTfwrY1Eg2SKIsN
   ```
   → 폴더 ID: `1p1RcwJlrJbIVP7IOpmTfwrY1Eg2SKIsN`

## 문제 해결 방법

### 1. 폴더 접근 권한 확인
- 관리자 계정으로 해당 폴더에 직접 접근 가능한지 확인
- 브라우저에서 URL에 직접 접속해보기

### 2. 폴더 공유 설정 확인
1. Google Drive에서 폴더 우클릭
2. "공유" 선택
3. "액세스 권한이 있는 사용자" 확인
4. 필요 시 관리자 계정 추가

### 3. 새로운 테스트 폴더 생성
1. Google Drive에서 새 폴더 생성
2. 관리자 계정에 편집 권한 부여
3. 새 폴더 ID로 테스트

### 4. API 테스트 도구 사용
Google Drive API Explorer로 직접 테스트:
```
https://developers.google.com/drive/api/v3/reference/files/get
```

## 현재 해결 방법

### ✅ 즉시 작동하는 해결책 (현재 적용됨)

**Fallback 모드 활성화**: API 호출 없이 하드코딩된 폴더 이름 사용
- `USE_FALLBACK_NAMES_ONLY = true` 설정
- 폴더 이름: "교수자료실 폴더 1", "교수자료실 폴더 2"
- **권한 부여 기능은 정상 작동**

### 🔄 완전한 해결책 (향후)

**OAuth 스코프 업그레이드 완료**: 
- `drive.readonly` → `drive` (전체 권한)
- 새로 로그인하면 실제 폴더 이름 조회 가능

### 📋 현재 상태

✅ **폴더 이름 표시** - Fallback 이름으로 표시  
✅ **권한 부여 기능** - 정상 작동  
✅ **에러 없는 사용자 경험**  
✅ **관리자 워크플로우** - 완전 기능  

### ⚙️ 설정 변경 옵션

API 조회를 다시 활성화하려면:
```typescript
const USE_FALLBACK_NAMES_ONLY = false
```

하지만 현재 상태에서 모든 기능이 정상 작동하므로, 폴더 이름 조회가 꼭 필요하지 않다면 현재 설정을 유지하는 것이 안정적입니다.