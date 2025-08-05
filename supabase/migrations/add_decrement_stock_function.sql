-- 원자적 재고 차감 함수 생성
-- 이 함수는 race condition을 방지하고 안전한 재고 관리를 제공합니다

CREATE OR REPLACE FUNCTION decrement_stock(product_id UUID, quantity INTEGER)
RETURNS JSON AS $$
DECLARE
    current_stock INTEGER;
    new_stock INTEGER;
    product_record RECORD;
BEGIN
    -- 🔒 행 잠금을 통한 원자적 연산
    SELECT stock_quantity, name INTO current_stock, product_record
    FROM rabbit_store_products 
    WHERE id = product_id 
    FOR UPDATE;
    
    -- 상품이 존재하지 않는 경우
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Product not found',
            'product_id', product_id
        );
    END IF;
    
    -- 재고가 부족한 경우
    IF current_stock < quantity THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Insufficient stock',
            'product_id', product_id,
            'current_stock', current_stock,
            'requested_quantity', quantity
        );
    END IF;
    
    -- 재고 차감
    new_stock := current_stock - quantity;
    
    UPDATE rabbit_store_products 
    SET 
        stock_quantity = new_stock,
        updated_at = NOW()
    WHERE id = product_id;
    
    -- 성공 응답
    RETURN json_build_object(
        'success', true,
        'product_id', product_id,
        'previous_stock', current_stock,
        'new_stock', new_stock,
        'decremented_quantity', quantity
    );
    
EXCEPTION
    WHEN OTHERS THEN
        -- 예외 발생 시 롤백 및 오류 반환
        RETURN json_build_object(
            'success', false,
            'error', 'Database error: ' || SQLERRM,
            'product_id', product_id
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 함수 사용 권한 설정
GRANT EXECUTE ON FUNCTION decrement_stock(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION decrement_stock(UUID, INTEGER) TO anon;

-- 예시 사용법:
-- SELECT decrement_stock('상품UUID', 2);

-- 테스트용 함수 (개발 환경에서만 사용)
CREATE OR REPLACE FUNCTION test_decrement_stock()
RETURNS VOID AS $$
BEGIN
    -- 테스트 데이터가 있다면 테스트 실행
    -- 실제 운영 환경에서는 이 함수를 삭제하세요
    RAISE NOTICE 'decrement_stock function is ready to use';
END;
$$ LANGUAGE plpgsql;

-- 테스트 실행
SELECT test_decrement_stock();