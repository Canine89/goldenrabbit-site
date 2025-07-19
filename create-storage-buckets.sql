-- Supabase Storage 버킷 생성 및 정책 설정 SQL
-- 이 SQL을 Supabase 대시보드의 SQL Editor에서 실행하세요

-- 1. 'public' 버킷 생성 (ImageUpload 컴포넌트용)
INSERT INTO storage.buckets (id, name, public)
VALUES ('public', 'public', true)
ON CONFLICT (id) DO NOTHING;

-- 2. 'images' 버킷 생성 (RichTextEditor 컴포넌트용)  
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- 3. public 버킷에 대한 SELECT 정책 (파일 조회 허용)
CREATE POLICY "Public bucket select policy" ON storage.objects
FOR SELECT USING (bucket_id = 'public');

-- 4. public 버킷에 대한 INSERT 정책 (파일 업로드 허용)
CREATE POLICY "Public bucket insert policy" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'public');

-- 5. public 버킷에 대한 UPDATE 정책 (파일 수정 허용)
CREATE POLICY "Public bucket update policy" ON storage.objects
FOR UPDATE USING (bucket_id = 'public');

-- 6. public 버킷에 대한 DELETE 정책 (파일 삭제 허용)
CREATE POLICY "Public bucket delete policy" ON storage.objects
FOR DELETE USING (bucket_id = 'public');

-- 7. images 버킷에 대한 SELECT 정책 (파일 조회 허용)
CREATE POLICY "Images bucket select policy" ON storage.objects
FOR SELECT USING (bucket_id = 'images');

-- 8. images 버킷에 대한 INSERT 정책 (파일 업로드 허용)
CREATE POLICY "Images bucket insert policy" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'images');

-- 9. images 버킷에 대한 UPDATE 정책 (파일 수정 허용)
CREATE POLICY "Images bucket update policy" ON storage.objects
FOR UPDATE USING (bucket_id = 'images');

-- 10. images 버킷에 대한 DELETE 정책 (파일 삭제 허용)
CREATE POLICY "Images bucket delete policy" ON storage.objects
FOR DELETE USING (bucket_id = 'images');

-- 11. 버킷 목록 조회 확인
SELECT id, name, public, created_at 
FROM storage.buckets 
ORDER BY created_at;

-- 12. 정책 목록 확인
SELECT policyname, tablename, cmd, qual
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
ORDER BY policyname;