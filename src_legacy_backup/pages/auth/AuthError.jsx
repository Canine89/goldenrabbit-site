import { Link } from 'react-router-dom'

const AuthError = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <div className="mb-4">
          <svg className="w-16 h-16 text-[#CFB074] mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-black mb-2">로그인 오류</h1>
        <p className="text-black mb-6">로그인 중 오류가 발생했습니다.</p>
        <Link
          to="/"
          className="inline-block px-6 py-3 bg-[#009BE0] text-white rounded-lg hover:bg-[#CFB074] transition-colors"
        >
          홈으로 돌아가기
        </Link>
      </div>
    </div>
  )
}

export default AuthError