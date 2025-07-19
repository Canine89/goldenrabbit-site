-- books 테이블에 온라인 서점 링크 컬럼 추가
ALTER TABLE books
ADD COLUMN yes24_link TEXT DEFAULT NULL,
ADD COLUMN kyobo_link TEXT DEFAULT NULL,
ADD COLUMN aladin_link TEXT DEFAULT NULL,
ADD COLUMN ridibooks_link TEXT DEFAULT NULL;

-- 컬럼에 대한 코멘트 추가 (선택사항)
COMMENT ON COLUMN books.yes24_link IS 'YES24 온라인 서점 도서 링크';
COMMENT ON COLUMN books.kyobo_link IS '교보문고 온라인 서점 도서 링크';
COMMENT ON COLUMN books.aladin_link IS '알라딘 온라인 서점 도서 링크';
COMMENT ON COLUMN books.ridibooks_link IS '리디북스 온라인 서점 도서 링크';