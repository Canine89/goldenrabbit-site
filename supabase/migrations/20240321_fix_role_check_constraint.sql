-- 1. 먼저 현재 role 값들 확인
SELECT DISTINCT role, COUNT(*) 
FROM profiles 
GROUP BY role;

-- 2. 잘못된 role 값들을 'user'로 업데이트 (필요한 경우)
UPDATE profiles 
SET role = 'user' 
WHERE role NOT IN ('user', 'admin', 'professor', 'professor_pending');

-- 3. 기존 체크 제약 삭제
DO $$
DECLARE
    constraint_name text;
BEGIN
    -- profiles 테이블의 role 관련 체크 제약 찾기
    FOR constraint_name IN 
        SELECT conname 
        FROM pg_constraint
        WHERE conrelid = 'profiles'::regclass
        AND contype = 'c'
        AND pg_get_constraintdef(oid) LIKE '%role%'
    LOOP
        EXECUTE format('ALTER TABLE profiles DROP CONSTRAINT %I', constraint_name);
    END LOOP;
END $$;

-- 4. 새로운 체크 제약 추가
ALTER TABLE profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('user', 'admin', 'professor', 'professor_pending'));