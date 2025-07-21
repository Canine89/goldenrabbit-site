-- profiles 테이블에 is_active 컬럼 추가
ALTER TABLE profiles 
ADD COLUMN is_active BOOLEAN DEFAULT true NOT NULL;

-- 기존 사용자들은 모두 활성 상태로 설정
UPDATE profiles 
SET is_active = true 
WHERE is_active IS NULL;

-- 인덱스 추가 (성능 향상을 위해)
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON profiles(is_active);

-- RLS 정책 업데이트 (비활성 사용자는 자신의 정보만 볼 수 있도록)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- 새로운 RLS 정책들
CREATE POLICY "Active profiles are viewable by everyone" ON profiles
  FOR SELECT USING (is_active = true OR auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- 관리자는 모든 프로필을 볼 수 있고 수정할 수 있음
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update all profiles" ON profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );