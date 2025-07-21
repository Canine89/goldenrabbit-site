-- profiles 테이블에 교수회원 정보 필드 추가
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS university text,
ADD COLUMN IF NOT EXISTS department text,
ADD COLUMN IF NOT EXISTS course text,
ADD COLUMN IF NOT EXISTS professor_book_id uuid,
ADD COLUMN IF NOT EXISTS professor_message text,
ADD COLUMN IF NOT EXISTS professor_application_date timestamp with time zone;

-- professor_book_id에 외래키 제약 추가 (이미 존재하는 경우 무시)
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

-- role 컬럼이 text 타입인 경우 체크 제약 추가/업데이트
DO $$
BEGIN
    -- 기존 체크 제약이 있다면 삭제
    IF EXISTS (
        SELECT 1 FROM information_schema.constraint_column_usage 
        WHERE table_name = 'profiles' 
        AND column_name = 'role' 
        AND constraint_name LIKE '%role%check%'
    ) THEN
        EXECUTE (
            SELECT 'ALTER TABLE profiles DROP CONSTRAINT ' || constraint_name || ';'
            FROM information_schema.table_constraints 
            WHERE table_name = 'profiles' 
            AND constraint_type = 'CHECK'
            AND constraint_name LIKE '%role%'
        );
    END IF;
    
    -- 새로운 체크 제약 추가
    ALTER TABLE profiles 
    ADD CONSTRAINT profiles_role_check 
    CHECK (role IN ('user', 'admin', 'professor', 'professor_pending'));
END $$;

-- 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_professor_book_id ON profiles(professor_book_id);