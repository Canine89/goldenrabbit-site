# Supabase Storage 설정 가이드

## 문제 상황
현재 일반 사용자 키(anon key)로는 Storage 버킷을 생성할 수 없습니다. RLS 정책으로 인해 접근이 차단되고 있습니다.

## 해결 방법

Supabase 대시보드에서 다음 작업을 수행해야 합니다:

### 1. 대시보드 접속
- https://supabase.com/dashboard 접속
- 프로젝트 선택: `mmnifzdktkcynqiuehud`

### 2. Storage 버킷 생성

**Storage > Buckets 메뉴에서:**

1. **'public' 버킷 생성**
   - 버킷명: `public`
   - Public 설정: ✅ 체크
   - File size limit: `5242880` (5MB)
   - Allowed MIME types: `image/jpeg,image/png,image/gif,image/webp`

2. **'images' 버킷 생성 (옵션)**
   - 버킷명: `images`  
   - Public 설정: ✅ 체크
   - File size limit: `5242880` (5MB)
   - Allowed MIME types: `image/jpeg,image/png,image/gif,image/webp`

### 3. RLS 정책 설정

**SQL Editor에서 다음 SQL 실행:**

```sql
-- 1. Storage objects table에 RLS 정책 생성
-- 인증된 사용자가 public 버킷에 파일 업로드 허용
CREATE POLICY "authenticated_users_can_upload_to_public" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'public');

-- 모든 사용자가 public 버킷의 파일 읽기 허용
CREATE POLICY "anyone_can_read_public_bucket" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'public');

-- 인증된 사용자가 자신이 업로드한 파일 삭제 허용
CREATE POLICY "authenticated_users_can_delete_own_files" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'public' AND auth.uid()::text = owner);

-- 인증된 사용자가 자신이 업로드한 파일 수정 허용
CREATE POLICY "authenticated_users_can_update_own_files" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'public' AND auth.uid()::text = owner);
```

### 4. 추가 정책 (images 버킷용 - 선택사항)

```sql
-- images 버킷에 대한 정책들
CREATE POLICY "authenticated_users_can_upload_to_images" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'images');

CREATE POLICY "anyone_can_read_images_bucket" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'images');

CREATE POLICY "authenticated_users_can_delete_own_images" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'images' AND auth.uid()::text = owner);

CREATE POLICY "authenticated_users_can_update_own_images" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'images' AND auth.uid()::text = owner);
```

### 5. 검증 쿼리

설정 완료 후 다음 쿼리로 확인:

```sql
-- 버킷 목록 확인
SELECT * FROM storage.buckets;

-- RLS 정책 확인
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage';
```

## 컴포넌트 설정

현재 컴포넌트들은 다음과 같이 설정되어 있습니다:

- **ImageUpload 컴포넌트**: `public` 버킷 사용 (기본값)
- **RichTextEditor 컴포넌트**: `public` 버킷 사용 (하드코딩됨)

RichTextEditor에서 `images` 버킷을 사용하려면 99번째 줄을 수정해야 합니다:

```javascript
// 현재 (99번째 줄)
.from('public')

// 변경하려면
.from('images')
```

## 권장 설정

**가장 간단한 방법:**
1. `public` 버킷만 생성
2. 모든 컴포넌트에서 `public` 버킷 사용
3. 폴더 구조로 구분 (`public/images/`, `public/documents/` 등)

이렇게 설정하면 ImageUpload와 RichTextEditor 모두 정상 작동합니다.