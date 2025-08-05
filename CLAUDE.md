# 프로젝트 설정

## 언어 설정
이 프로젝트에서는 모든 응답을 **한글**로 작성합니다.

## 프로젝트 정보
- 프로젝트명: 골든래빗 IT 전문서 사이트
- 목적: IT 전문 도서 소개 및 커뮤니티 사이트 개발
- 주요 기능: 도서 소개, 토끼상점(특별상품), 기술 아티클, 커뮤니티, 이벤트

## 기술 스택
- 백엔드: Supabase
- 프론트엔드: Next.js, TypeScript, Tailwind CSS
- 배포: Vercel (자동 배포 설정됨)
- 모바일: 기본적인 반응형 디자인

## 배포 정보
- **플랫폼**: Vercel에 이미 배포 설정 완료
- **자동 배포**: GitHub main 브랜치에 푸시하면 자동으로 빌드 및 배포됨
- **도메인**: Vercel에서 자동 생성된 URL 사용
- **환경변수**: Vercel 대시보드에서 설정 완료
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 도서 카테고리
- 경제경영
- IT전문서
- IT활용서
- 학습만화
- 좋은여름
- 수상작품

## 개발 가이드라인
1. 모든 코드 주석은 한글로 작성
2. 변수명과 함수명은 영어 사용 (표준 관례 준수)
3. UI 텍스트와 메시지는 한글 사용
4. 문서화는 한글로 작성
5. 비용 효율성을 최우선으로 고려
6. **테스트 정책**: 작업 완료 후 자동으로 테스트하지 않음. 사용자가 명시적으로 요청할 때만 테스트 수행
7. **Server Actions 우선 정책**: API 핸들러 대신 Next.js Server Actions를 우선적으로 사용

## Server Actions 개발 가이드라인

### 1. Server Actions 우선 사용
- **원칙**: 새로운 서버 사이드 로직은 API 핸들러(`/api/`) 대신 Server Actions(`/lib/actions/`)를 사용
- **이유**: 타입 안전성, 자동 재검증, 더 나은 성능, 보안 강화

### 2. Server Actions 구조
```
/lib/actions/
├── types.ts          # 공통 타입 정의
├── utils.ts           # 공통 유틸리티 함수 (Supabase 클라이언트, 권한 확인 등)
├── schemas.ts         # Zod 검증 스키마
├── book-actions.ts    # 도서 관리 관련 Server Actions
├── article-actions.ts # 아티클 관리 관련 Server Actions
├── user-actions.ts    # 사용자 관리 관련 Server Actions
└── resource-actions.ts # 교수 자료 관리 관련 Server Actions
```

### 3. Server Actions 작성 규칙
1. **파일 상단에 `'use server'` 지시어 필수**
2. **모든 입력 데이터는 Zod 스키마로 검증**
3. **권한 확인은 `checkAdminPermission()` 등 유틸리티 함수 사용**
4. **일관된 응답 형식**: `ActionResult<T>` 타입 사용
5. **에러 처리**: `createErrorResponse()`, `createSuccessResponse()` 사용
6. **페이지 재검증**: `revalidatePath()` 적절히 사용

### 4. 표준 Server Action 템플릿
```typescript
'use server'

import { revalidatePath } from 'next/cache'
import { Schema } from './schemas'
import { 
  createServerSupabaseClient,
  checkAdminPermission,
  createSuccessResponse,
  createErrorResponse,
  logError
} from './utils'
import { ActionResult } from './types'

export async function actionName(formData: FormData): Promise<ActionResult<T>> {
  try {
    // 권한 확인
    const isAdmin = await checkAdminPermission()
    if (!isAdmin) {
      return createErrorResponse('관리자 권한이 필요합니다')
    }

    // 데이터 변환 및 검증
    const rawData = Object.fromEntries(formData.entries())
    const validatedData = Schema.parse(rawData)

    // Supabase 작업
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('table')
      .insert(validatedData)

    if (error) {
      logError('actionName', error)
      return createErrorResponse('작업에 실패했습니다', error.message)
    }

    // 페이지 재검증
    revalidatePath('/admin/page')
    
    return createSuccessResponse(data, '성공적으로 처리되었습니다')

  } catch (error) {
    logError('actionName', error)
    return createErrorResponse('처리 중 오류가 발생했습니다')
  }
}
```

### 5. 클라이언트에서 Server Actions 사용
```typescript
// useTransition 훅 사용 (로딩 상태 관리)
const [isPending, startTransition] = useTransition()

const handleSubmit = async (formData: FormData) => {
  startTransition(async () => {
    const result = await serverAction(formData)
    
    if (!result.success) {
      setError(result.error)
      return
    }
    
    // 성공 처리
    alert(result.message)
    router.refresh() // 필요시
  })
}
```

### 6. 기존 API 핸들러 마이그레이션 지침
- 기존 `/api/` 경로의 핸들러를 발견하면 Server Actions로 마이그레이션 권장
- 외부 API 호출이나 웹훅 등 특수한 경우만 API 핸들러 유지
- 마이그레이션 시 기능 동등성과 타입 안전성 확보

## 데이터베이스 스키마 변경 시 필수 체크리스트

### 1. TypeScript 인터페이스 업데이트
데이터베이스 테이블에 컬럼을 추가/수정/삭제할 때는 반드시 관련된 모든 TypeScript 인터페이스를 업데이트해야 함

#### 체크 포인트:
- **인터페이스 정의**: 테이블 구조와 일치하는 interface 업데이트
- **FormData 타입**: 관리자 폼에서 사용하는 FormData 인터페이스 업데이트
- **초기화 객체**: formData 초기값, resetForm 함수 등의 객체 초기화 부분
- **API 요청/응답**: 데이터베이스 쿼리 결과를 받는 부분의 타입

#### 주요 파일들:
- `/app/admin/books/page.tsx` - Book, FormData 인터페이스
- `/app/books/[id]/page.tsx` - Book 인터페이스  
- `/app/admin/articles/page.tsx` - Article, FormData 인터페이스
- 기타 해당 테이블을 사용하는 모든 컴포넌트

### 2. 데이터베이스 변경 프로세스
1. **마이그레이션 파일 작성**: `/supabase/migrations/` 폴더에 SQL 파일 생성
2. **TypeScript 인터페이스 업데이트**: 모든 관련 interface 수정
3. **폼 초기화 함수 업데이트**: resetForm, 초기 formData 등
4. **API 엔드포인트 업데이트**: 필요시 백엔드 쿼리 수정
5. **테스트**: 로컬에서 TypeScript 컴파일 확인 (`npm run build`)
6. **배포**: SQL 실행 → 코드 푸시 순서로 진행

### 3. 빌드 오류 방지 체크리스트
- [ ] 새 컬럼이 모든 관련 TypeScript 인터페이스에 추가되었는가?
- [ ] FormData 초기화 객체에 새 필드가 포함되었는가?
- [ ] resetForm 함수에 새 필드 초기값이 설정되었는가?
- [ ] 데이터베이스 쿼리에서 새 컬럼을 select/insert/update 하는가?
- [ ] 선택적(optional) 필드는 `?` 타입으로 정의되었는가?

### 4. 자주 발생하는 오류 패턴
- **"missing properties" 오류**: FormData 인터페이스와 초기화 객체 불일치
- **"Type error" 오류**: 데이터베이스 쿼리 결과와 인터페이스 불일치
- **런타임 오류**: 컬럼이 존재하지 않는데 코드에서 참조하는 경우

### 5. 예시: books 테이블에 새 컬럼 추가
```sql
-- 1. 마이그레이션 파일
ALTER TABLE books ADD COLUMN new_field TEXT;
```

```typescript
// 2. 인터페이스 업데이트
interface Book {
  // ... 기존 필드들
  new_field?: string  // 새 필드 추가
}

interface FormData {
  // ... 기존 필드들  
  new_field: string  // 새 필드 추가
}

// 3. 초기화 객체 업데이트  
const initialFormData = {
  // ... 기존 필드들
  new_field: '',  // 새 필드 초기값
}

// 4. resetForm 함수 업데이트
const resetForm = () => {
  setFormData({
    // ... 기존 필드들
    new_field: '',  // 새 필드 초기값
  })
}
```

## 기능 구분
- **도서 페이지**: 구매 기능 없음, 정보 제공 및 온라인 서점 링크만
- **토끼상점**: 관리자가 등록한 특별 상품 판매 (실제 구매 기능 포함)
- **관리자 모드**: 토끼상점 상품 관리 기능

## 데이터베이스 구조 (Supabase)

### 주요 테이블 구조

#### 1. books (도서)
골든래빗 출간 도서 정보 관리
```sql
- id (uuid, PK): 도서 고유 ID
- title (text): 도서 제목
- author (text): 저자명
- category (text): 카테고리 (경제경영, IT전문서, IT활용서, 학습만화, 좋은여름, 수상작품)
- price (integer): 도서 가격
- description (text): 도서 설명
- publisher_review (text): 출판사 리뷰
- testimonials (text): 추천사
- cover_image_url (text): 표지 이미지 URL
- isbn (text): ISBN 번호
- page_count (integer): 페이지 수
- publication_date (date): 출간일
- table_of_contents (text): 목차
- author_bio (text): 저자 소개
- errata_link (text): 정오표 링크 URL
- error_report_link (text): 오탈자 신고 링크 URL
- is_featured (boolean): 추천 도서 여부
- is_active (boolean): 활성화 상태
- yes24_link, kyobo_link, aladin_link, ridibooks_link: 온라인 서점 링크
- size (text): 도서 크기 (예: 152*225*15mm)
```

#### 2. articles (기술 아티클)
IT 기술 아티클 및 블로그 포스트
```sql
- id (uuid, PK): 아티클 고유 ID
- title (text): 제목
- content (text): 본문 내용
- summary (text): 요약
- author (text): 작성자
- category (text): 카테고리 (기본값: 'Tech')
- featured_image_url (text): 대표 이미지 URL
- is_published (boolean): 발행 상태
- view_count (integer): 조회수
- excerpt (text): 발췌문
- tags (array): 태그 배열
- is_featured (boolean): 추천 글 여부
```

#### 3. profiles (사용자 프로필)
사용자 정보 및 교수 인증 정보
```sql
- id (uuid, PK): 사용자 고유 ID (auth.users 테이블과 연결)
- username (text, unique): 사용자명
- email (text): 이메일
- role (text): 역할 (기본값: 'customer')
- is_active (boolean): 활성화 상태
- phone (text): 전화번호
- university (text): 대학명 (교수용)
- department (text): 학과명 (교수용)
- course (text): 강의명 (교수용)
- professor_book_id (uuid): 교재 도서 ID
- professor_message (text): 교수 메시지
- professor_application_date (timestamptz): 교수 신청일
- full_name (text): 실명
```

#### 4. rabbit_store_products (토끼상점 상품)
관리자가 등록하는 특별 상품
```sql
- id (uuid, PK): 상품 고유 ID
- name (text): 상품명
- description (text): 상품 설명
- price (integer): 가격
- stock_quantity (integer): 재고 수량
- image_url (text): 상품 이미지 URL
- category (text): 카테고리
- is_active (boolean): 판매 활성화 상태
- is_featured (boolean): 추천 상품 여부
```

#### 5. orders (주문)
토끼상점 주문 정보
```sql
- id (uuid, PK): 주문 고유 ID
- user_id (uuid): 주문자 ID
- order_number (text, unique): 주문번호 (예: ORD-20240115-ABC123)
- total_amount (integer): 총 주문 금액
- status (text): 주문 상태 (pending, confirmed, shipped, delivered, cancelled)
- shipping_address (text): 배송 주소
- shipping_postcode (text): 배송지 우편번호
- shipping_note (text): 배송 메모
- customer_name, customer_phone, customer_email: 고객 정보
```

#### 6. order_items (주문 상품)
주문에 포함된 상품 정보
```sql
- id (uuid, PK): 주문 상품 ID
- order_id (uuid): 주문 ID
- product_id (uuid): 상품 ID
- quantity (integer): 수량
- price (integer): 단가
```

#### 7. professor_resources (교수 자료실)
교수용 강의 자료 관리
```sql
- id (uuid, PK): 자료 고유 ID
- book_id (uuid): 관련 도서 ID
- resource_type (text): 자료 유형 (lecture_slides, source_code, book_info, copyright)
- title (text): 자료 제목
- description (text): 자료 설명
- file_url (text): 파일 다운로드 URL
- download_count (integer): 다운로드 횟수
- is_active (boolean): 활성화 상태
```

#### 8. professor_applications (교수 신청)
교수 자료실 이용 신청 관리
```sql
- id (uuid, PK): 신청 고유 ID
- name, email, phone: 신청자 정보
- university, department, position, course: 소속 정보
- book_id (uuid): 교재 도서 ID
- message (text): 신청 메시지
- status (text): 승인 상태 (pending, reviewing, approved, rejected)
- is_approved (boolean): 승인 여부
- approved_at, approved_by: 승인 정보
- user_id (uuid): 연결된 사용자 ID
```

#### 9. community_posts (커뮤니티 게시글)
사용자 커뮤니티 게시판
```sql
- id (uuid, PK): 게시글 ID
- user_id (uuid): 작성자 ID
- title (text): 제목
- content (text): 내용
- category (text): 카테고리 (기본값: 'general')
- view_count, like_count: 조회수, 좋아요 수
```

#### 10. community_comments (커뮤니티 댓글)
게시글 댓글
```sql
- id (uuid, PK): 댓글 ID
- post_id (uuid): 게시글 ID
- user_id (uuid): 작성자 ID
- content (text): 댓글 내용
```

#### 11. events (이벤트)
이벤트 및 공지사항
```sql
- id (uuid, PK): 이벤트 ID
- title (text): 제목
- description (text): 설명
- content (text): 상세 내용
- start_date, end_date: 시작일, 종료일
- featured_image_url: 대표 이미지
- is_active: 활성화 상태
```

#### 12. author_applications (저자 신청)
출간 희망 저자 신청 관리
```sql
- id (uuid, PK): 신청 ID
- name, email, phone: 신청자 정보
- book_title, book_description: 출간 희망 도서 정보
- author_bio: 저자 소개
- status: 승인 상태 (pending, reviewing, approved, rejected)
```

### 주요 관계 (Foreign Keys)
- profiles.id ↔ auth.users.id (Supabase 인증)
- books ↔ professor_resources (도서별 교수 자료)
- books ↔ professor_applications (교재 선택)
- profiles ↔ orders (주문자 정보)
- orders ↔ order_items (주문 상품)
- rabbit_store_products ↔ order_items (상품 정보)
- community_posts ↔ community_comments (게시글-댓글)

## 데이터베이스 변경 이력

### 2025-01-24: orders 테이블 확장 (주문 시스템 개선)
**마이그레이션**: `add_order_number_to_orders`

**변경 내용**:
- `order_number` 컬럼 추가 (TEXT, UNIQUE): 고유 주문번호 (예: ORD-20240115-ABC123)
- `shipping_postcode` 컬럼 추가 (TEXT): 배송지 우편번호
- `shipping_note` 컬럼 추가 (TEXT): 배송 메모
- `idx_orders_order_number` 인덱스 추가: 주문번호 조회 성능 향상

**목적**: 토끼상점 주문 시스템 완성을 위한 필수 필드 추가