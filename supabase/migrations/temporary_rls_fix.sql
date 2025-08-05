-- 임시 RLS 정책 완화 (게스트 주문 지원용)
-- 개발/테스트 환경에서만 사용하고, 프로덕션에서는 더 엄격한 정책 적용 필요

-- order_items 테이블의 모든 기존 정책 삭제
DROP POLICY IF EXISTS "order_items_insert_policy" ON order_items;
DROP POLICY IF EXISTS "order_items_select_policy" ON order_items;
DROP POLICY IF EXISTS "order_items_admin_policy" ON order_items;
DROP POLICY IF EXISTS "order_items_policy" ON order_items;

-- orders 테이블의 모든 기존 정책 삭제
DROP POLICY IF EXISTS "orders_insert_policy" ON orders;
DROP POLICY IF EXISTS "orders_select_policy" ON orders;
DROP POLICY IF EXISTS "orders_update_policy" ON orders;
DROP POLICY IF EXISTS "orders_admin_policy" ON orders;
DROP POLICY IF EXISTS "orders_policy" ON orders;

-- 임시 관대한 정책 생성 (개발용)
-- order_items: 모든 인증된 요청 허용
CREATE POLICY "order_items_dev_policy" ON order_items
  FOR ALL 
  TO authenticated, anon
  USING (true)
  WITH CHECK (true);

-- orders: 모든 인증된 요청 허용  
CREATE POLICY "orders_dev_policy" ON orders
  FOR ALL 
  TO authenticated, anon
  USING (true)
  WITH CHECK (true);

-- rabbit_store_products: 조회만 허용
DROP POLICY IF EXISTS "rabbit_store_products_select_policy" ON rabbit_store_products;
DROP POLICY IF EXISTS "rabbit_store_products_admin_policy" ON rabbit_store_products;

CREATE POLICY "rabbit_store_products_public_select" ON rabbit_store_products
  FOR SELECT 
  TO authenticated, anon
  USING (true);

-- 관리자 전용 정책
CREATE POLICY "rabbit_store_products_admin_all" ON rabbit_store_products
  FOR ALL 
  TO authenticated
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

-- RLS 활성화 유지
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE rabbit_store_products ENABLE ROW LEVEL SECURITY;