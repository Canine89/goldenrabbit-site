-- 각 테이블의 구조 확인
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name IN ('book_store_links', 'order_items', 'author_applications', 'professor_applications')
ORDER BY table_name, ordinal_position;