-- professor_applications 테이블 생성 (선택사항)
CREATE TABLE IF NOT EXISTS professor_applications (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    name text NOT NULL,
    email text NOT NULL,
    phone text NOT NULL,
    university text NOT NULL,
    department text NOT NULL,
    course text,
    book_id uuid REFERENCES books(id) ON DELETE SET NULL,
    message text,
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_professor_applications_user_id ON professor_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_professor_applications_status ON professor_applications(status);
CREATE INDEX IF NOT EXISTS idx_professor_applications_created_at ON professor_applications(created_at DESC);

-- RLS 정책
ALTER TABLE professor_applications ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 신청만 볼 수 있음
CREATE POLICY "Users can view own applications" ON professor_applications
    FOR SELECT USING (auth.uid() = user_id);

-- 사용자는 자신의 신청을 생성할 수 있음
CREATE POLICY "Users can create own applications" ON professor_applications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 관리자는 모든 신청을 볼 수 있음
CREATE POLICY "Admins can view all applications" ON professor_applications
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );