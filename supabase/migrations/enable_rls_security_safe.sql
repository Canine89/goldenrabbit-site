-- RLS(Row Level Security) 활성화 및 정책 설정

-- 먼저 기존 정책 제거 (있을 경우)
DROP POLICY IF EXISTS "Anyone can view book store links" ON book_store_links;
DROP POLICY IF EXISTS "Only admins can insert book store links" ON book_store_links;
DROP POLICY IF EXISTS "Only admins can update book store links" ON book_store_links;
DROP POLICY IF EXISTS "Only admins can delete book store links" ON book_store_links;
DROP POLICY IF EXISTS "Only admins can manage order items" ON order_items;
DROP POLICY IF EXISTS "Authenticated users can submit author applications" ON author_applications;
DROP POLICY IF EXISTS "Admins can view all author applications" ON author_applications;
DROP POLICY IF EXISTS "Admins can update all author applications" ON author_applications;
DROP POLICY IF EXISTS "Authenticated users can submit professor applications" ON professor_applications;
DROP POLICY IF EXISTS "Admins can view all professor applications" ON professor_applications;
DROP POLICY IF EXISTS "Admins can update all professor applications" ON professor_applications;

-- 1. book_store_links 테이블 RLS 활성화
ALTER TABLE book_store_links ENABLE ROW LEVEL SECURITY;

-- book_store_links 정책: 모든 사용자가 읽을 수 있음
CREATE POLICY "Anyone can view book store links" ON book_store_links
FOR SELECT USING (true);

-- book_store_links 정책: 인증된 관리자만 관리 가능
CREATE POLICY "Only admins can manage book store links" ON book_store_links
FOR ALL USING (
  auth.uid() IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

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

-- order_items 정책: 관리자는 모든 주문 항목을 볼 수 있음
CREATE POLICY "Admins can view all order items" ON order_items
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- order_items 정책: 서비스 역할만 주문 항목 생성/수정 가능
CREATE POLICY "Service role can manage order items" ON order_items
FOR INSERT WITH CHECK (false); -- 프론트엔드에서 직접 생성 불가, 서버에서만 가능

CREATE POLICY "Service role can update order items" ON order_items
FOR UPDATE USING (false); -- 프론트엔드에서 직접 수정 불가, 서버에서만 가능

CREATE POLICY "Service role can delete order items" ON order_items
FOR DELETE USING (false); -- 프론트엔드에서 직접 삭제 불가, 서버에서만 가능

-- 3. author_applications 테이블 RLS 활성화
ALTER TABLE author_applications ENABLE ROW LEVEL SECURITY;

-- author_applications 정책: 인증된 사용자만 신청서 제출 가능
CREATE POLICY "Authenticated users can submit author applications" ON author_applications
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- author_applications 정책: 관리자는 모든 신청서를 관리할 수 있음
CREATE POLICY "Admins can manage all author applications" ON author_applications
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- 4. professor_applications 테이블 RLS 활성화
ALTER TABLE professor_applications ENABLE ROW LEVEL SECURITY;

-- professor_applications 정책: 인증된 사용자만 신청서 제출 가능
CREATE POLICY "Authenticated users can submit professor applications" ON professor_applications
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- professor_applications 정책: 관리자는 모든 신청서를 관리할 수 있음
CREATE POLICY "Admins can manage all professor applications" ON professor_applications
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);