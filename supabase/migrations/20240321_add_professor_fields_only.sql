-- profiles 테이블에 교수회원 정보 필드 추가
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS full_name text,
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS university text,
ADD COLUMN IF NOT EXISTS department text,
ADD COLUMN IF NOT EXISTS course text,
ADD COLUMN IF NOT EXISTS professor_book_id uuid,
ADD COLUMN IF NOT EXISTS professor_message text,
ADD COLUMN IF NOT EXISTS professor_application_date timestamp with time zone;

-- professor_book_id에 외래키 제약 추가
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_professor_book'
    ) THEN
        ALTER TABLE profiles
        ADD CONSTRAINT fk_professor_book
        FOREIGN KEY (professor_book_id)
        REFERENCES books(id)
        ON DELETE SET NULL;
    END IF;
END $$;

-- 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_profiles_professor_book_id ON profiles(professor_book_id);

-- role 컬럼에 대한 인덱스 추가 (이미 있을 수 있으므로 IF NOT EXISTS 사용)
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);