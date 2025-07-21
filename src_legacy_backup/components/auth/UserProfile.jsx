import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import AdminGuard from './AdminGuard'

const UserProfile = () => {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleSignOut = async () => {
    if (isLoggingOut) return // 중복 클릭 방지
    
    setIsLoggingOut(true)
    setIsOpen(false)
    
    try {
      await signOut()
      // signOut에서 페이지 새로고침 처리
    } catch (error) {
      // 오류가 있어도 강제 새로고침
      window.location.reload()
    }
  }

  if (!user) {
    return null
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 text-sm bg-white rounded-full border border-black p-2 hover:bg-[#CFB074] hover:text-white transition-colors"
      >
        <div className="w-8 h-8 bg-[#009BE0] rounded-full flex items-center justify-center">
          {user.user_metadata?.avatar_url ? (
            <img
              src={user.user_metadata.avatar_url}
              alt="프로필"
              className="w-8 h-8 rounded-full"
            />
          ) : (
            <span className="text-white text-sm font-medium">
              {user.user_metadata?.full_name?.[0] || user.email?.[0]?.toUpperCase()}
            </span>
          )}
        </div>
        <span className="text-black font-medium hidden md:block">
          {user.user_metadata?.full_name || user.email}
        </span>
        <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-black py-2 z-50">
          <div className="px-4 py-2 border-b border-black">
            <p className="text-sm font-medium text-black">
              {user.user_metadata?.full_name || user.email}
            </p>
            <p className="text-xs text-black">{user.email}</p>
            {profile?.role === 'admin' && (
              <span className="inline-block mt-1 px-2 py-1 text-xs bg-[#CFB074] text-white rounded-full">
                관리자
              </span>
            )}
          </div>
          
          <div className="py-1">
            <Link
              to="/profile"
              className="block px-4 py-2 text-sm text-black hover:bg-[#CFB074] hover:text-white"
              onClick={() => setIsOpen(false)}
            >
              프로필 설정
            </Link>
            
            <AdminGuard 
              showLoading={true}
              preserveOnRefresh={true}
              fallback={null}
            >
              <Link
                to="/admin"
                className="block px-4 py-2 text-sm text-black hover:bg-[#CFB074] hover:text-white"
                onClick={() => setIsOpen(false)}
              >
                관리자 페이지
              </Link>
            </AdminGuard>
            
            <button
              onClick={handleSignOut}
              disabled={isLoggingOut}
              className="block w-full text-left px-4 py-2 text-sm text-black hover:bg-[#CFB074] hover:text-white disabled:opacity-50"
            >
              {isLoggingOut ? '로그아웃 중...' : '로그아웃'}
            </button>
          </div>
        </div>
      )}

      {/* 오버레이 */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}

export default UserProfile