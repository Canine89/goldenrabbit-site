-- orders 테이블에 order_number 컬럼 추가
ALTER TABLE orders 
ADD COLUMN order_number TEXT UNIQUE;

-- order_number에 인덱스 추가 (조회 성능 향상)
CREATE INDEX idx_orders_order_number ON orders(order_number);

-- 기존 주문들에 대한 주문번호 생성 (있을 경우)
UPDATE orders 
SET order_number = 'ORD-' || TO_CHAR(created_at, 'YYYYMMDD') || '-' || UPPER(SUBSTR(MD5(id::text), 1, 6))
WHERE order_number IS NULL;

-- 향후에는 order_number를 NOT NULL로 만들 수 있음
-- ALTER TABLE orders ALTER COLUMN order_number SET NOT NULL;

-- 주문 관련 추가 컬럼들
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS shipping_postcode TEXT,
ADD COLUMN IF NOT EXISTS shipping_note TEXT;

-- 컬럼 설명 추가
COMMENT ON COLUMN orders.order_number IS '주문번호 (예: ORD-20240115-ABC123)';
COMMENT ON COLUMN orders.shipping_postcode IS '배송지 우편번호';
COMMENT ON COLUMN orders.shipping_note IS '배송 메모';