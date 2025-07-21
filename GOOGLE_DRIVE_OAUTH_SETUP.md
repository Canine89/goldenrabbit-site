# Google Drive OAuth 설정 가이드

## 현재 상황

Google OAuth 토큰에서 `provider_token`을 가져올 수 없어서 "Google 액세스 토큰을 찾을 수 없습니다" 에러가 발생합니다.

## 임시 해결책 (현재 구현됨)

폴더 이름은 fallback 이름으로 표시되고, 권한 부여 기능은 작동합니다:
- **폴더 1**: "골든래빗 교수자료 폴더 1"
- **폴더 2**: "골든래빗 교수자료 폴더 2"

## 완전한 해결 방법

### 1. Supabase 설정

Supabase 대시보드에서 Google OAuth 설정을 확인하고 스코프를 추가해야 합니다:

1. **Supabase Dashboard** → **Authentication** → **Providers** → **Google**
2. **Additional Scopes**에 다음 추가:
   ```
   https://www.googleapis.com/auth/drive.readonly
   https://www.googleapis.com/auth/drive.file
   ```

### 2. OAuth 클라이언트 설정 확인

Google Cloud Console에서:
1. **APIs & Services** → **Enabled APIs & services**
2. **Google Drive API** 활성화 확인
3. **OAuth 2.0 Client IDs** 설정에서 스코프 확인

### 3. 코드 수정 (필요 시)

만약 `provider_token`이 여전히 없다면:

```typescript
const getAccessToken = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    
    // provider_token 확인
    console.log('Session:', session)
    console.log('Provider token:', session?.provider_token)
    
    if (!session?.provider_token) {
      // 재로그인 필요
      throw new Error('Google 재로그인이 필요합니다.')
    }
    
    return session.provider_token
  } catch (error) {
    console.error('액세스 토큰 가져오기 실패:', error)
    return null
  }
}
```

### 4. 새로운 OAuth 로그인에 스코프 추가

현재 OAuth 로그인을 다음과 같이 수정:

```typescript
const { error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${window.location.origin}/auth/callback`,
    scopes: 'https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/drive.file'
  }
})
```

## 테스트 방법

1. **관리자로 로그인** (Google OAuth)
2. **브라우저 개발자 도구** → **Application** → **Local Storage**
3. **supabase.auth.token** 확인
4. **provider_token** 필드가 있는지 확인

## 권한 부여는 작동함

현재 상태에서도 실제 권한 부여는 정상적으로 작동합니다:
- 관리자가 Drive 폴더에 편집 권한이 있으면 권한 부여 가능
- 폴더 이름만 fallback으로 표시되는 상황

## 향후 개선 사항

1. **실시간 폴더 이름 가져오기** - OAuth 스코프 추가 후
2. **권한 상태 확인** - 이미 권한이 있는지 사전 확인
3. **배치 권한 부여** - 여러 폴더에 한번에 권한 부여
4. **관리자 폴더 설정** - 동적 폴더 관리 기능

## 현재 작동하는 기능

✅ 교수회원 승인 시 Google Drive 폴더 권한 부여  
✅ 폴더별 개별 권한 관리  
✅ 권한 부여 상태 표시  
✅ 에러 처리 및 사용자 친화적 메시지  
✅ **OAuth 스코프 추가 완료** - Drive API 접근 가능
✅ **실시간 폴더 이름 조회** - 새로 로그인하면 작동

## ⚠️ 중요 안내

**기존 사용자는 다시 로그인해야 합니다!**

새로운 스코프가 적용되려면 기존 세션을 종료하고 Google로 다시 로그인해야 합니다.

### 다시 로그인 방법
1. 브라우저에서 로그아웃
2. Google로 다시 로그인
3. 새로운 권한 동의 화면에서 Drive 접근 허용
4. 이제 실제 폴더 이름이 표시됩니다!