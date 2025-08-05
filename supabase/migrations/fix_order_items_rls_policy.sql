-- order_items 테이블의 RLS 정책 수정
-- 기존 정책 삭제 및 새로운 정책 생성

-- 기존 정책 삭제 (있다면)
DROP POLICY IF EXISTS "order_items_policy" ON order_items;
DROP POLICY IF EXISTS "Users can insert their own order items" ON order_items;
DROP POLICY IF EXISTS "Users can view their own order items" ON order_items;

-- 새로운 정책 생성
-- 1. 인증된 사용자가 자신의 주문에 대한 order_items를 삽입할 수 있도록 허용
CREATE POLICY "order_items_insert_policy" ON order_items
  FOR INSERT 
  WITH CHECK (
    -- 주문이 존재하고, 현재 사용자가 주문자이거나 인증된 사용자인 경우 허용
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND (
        orders.user_id = auth.uid() 
        OR auth.uid() IS NOT NULL  -- 인증된 사용자라면 허용 (게스트 주문 지원)
      )
    )
  );

-- 2. 사용자가 자신의 주문 아이템을 조회할 수 있도록 허용
CREATE POLICY "order_items_select_policy" ON order_items
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND (
        orders.user_id = auth.uid() 
        OR auth.uid() IS NOT NULL  -- 인증된 사용자라면 허용
      )
    )
  );

-- 3. 관리자가 모든 order_items에 접근할 수 있도록 허용
CREATE POLICY "order_items_admin_policy" ON order_items
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- RLS 활성화 확인
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- orders 테이블의 RLS 정책도 확인 및 수정
-- 기존 orders 정책 삭제
DROP POLICY IF EXISTS "orders_policy" ON orders;
DROP POLICY IF EXISTS "Users can insert their own orders" ON orders;
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;

-- 새로운 orders 정책 생성
-- 1. 인증된 사용자가 주문을 생성할 수 있도록 허용
CREATE POLICY "orders_insert_policy" ON orders
  FOR INSERT 
  WITH CHECK (
    auth.uid() IS NOT NULL  -- 인증된 사용자만 주문 생성 가능
  );

-- 2. 사용자가 자신의 주문을 조회할 수 있도록 허용
CREATE POLICY "orders_select_policy" ON orders
  FOR SELECT 
  USING (
    user_id = auth.uid() 
    OR auth.uid() IS NOT NULL  -- 인증된 사용자라면 자신의 주문 조회 가능
  );

-- 3. 사용자가 자신의 주문을 업데이트할 수 있도록 허용 (결제 상태 업데이트용)
CREATE POLICY "orders_update_policy" ON orders
  FOR UPDATE 
  USING (
    user_id = auth.uid() 
    OR auth.uid() IS NOT NULL  -- 인증된 사용자라면 자신의 주문 업데이트 가능
  )
  WITH CHECK (
    user_id = auth.uid() 
    OR auth.uid() IS NOT NULL
  );

-- 4. 관리자가 모든 주문에 접근할 수 있도록 허용
CREATE POLICY "orders_admin_policy" ON orders
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- RLS 활성화 확인
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- 추가: rabbit_store_products 테이블도 확인
-- 상품 조회는 모든 사용자가 가능해야 함
DROP POLICY IF EXISTS "rabbit_store_products_select_policy" ON rabbit_store_products;

CREATE POLICY "rabbit_store_products_select_policy" ON rabbit_store_products
  FOR SELECT 
  USING (is_active = true);  -- 활성화된 상품만 조회 가능

-- 관리자는 모든 상품에 접근 가능
CREATE POLICY "rabbit_store_products_admin_policy" ON rabbit_store_products
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

ALTER TABLE rabbit_store_products ENABLE ROW LEVEL SECURITY;