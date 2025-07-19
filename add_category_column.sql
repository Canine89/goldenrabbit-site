-- articles 테이블에 category 컬럼 추가
ALTER TABLE articles 
ADD COLUMN category TEXT;

-- CHECK 제약조건 추가 (허용된 값만 입력되도록 제한)
ALTER TABLE articles 
ADD CONSTRAINT articles_category_check 
CHECK (category IN ('이벤트', '공지사항', '신간소식', '래빗레터'));

-- 카테고리별 조회 성능 향상을 위한 인덱스 생성
CREATE INDEX idx_articles_category ON articles(category);

-- 생성된 컬럼 확인
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'articles' 
AND column_name = 'category';

-- CHECK 제약조건 확인
SELECT 
    constraint_name,
    constraint_type,
    check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc 
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'articles' 
AND tc.constraint_type = 'CHECK';

-- 인덱스 확인
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'articles'
AND indexname = 'idx_articles_category';