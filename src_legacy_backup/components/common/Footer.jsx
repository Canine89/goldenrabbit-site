import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* 회사 정보 */}
          <div className="col-span-1">
            <div className="text-xl font-bold text-golden-rabbit-orange mb-4">
              골든래빗
            </div>
            <p className="text-gray-300 text-sm mb-4">
              IT 전문서와 실용서를 통해 더 나은 세상을 만들어가는 골든래빗입니다.
            </p>
            <div className="flex space-x-4">
              {/* 소셜 미디어 링크 */}
              <a href="#" className="text-gray-400 hover:text-golden-rabbit-orange">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-golden-rabbit-orange">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"/>
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-golden-rabbit-orange">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.347-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.746-1.378l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.624 0 11.99-5.367 11.99-11.987C24.007 5.367 18.641.001 12.017.001z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* 빠른 링크 */}
          <div className="col-span-1">
            <h3 className="text-lg font-semibold mb-4">빠른 링크</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/about" className="text-gray-300 hover:text-golden-rabbit-orange">
                  회사소개
                </Link>
              </li>
              <li>
                <Link to="/books" className="text-gray-300 hover:text-golden-rabbit-orange">
                  도서목록
                </Link>
              </li>
              <li>
                <Link to="/articles" className="text-gray-300 hover:text-golden-rabbit-orange">
                  읽을거리
                </Link>
              </li>
              <li>
                <Link to="/events" className="text-gray-300 hover:text-golden-rabbit-orange">
                  이벤트
                </Link>
              </li>
            </ul>
          </div>

          {/* 고객 지원 */}
          <div className="col-span-1">
            <h3 className="text-lg font-semibold mb-4">고객 지원</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/faq" className="text-gray-300 hover:text-golden-rabbit-orange">
                  자주 묻는 질문
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-300 hover:text-golden-rabbit-orange">
                  문의하기
                </Link>
              </li>
              <li>
                <Link to="/author-apply" className="text-gray-300 hover:text-golden-rabbit-orange">
                  저자 신청
                </Link>
              </li>
              <li>
                <Link to="/professor" className="text-gray-300 hover:text-golden-rabbit-orange">
                  교수회원
                </Link>
              </li>
            </ul>
          </div>

          {/* 연락처 */}
          <div className="col-span-1">
            <h3 className="text-lg font-semibold mb-4">연락처</h3>
            <div className="text-sm text-gray-300 space-y-2">
              <p>이메일: info@goldenrabbit.co.kr</p>
              <p>전화: 02-1234-5678</p>
              <p>주소: 서울시 강남구 테헤란로 123</p>
              <p>사업자등록번호: 123-45-67890</p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
          <p>&copy; 2024 골든래빗. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}