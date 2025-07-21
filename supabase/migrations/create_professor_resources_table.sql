-- 교수회원 자료 테이블 생성
CREATE TABLE IF NOT EXISTS professor_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('lecture_slides', 'source_code', 'book_info', 'copyright')),
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT,
  download_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스 생성
CREATE INDEX idx_professor_resources_book_id ON professor_resources(book_id);
CREATE INDEX idx_professor_resources_type ON professor_resources(resource_type);
CREATE INDEX idx_professor_resources_active ON professor_resources(is_active);

-- RLS 활성화
ALTER TABLE professor_resources ENABLE ROW LEVEL SECURITY;

-- RLS 정책 - 모든 사용자가 활성화된 자료를 볼 수 있음
CREATE POLICY "Public users can view active resources" ON professor_resources
  FOR SELECT
  USING (is_active = true);

-- RLS 정책 - 관리자만 모든 작업 가능
CREATE POLICY "Admin users can manage resources" ON professor_resources
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- 교수회원 프로필에 승인 여부 필드 추가 (이미 있는 경우 무시)
ALTER TABLE professor_applications 
ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id);

-- 교수회원 다운로드 기록 테이블
CREATE TABLE IF NOT EXISTS professor_resource_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID NOT NULL REFERENCES professor_resources(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  downloaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 다운로드 수 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_download_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE professor_resources
  SET download_count = download_count + 1
  WHERE id = NEW.resource_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_download_count_trigger
AFTER INSERT ON professor_resource_downloads
FOR EACH ROW
EXECUTE FUNCTION update_download_count();