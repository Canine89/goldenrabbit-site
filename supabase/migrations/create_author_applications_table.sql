-- 저자 신청 테이블 생성
CREATE TABLE IF NOT EXISTS author_applications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  book_title TEXT NOT NULL,
  book_description TEXT NOT NULL,
  author_bio TEXT NOT NULL,
  portfolio_url TEXT,
  experience TEXT,
  motivation TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'approved', 'rejected')),
  is_approved BOOLEAN DEFAULT false,
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id),
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_author_applications_status ON author_applications(status);
CREATE INDEX IF NOT EXISTS idx_author_applications_created_at ON author_applications(created_at);
CREATE INDEX IF NOT EXISTS idx_author_applications_email ON author_applications(email);

-- RLS 정책 설정
ALTER TABLE author_applications ENABLE ROW LEVEL SECURITY;

-- 공개 읽기 권한 (누구나 신청 가능)
CREATE POLICY "Anyone can insert author applications" ON author_applications
  FOR INSERT WITH CHECK (true);

-- 관리자만 조회/수정 가능
CREATE POLICY "Admin can view all author applications" ON author_applications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admin can update author applications" ON author_applications
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- 테이블 코멘트
COMMENT ON TABLE author_applications IS '저자 신청서 관리 테이블';
COMMENT ON COLUMN author_applications.name IS '신청자 이름';
COMMENT ON COLUMN author_applications.email IS '신청자 이메일';
COMMENT ON COLUMN author_applications.phone IS '신청자 전화번호';
COMMENT ON COLUMN author_applications.book_title IS '집필 희망 도서 제목';
COMMENT ON COLUMN author_applications.book_description IS '도서 개요 및 특징';
COMMENT ON COLUMN author_applications.author_bio IS '저자 소개';
COMMENT ON COLUMN author_applications.portfolio_url IS '포트폴리오 URL (선택사항)';
COMMENT ON COLUMN author_applications.experience IS '관련 경험 및 전문성 (선택사항)';
COMMENT ON COLUMN author_applications.motivation IS '집필 동기 및 목표 (선택사항)';
COMMENT ON COLUMN author_applications.status IS '신청 상태 (pending, reviewing, approved, rejected)';
COMMENT ON COLUMN author_applications.is_approved IS '승인 여부';
COMMENT ON COLUMN author_applications.approved_at IS '승인 일시';
COMMENT ON COLUMN author_applications.approved_by IS '승인한 관리자 ID';
COMMENT ON COLUMN author_applications.admin_notes IS '관리자 메모';