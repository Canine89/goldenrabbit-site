-- RLS(Row Level Security) 활성화 및 정책 설정

-- 1. book_store_links 테이블 RLS 활성화
ALTER TABLE book_store_links ENABLE ROW LEVEL SECURITY;

-- book_store_links 정책: 모든 사용자가 읽을 수 있음
CREATE POLICY "Anyone can view book store links" ON book_store_links
FOR SELECT USING (true);

-- book_store_links 정책: 관리자만 삽입/수정/삭제 가능
CREATE POLICY "Only admins can insert book store links" ON book_store_links
FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Only admins can update book store links" ON book_store_links
FOR UPDATE WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Only admins can delete book store links" ON book_store_links
FOR DELETE USING (auth.jwt() ->> 'role' = 'admin');

-- 2. order_items 테이블 RLS 활성화
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- order_items 정책: 사용자는 자신의 주문 항목만 볼 수 있음
CREATE POLICY "Users can view own order items" ON order_items
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id = order_items.order_id 
    AND orders.user_id = auth.uid()
  )
);

-- order_items 정책: 시스템이 주문 처리 시에만 생성 가능 (service role)
CREATE POLICY "Service role can manage order items" ON order_items
FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- 3. author_applications 테이블 RLS 활성화
ALTER TABLE author_applications ENABLE ROW LEVEL SECURITY;

-- author_applications 정책: 사용자는 자신의 신청서만 볼 수 있음
CREATE POLICY "Users can view own author applications" ON author_applications
FOR SELECT USING (user_id = auth.uid());

-- author_applications 정책: 인증된 사용자만 신청서 제출 가능
CREATE POLICY "Authenticated users can submit author applications" ON author_applications
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- author_applications 정책: 사용자는 자신의 신청서만 수정 가능
CREATE POLICY "Users can update own author applications" ON author_applications
FOR UPDATE USING (user_id = auth.uid());

-- author_applications 정책: 관리자는 모든 신청서를 볼 수 있음
CREATE POLICY "Admins can view all author applications" ON author_applications
FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

-- author_applications 정책: 관리자는 모든 신청서를 수정할 수 있음 (상태 변경 등)
CREATE POLICY "Admins can update all author applications" ON author_applications
FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

-- 4. professor_applications 테이블 RLS 활성화
ALTER TABLE professor_applications ENABLE ROW LEVEL SECURITY;

-- professor_applications 정책: 사용자는 자신의 신청서만 볼 수 있음
CREATE POLICY "Users can view own professor applications" ON professor_applications
FOR SELECT USING (user_id = auth.uid());

-- professor_applications 정책: 인증된 사용자만 신청서 제출 가능
CREATE POLICY "Authenticated users can submit professor applications" ON professor_applications
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- professor_applications 정책: 사용자는 자신의 신청서만 수정 가능
CREATE POLICY "Users can update own professor applications" ON professor_applications
FOR UPDATE USING (user_id = auth.uid());

-- professor_applications 정책: 관리자는 모든 신청서를 볼 수 있음
CREATE POLICY "Admins can view all professor applications" ON professor_applications
FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

-- professor_applications 정책: 관리자는 모든 신청서를 수정할 수 있음 (상태 변경 등)
CREATE POLICY "Admins can update all professor applications" ON professor_applications
FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');