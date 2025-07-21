-- 기존 체크 제약 확인 및 삭제
DO $$
DECLARE
    constraint_name text;
BEGIN
    -- profiles 테이블의 role 관련 체크 제약 찾기
    SELECT conname INTO constraint_name
    FROM pg_constraint
    WHERE conrelid = 'profiles'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) LIKE '%role%';
    
    -- 제약이 있으면 삭제
    IF constraint_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE profiles DROP CONSTRAINT %I', constraint_name);
    END IF;
END $$;

-- 새로운 체크 제약 추가 (professor와 professor_pending 포함)
ALTER TABLE profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('user', 'admin', 'professor', 'professor_pending'));