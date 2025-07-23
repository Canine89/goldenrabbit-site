# 관리자 전용 Google OAuth 설정 가이드

## 개요

관리자가 독립적인 Google OAuth로 로그인하여 Google Drive API를 통해 교수에게 자동으로 폴더 권한을 부여하는 시스템입니다.

## 주요 기능

### 1. 독립 Google OAuth
- Supabase OAuth 제한을 우회하는 독립적인 Google OAuth 시스템
- 팝업 기반 인증 플로우
- 로컬 스토리지를 통한 토큰 관리

### 2. 자동 권한 부여
- 관리자가 Google Drive 편집 권한이 있을 때 자동 권한 부여 가능
- 교수 승인 시 한 번에 모든 폴더에 읽기 권한 부여
- 실시간 권한 부여 결과 표시

### 3. 수동 권한 부여 지원
- 기존 수동 권한 부여 방식과 병행 지원
- 자동 권한 부여 실패 시 수동 방식으로 대체

## 설정 방법

### 1. Google Cloud Console 설정

1. **Google Cloud Console** → **APIs & Services** → **Enabled APIs & Services**
2. **Google Drive API** 활성화 확인
3. **OAuth 2.0 Client IDs** 설정:
   - 승인된 JavaScript 원본: `https://goldenrabbit-site.vercel.app`
   - 승인된 리디렉션 URI: `https://goldenrabbit-site.vercel.app/admin/oauth/callback`

### 2. 환경 변수 설정

`.env` 파일에 Google Client ID 추가:
```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-actual-google-client-id-here
```

**⚠️ 중요**: `your-google-client-id-here`를 실제 Google Cloud Console에서 생성한 Client ID로 교체해야 합니다.

### 3. 권한 설정

관리자 계정이 다음 Google Drive 폴더에 **편집** 권한을 가져야 합니다:
- `1nQNK776WO84RqCXhwC6reOVPvLojZE9Z` - 07. 골든래빗 도서 교안(PPT)
- `1p1RcwJlrJbIVP7IOpmTfwrY1Eg2SKIsN` - 08. 골든래빗 도서 교안(PPT)

## 사용 방법

### 1. Google Drive 연동

1. 관리자로 `/admin/users` 페이지 접속
2. 우상단 "Drive 연동" 버튼 클릭
3. 팝업에서 Google 계정으로 로그인 (Drive 편집 권한 있는 계정)
4. 필요한 권한 허용
5. 연동 완료 확인

### 2. 교수 승인 시 자동 권한 부여

1. 교수회원 대기 상태인 사용자의 "역할 변경" 클릭
2. "교수"로 역할 변경
3. Google Drive 자료실 권한 부여 섹션에서 "🚀 자동 권한 부여" 클릭
4. 권한 부여 결과 확인
5. "변경" 버튼으로 교수 승인 완료

### 3. 수동 권한 부여 (백업 방식)

자동 권한 부여가 실패하거나 연동이 안 된 경우:
1. 각 폴더 옆의 "📁 수동 권한 설정" 버튼 클릭
2. Google Drive 페이지에서 직접 사용자 이메일에 권한 부여

## 파일 구조

```
/app/lib/
├── google-oauth.ts        # 독립 Google OAuth 시스템
├── google-drive-api.ts    # Google Drive API 유틸리티

/app/admin/
├── users/page.tsx         # 관리자 사용자 관리 페이지 (OAuth 버튼 추가됨)
└── oauth/callback/page.tsx # OAuth 콜백 처리 페이지
```

## 주요 컴포넌트

### GoogleOAuth 클래스
- `startOAuthFlow()`: 팝업 기반 OAuth 플로우 시작
- `exchangeCodeForToken()`: Authorization Code → Access Token 교환
- `getStoredToken()`: 저장된 토큰 조회
- `logout()`: 토큰 무효화 및 로그아웃

### GoogleDriveAPI 클래스
- `getFoldersInfo()`: 여러 폴더 정보 배치 조회
- `grantMultipleFolderPermissions()`: 여러 폴더 권한 일괄 부여
- `checkFolderAccess()`: 폴더 접근 권한 확인

## 보안 고려사항

### 1. 토큰 관리
- Access Token은 브라우저 로컬 스토리지에 저장
- 토큰 만료 시 자동 로그아웃
- 페이지 새로고침 시 토큰 상태 복원

### 2. 권한 검증
- Drive API 호출 시 403/404 에러 적절히 처리
- 관리자만 OAuth 기능 접근 가능
- 폴더 편집 권한 없을 시 자동 권한 부여 실패

### 3. 에러 처리
- 팝업 차단 시 적절한 안내 메시지
- API 호출 실패 시 수동 방식으로 대체
- 네트워크 오류 시 재시도 로직

## 문제 해결

### 1. "Google Client ID가 설정되지 않았습니다" 에러
- `.env` 파일의 `NEXT_PUBLIC_GOOGLE_CLIENT_ID` 확인
- 환경 변수가 올바르게 설정되었는지 확인
- 서버 재시작 후 다시 시도

### 2. "팝업이 차단되었습니다" 에러
- 브라우저 팝업 차단 해제
- 다른 브라우저에서 시도

### 3. "권한 부여 실패" 에러
- 로그인한 Google 계정이 해당 Drive 폴더 편집 권한이 있는지 확인
- Drive 폴더 ID가 올바른지 확인
- Google Drive API 할당량 초과 여부 확인

### 4. OAuth 콜백 실패
- 리디렉션 URI가 Google Cloud Console과 일치하는지 확인
- HTTPS 환경에서 테스트 (localhost는 HTTP 허용)

## 개발 노트

### 현재 구현된 기능
✅ 독립 Google OAuth 시스템  
✅ Google Drive API 유틸리티  
✅ 관리자 페이지 OAuth 연동 UI  
✅ 자동 권한 부여 기능  
✅ 수동 권한 부여 병행 지원  
✅ OAuth 상태 관리  

### 향후 개선 가능 사항
- [ ] 배치 권한 부여 최적화 (현재 순차 처리)
- [ ] 권한 부여 이력 로깅
- [ ] 관리자별 OAuth 세션 관리
- [ ] 폴더 목록 동적 설정 기능

## 테스트 체크리스트

### OAuth 플로우
- [ ] Drive 연동 버튼 클릭 시 팝업 열림
- [ ] Google 로그인 완료 시 연동 상태 표시
- [ ] 페이지 새로고침 후 연동 상태 유지
- [ ] 로그아웃 시 연동 상태 해제

### 자동 권한 부여
- [ ] 연동된 상태에서 자동 권한 부여 버튼 표시
- [ ] 자동 권한 부여 실행 시 결과 표시
- [ ] 권한 부여 성공/실패 상태 정확히 표시

### 수동 권한 부여
- [ ] 미연동 상태에서 수동 권한 설정 버튼 작동
- [ ] Google Drive 페이지 새 창으로 열림
- [ ] 폴더 이름 정확히 표시