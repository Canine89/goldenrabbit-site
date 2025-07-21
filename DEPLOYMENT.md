# 골든래빗 사이트 Vercel 배포 가이드

## 🚀 배포 준비 완료 상태

✅ Next.js 15 + TypeScript 구조로 마이그레이션 완료
✅ Vercel 설정 최적화 완료
✅ 환경변수 설정 준비 완료
✅ Git 커밋 완료

## 📋 Vercel 배포 단계

### 1. GitHub 연동 확인
```bash
git push origin main  # 최신 변경사항 푸시
```

### 2. Vercel 환경변수 설정

**Vercel 대시보드 → 프로젝트 → Settings → Environment Variables**

다음 환경변수를 **Production, Preview, Development** 모두에 추가:

#### 필수 환경변수
```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

#### 선택사항 (Google Docs API 기능용)
```
VITE_GOOGLE_CLIENT_ID=your-google-client-id
VITE_GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### 3. Supabase 데이터베이스 마이그레이션

**Supabase 대시보드 → SQL Editor**에서 다음 파일들을 순서대로 실행:

1. **`supabase/migrations/add_is_active_to_profiles.sql`**
   ```sql
   -- profiles 테이블에 is_active 컬럼 추가
   ALTER TABLE profiles 
   ADD COLUMN is_active BOOLEAN DEFAULT true NOT NULL;
   
   -- 기존 사용자들은 모두 활성 상태로 설정
   UPDATE profiles 
   SET is_active = true 
   WHERE is_active IS NULL;
   ```

2. **`supabase/migrations/make_book_id_nullable.sql`**
   ```sql
   -- professor_resources 테이블의 book_id 컬럼을 nullable로 변경
   ALTER TABLE professor_resources 
   ALTER COLUMN book_id DROP NOT NULL;
   ```

### 4. Google Cloud Console 설정 (선택사항)

Google Docs 기능을 사용할 경우:
- **Google Cloud Console → APIs & Services → Credentials**
- OAuth 2.0 클라이언트의 **승인된 리디렉션 URI**에 추가:
  ```
  https://your-app.vercel.app/oauth2callback
  ```

### 5. 배포 실행

Vercel이 자동으로 감지하는 설정:
- **프레임워크**: Next.js
- **빌드 명령어**: `next build`
- **출력 디렉토리**: `.next`
- **Node.js 버전**: 18.x

## 🔍 배포 후 확인사항

### 1. 기본 기능 테스트
- [ ] 홈페이지 로딩 (`/`)
- [ ] 도서 목록 (`/books`)
- [ ] 교수 자료실 (`/professor/resources`)
- [ ] 로그인/로그아웃 기능

### 2. 관리자 기능 테스트
- [ ] 관리자 로그인
- [ ] 도서 관리 (`/admin/books`)
- [ ] 사용자 관리 (`/admin/users`)
- [ ] 교수자료 관리 (`/admin/professor-resources`)

### 3. 데이터베이스 연결 확인
- [ ] Supabase 연결 정상
- [ ] 로그인/가입 기능
- [ ] 데이터 CRUD 작업

### 4. 이미지 및 파일 처리
- [ ] 도서 표지 이미지 표시
- [ ] Google Drive 이미지 최적화
- [ ] 파일 다운로드 기능

## 🚨 문제 해결

### 환경변수 문제
- Vercel 환경변수가 올바르게 설정되었는지 확인
- 배포 후 다시 배포 필요할 수 있음

### 데이터베이스 연결 오류
- Supabase URL과 키가 정확한지 확인
- RLS 정책이 올바르게 설정되었는지 확인

### 빌드 오류
```bash
# 로컬에서 빌드 테스트
npm run build
npm start
```

### CSP 헤더 문제
- 새로운 외부 서비스 사용 시 `vercel.json`의 CSP 업데이트 필요

## 📞 지원

문제가 발생할 경우:
1. Vercel 대시보드 → Functions → Logs 확인
2. Supabase 대시보드 → Logs 확인
3. 브라우저 개발자 도구 → Console 확인

배포 완료 후 이 가이드에 따라 모든 기능이 정상 작동하는지 확인하세요!