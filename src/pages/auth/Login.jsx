import { Link } from 'react-router-dom'
import LoginButton from '../../components/auth/LoginButton'

const Login = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-black mb-2">로그인</h1>
          <p className="text-black">골든래빗에 오신 것을 환영합니다</p>
        </div>

        <div className="space-y-6">
          <LoginButton className="w-full" />
          
          <div className="text-center">
            <p className="text-sm text-black">
              계정이 없으신가요?{' '}
              <span className="text-[#009BE0] font-medium">
                구글 로그인으로 자동 가입됩니다
              </span>
            </p>
          </div>

          <div className="text-center">
            <Link
              to="/"
              className="text-sm text-black hover:text-[#CFB074] underline"
            >
              홈으로 돌아가기
            </Link>
          </div>
        </div>

        <div className="bg-[#CFB074] p-4 rounded-lg">
          <h3 className="text-sm font-medium text-white mb-2">관리자 계정</h3>
          <p className="text-xs text-white">
            골든래빗 직원 이메일(@goldenrabbit.co.kr)로 로그인하면 자동으로 관리자 권한이 부여됩니다.
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login