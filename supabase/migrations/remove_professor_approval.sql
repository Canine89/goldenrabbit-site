-- 교수 승인 시스템 제거 - 아무나 교수 자료에 접근 가능하도록 수정

-- professor_applications 테이블에서 승인 관련 컬럼 제거
ALTER TABLE professor_applications 
DROP COLUMN IF EXISTS is_approved,
DROP COLUMN IF EXISTS approved_at,
DROP COLUMN IF EXISTS approved_by;

-- 교수 자료 접근을 위한 RLS 정책 수정 - 모든 사용자가 접근 가능
DROP POLICY IF EXISTS "Public users can view active resources" ON professor_resources;

-- 새로운 정책 - 모든 사용자가 활성화된 자료를 볼 수 있음
CREATE POLICY "Anyone can view active resources" ON professor_resources
  FOR SELECT
  USING (is_active = true);

-- 관리자만 자료 관리 가능한 정책은 유지
-- (이미 존재하는 "Admin users can manage resources" 정책 유지)