# 골든래빗 IT 전문서 웹사이트

골든래빗 IT 전문서 출판사의 공식 웹사이트입니다.

## 🚀 기술 스택

- **Frontend**: React 18 + Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Database**: Supabase
- **Routing**: React Router v6
- **Deployment**: Vercel (예정)

## 📁 프로젝트 구조

```
src/
├── components/
│   ├── common/          # 공통 컴포넌트
│   ├── book/           # 도서 관련 컴포넌트
│   ├── layout/         # 레이아웃 컴포넌트
│   └── admin/          # 관리자 컴포넌트
├── pages/              # 페이지 컴포넌트
├── hooks/              # 커스텀 훅
├── lib/                # 라이브러리 설정
├── store/              # 상태 관리
└── index.css           # 전역 스타일
```

## 🛠️ 개발 환경 설정

### 1. 프로젝트 클론 및 의존성 설치

```bash
git clone <repository-url>
cd goldenrabbit_site
npm install
```

### 2. 환경 변수 설정

`.env.example`을 참고하여 `.env` 파일 생성:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Supabase 설정

1. [Supabase](https://supabase.com) 프로젝트 생성
2. `supabase-schema.sql` 파일의 내용을 SQL 에디터에서 실행
3. `sample-data.sql` 파일의 내용을 실행하여 샘플 데이터 추가

### 4. 개발 서버 실행

```bash
npm run dev
```

## 🎨 주요 기능

### 도서 관리
- 도서 목록 조회 및 카테고리별 분류
- 도서 상세 정보 제공
- 온라인 서점 링크 연결

### 토끼상점
- 특별 상품 판매
- 장바구니 기능
- 주문 관리

### 커뮤니티
- 묘공단 커뮤니티
- 아티클 게시
- 이벤트 관리

### 관리자 기능
- 도서 정보 관리
- 토끼상점 상품 관리
- 주문 관리
- 사용자 관리

## 📱 반응형 디자인

- 모바일 우선 설계
- 태블릿 및 데스크톱 최적화
- 기본적인 반응형 기능 구현

## 🎯 배포

### Vercel 배포
```bash
npm run build
```

빌드된 파일을 Vercel에 배포합니다.

## 🔒 보안

- Supabase RLS (Row Level Security) 적용
- 사용자 인증 및 권한 관리
- 안전한 API 키 관리

## 📋 개발 가이드라인

1. 모든 코드 주석은 한글로 작성
2. 변수명과 함수명은 영어 사용
3. UI 텍스트는 한글 사용
4. 비용 효율성을 최우선으로 고려

## 🚧 향후 계획

- [ ] 사용자 인증 시스템 구현
- [ ] 도서 검색 기능 강화
- [ ] 결제 시스템 연동
- [ ] 관리자 대시보드 완성
- [ ] 성능 최적화
- [ ] PWA 기능 추가

## 📞 문의

기술적 문의사항은 이슈를 등록해 주세요.

---

© 2024 골든래빗. All rights reserved.