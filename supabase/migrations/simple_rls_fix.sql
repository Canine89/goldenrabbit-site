-- 간단한 RLS 정책 수정 (개발용)
-- 이 스크립트를 Supabase 대시보드 SQL Editor에서 실행하세요

-- 1. 기존 정책들 모두 삭제
DROP POLICY IF EXISTS "order_items_policy" ON order_items;
DROP POLICY IF EXISTS "order_items_insert_policy" ON order_items;
DROP POLICY IF EXISTS "order_items_select_policy" ON order_items;
DROP POLICY IF EXISTS "order_items_admin_policy" ON order_items;
DROP POLICY IF EXISTS "order_items_dev_policy" ON order_items;

DROP POLICY IF EXISTS "orders_policy" ON orders;
DROP POLICY IF EXISTS "orders_insert_policy" ON orders;
DROP POLICY IF EXISTS "orders_select_policy" ON orders;
DROP POLICY IF EXISTS "orders_update_policy" ON orders;
DROP POLICY IF EXISTS "orders_admin_policy" ON orders;
DROP POLICY IF EXISTS "orders_dev_policy" ON orders;

-- 2. 관대한 정책 생성 (개발용)
-- orders 테이블: 모든 인증된 사용자가 접근 가능
CREATE POLICY "orders_allow_all" ON orders
  FOR ALL 
  USING (true)
  WITH CHECK (true);

-- order_items 테이블: 모든 인증된 사용자가 접근 가능
CREATE POLICY "order_items_allow_all" ON order_items
  FOR ALL 
  USING (true)
  WITH CHECK (true);

-- 3. RLS 활성화 확인
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- 4. 참고: 상품 테이블은 조회만 허용
DROP POLICY IF EXISTS "rabbit_store_products_select_policy" ON rabbit_store_products;
DROP POLICY IF EXISTS "rabbit_store_products_admin_policy" ON rabbit_store_products;
DROP POLICY IF EXISTS "rabbit_store_products_public_select" ON rabbit_store_products;
DROP POLICY IF EXISTS "rabbit_store_products_admin_all" ON rabbit_store_products;

CREATE POLICY "products_public_read" ON rabbit_store_products
  FOR SELECT 
  USING (true);

CREATE POLICY "products_admin_all" ON rabbit_store_products
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