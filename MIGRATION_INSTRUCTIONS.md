# 온라인 서점 링크 컬럼 추가 마이그레이션 실행 가이드

## 현재 상황
- books 테이블에 온라인 서점 링크 컬럼들이 아직 추가되지 않음
- 마이그레이션 파일: `supabase/migrations/add_online_bookstore_links.sql`
- 추가할 컬럼: yes24_link, kyobo_link, aladin_link, ridibooks_link

## 마이그레이션 실행 방법

### 1. Supabase Dashboard를 통한 실행 (권장)

1. Supabase Dashboard에 로그인: https://supabase.com/dashboard
2. 프로젝트 선택: mmnifzdktkcynqiuehud
3. 왼쪽 메뉴에서 "SQL Editor" 클릭
4. 아래 SQL을 복사해서 붙여넣기:

```sql
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
```

5. "Run" 버튼 클릭

### 2. psql을 통한 실행 (대안)

터미널에서 다음 명령어 실행:

```bash
# 마이그레이션 파일 실행
psql "postgresql://postgres.mmnifzdktkcynqiuehud:[PASSWORD]@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres" -f supabase/migrations/add_online_bookstore_links.sql
```

## 마이그레이션 완료 확인

마이그레이션 실행 후 다음 SQL로 테이블 구조 확인:

```sql
-- books 테이블 구조 확인
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'books'
AND table_schema = 'public'
ORDER BY ordinal_position;
```

## 예상 결과

마이그레이션 성공 시 books 테이블에 다음 컬럼들이 추가됩니다:
- yes24_link (TEXT, nullable)
- kyobo_link (TEXT, nullable)
- aladin_link (TEXT, nullable)
- ridibooks_link (TEXT, nullable)

## 사용 예시

마이그레이션 완료 후 도서에 온라인 서점 링크를 추가할 수 있습니다:

```sql
-- 예시: 도서에 온라인 서점 링크 추가
UPDATE books 
SET 
  yes24_link = 'https://www.yes24.com/Product/Goods/123456',
  kyobo_link = 'https://product.kyobobook.co.kr/detail/S000123456',
  aladin_link = 'https://www.aladin.co.kr/shop/wproduct.aspx?ItemId=123456',
  ridibooks_link = 'https://ridibooks.com/books/123456'
WHERE id = 'book-uuid-here';
```