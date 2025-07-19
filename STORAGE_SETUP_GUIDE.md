# 🗂️ Supabase Storage 설정 가이드

## 📋 현재 상황
- RichTextEditor에서 404 오류 발생
- Storage 버킷이 존재하지 않음
- 일반 사용자 키로는 버킷 생성 불가

## 🎯 해결 방법

### 1️⃣ Supabase 대시보드 접속

1. 브라우저에서 https://supabase.com/dashboard 접속
2. 로그인 후 프로젝트 `mmnifzdktkcynqiuehud` 선택

### 2️⃣ Storage 버킷 생성

**Storage > Buckets 메뉴로 이동:**

#### 'public' 버킷 생성
```
버킷명: public
Public 설정: ✅ 체크 (중요!)
File size limit: 5242880 (5MB)
Allowed MIME types: image/jpeg,image/png,image/gif,image/webp
```

### 3️⃣ RLS 정책 설정

**SQL Editor로 이동하여 다음 SQL 실행:**

```sql
-- 1. 인증된 사용자 업로드 허용
CREATE POLICY "authenticated_users_can_upload_to_public" 
ON storage.objects 
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'public');

-- 2. 모든 사용자 읽기 허용 (Public 버킷이므로)
CREATE POLICY "anyone_can_read_public_bucket" 
ON storage.objects 
FOR SELECT TO public
USING (bucket_id = 'public');

-- 3. 소유자만 삭제 허용
CREATE POLICY "authenticated_users_can_delete_own_files" 
ON storage.objects 
FOR DELETE TO authenticated
USING (bucket_id = 'public' AND auth.uid()::text = owner);

-- 4. 소유자만 수정 허용
CREATE POLICY "authenticated_users_can_update_own_files" 
ON storage.objects 
FOR UPDATE TO authenticated
USING (bucket_id = 'public' AND auth.uid()::text = owner);
```

### 4️⃣ 설정 확인

SQL Editor에서 확인 쿼리 실행:

```sql
-- 버킷 목록 확인
SELECT name, public, created_at FROM storage.buckets;

-- RLS 정책 확인
SELECT policyname, cmd, permissive 
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage';
```

## ✅ 예상 결과

설정 완료 후:
- **ImageUpload 컴포넌트**: ✅ 정상 작동
- **RichTextEditor**: ✅ 이미지 업로드 정상 작동
- **404 오류**: ✅ 해결됨

## 🔧 컴포넌트 설정 확인

현재 두 컴포넌트 모두 `public` 버킷을 사용하도록 설정되어 있습니다:

```javascript
// ImageUpload.jsx (8번째 줄)
bucket = 'public'

// RichTextEditor.jsx (99, 111번째 줄)  
.from('public')
```

## 🚨 중요 사항

1. **Public 설정 필수**: 버킷을 반드시 Public으로 설정해야 합니다
2. **RLS 정책 필수**: 업로드/읽기 권한 설정이 필요합니다
3. **MIME 타입 제한**: 보안을 위해 이미지 파일만 허용합니다

## 🧪 테스트 방법

설정 완료 후 다음 스크립트로 테스트:

```bash
node check-storage.js
```

성공 시 출력:
```
✅ public 버킷이 존재합니다
✅ public 버킷 업로드 성공
```

## 🔍 문제 해결

### "Bucket not found" 오류가 계속 발생하는 경우:
1. 버킷명이 정확히 `public`인지 확인
2. Public 설정이 체크되어 있는지 확인
3. 브라우저 캐시 삭제 후 재시도

### "RLS policy violation" 오류가 발생하는 경우:
1. SQL 정책들이 모두 실행되었는지 확인
2. 정책명에 오타가 없는지 확인
3. `storage.objects` 테이블에 RLS가 활성화되어 있는지 확인

## 📞 추가 지원

설정 후에도 문제가 발생하면:
1. `check-storage.js` 실행 결과 공유
2. 브라우저 개발자 도구 에러 메시지 확인
3. Supabase 대시보드 Logs 메뉴에서 에러 확인