-- professor_resources 테이블의 book_id 컬럼을 nullable로 변경
ALTER TABLE professor_resources 
ALTER COLUMN book_id DROP NOT NULL;