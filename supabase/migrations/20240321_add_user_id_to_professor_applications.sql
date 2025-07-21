-- professor_applications 테이블에 user_id 컬럼 추가
ALTER TABLE professor_applications
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_professor_applications_user_id ON professor_applications(user_id);