-- books 테이블에 size 컬럼 추가
ALTER TABLE books ADD COLUMN IF NOT EXISTS size TEXT;

-- size 컬럼에 대한 코멘트 추가
COMMENT ON COLUMN books.size IS '도서 크기 정보 (예: 152*225*15mm)';