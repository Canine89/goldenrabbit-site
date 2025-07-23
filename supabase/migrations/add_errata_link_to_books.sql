-- books 테이블에 정오표 링크와 오탈자 신고 링크 컬럼 추가
ALTER TABLE books 
ADD COLUMN errata_link TEXT,
ADD COLUMN error_report_link TEXT;

-- 컬럼에 대한 코멘트 추가
COMMENT ON COLUMN books.errata_link IS '정오표 링크 URL';
COMMENT ON COLUMN books.error_report_link IS '오탈자 신고 링크 URL';