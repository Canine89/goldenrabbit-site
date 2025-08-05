-- rabbit_store_products 테이블에 is_featured 컬럼 추가
-- 추천 상품 여부를 표시하기 위한 컬럼

ALTER TABLE rabbit_store_products 
ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false;

-- 기존 데이터에 대해 기본값 설정
UPDATE rabbit_store_products 
SET is_featured = false 
WHERE is_featured IS NULL;

-- 컬럼에 NOT NULL 제약 조건 추가
ALTER TABLE rabbit_store_products 
ALTER COLUMN is_featured SET NOT NULL;

-- 인덱스 추가 (추천 상품 조회 성능 향상)
CREATE INDEX IF NOT EXISTS idx_rabbit_store_products_is_featured 
ON rabbit_store_products(is_featured) 
WHERE is_featured = true;

-- 코멘트 추가
COMMENT ON COLUMN rabbit_store_products.is_featured IS '추천 상품 여부';