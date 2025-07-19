-- Articles 테이블에 category 컬럼 추가

-- 방법 1: TEXT 타입 사용 (추천)
ALTER TABLE articles 
ADD COLUMN category TEXT 
CHECK (category IN ('이벤트', '공지사항', '신간소식', '래빗레터'));

-- 인덱스 추가 (카테고리별 조회 성능 향상)
CREATE INDEX idx_articles_category ON articles(category);

-- 방법 2: ENUM 타입 사용 (PostgreSQL에서는 커스텀 타입 생성 필요)
-- CREATE TYPE article_category AS ENUM ('이벤트', '공지사항', '신간소식', '래빗레터');
-- ALTER TABLE articles ADD COLUMN category article_category;