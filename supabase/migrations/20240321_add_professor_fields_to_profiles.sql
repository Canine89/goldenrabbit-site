-- profiles 테이블에 교수회원 정보 필드 추가
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS university text,
ADD COLUMN IF NOT EXISTS department text,
ADD COLUMN IF NOT EXISTS course text,
ADD COLUMN IF NOT EXISTS professor_book_id uuid,
ADD COLUMN IF NOT EXISTS professor_message text,
ADD COLUMN IF NOT EXISTS professor_application_date timestamp with time zone;

-- professor_book_id에 외래키 제약 추가
ALTER TABLE profiles
ADD CONSTRAINT fk_professor_book
FOREIGN KEY (professor_book_id)
REFERENCES books(id)
ON DELETE SET NULL;

-- role enum 타입 업데이트 (professor_pending 추가)
DO $$ 
BEGIN
    -- RLS 정책들을 임시 저장
    CREATE TEMP TABLE temp_policies AS
    SELECT 
        schemaname,
        tablename,
        policyname,
        permissive,
        roles,
        cmd,
        qual,
        with_check
    FROM pg_policies
    WHERE tablename IN ('profiles', 'book_store_links', 'books', 'rabbit_store_products', 'professor_resources')
    AND qual::text LIKE '%role%';

    -- 관련 정책들 삭제
    DROP POLICY IF EXISTS "Only admins can manage book store links" ON book_store_links;
    DROP POLICY IF EXISTS "Only admins can manage books" ON books;
    DROP POLICY IF EXISTS "Only admins can manage products" ON rabbit_store_products;
    DROP POLICY IF EXISTS "Only admins can manage professor resources" ON professor_resources;
    
    -- 기존 enum 값들을 임시로 저장
    CREATE TEMP TABLE temp_roles AS
    SELECT id, role FROM profiles;
    
    -- role 컬럼을 text로 변경
    ALTER TABLE profiles ALTER COLUMN role TYPE text;
    
    -- enum 타입 재생성
    DROP TYPE IF EXISTS user_role CASCADE;
    CREATE TYPE user_role AS ENUM ('user', 'admin', 'professor', 'professor_pending');
    
    -- 컬럼 타입을 새로운 enum으로 변경
    ALTER TABLE profiles ALTER COLUMN role TYPE user_role USING role::user_role;
    
    -- 기본값 설정
    ALTER TABLE profiles ALTER COLUMN role SET DEFAULT 'user'::user_role;
    
    -- RLS 정책들 재생성
    CREATE POLICY "Only admins can manage book store links" ON book_store_links
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

    CREATE POLICY "Only admins can manage books" ON books
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

    CREATE POLICY "Only admins can manage products" ON rabbit_store_products
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

    CREATE POLICY "Only admins can manage professor resources" ON professor_resources
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );
END $$;

-- 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_professor_book_id ON profiles(professor_book_id);