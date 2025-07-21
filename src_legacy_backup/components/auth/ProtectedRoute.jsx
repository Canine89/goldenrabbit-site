import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useState, useEffect } from 'react'

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { user, profile, loading, profileLoading, verifyAdminFromDB } = useAuth()
  const [adminVerified, setAdminVerified] = useState(false)
  const [adminVerifying, setAdminVerifying] = useState(false)

  // 관리자 페이지 접근 시 실시간 DB 검증
  useEffect(() => {
    if (requireAdmin && user && profile && !profileLoading) {
      console.log('🔒 ProtectedRoute: 관리자 페이지 접근 - 실시간 DB 검증 시작')
      setAdminVerifying(true)
      
      verifyAdminFromDB()
        .then((isAdmin) => {
          console.log('🔒 ProtectedRoute: DB 검증 완료', { isAdmin, userId: user.id })
          setAdminVerified(isAdmin)
        })
        .catch((error) => {
          console.error('❌ ProtectedRoute: DB 검증 실패', error)
          setAdminVerified(false)
        })
        .finally(() => {
          setAdminVerifying(false)
        })
    }
  }, [requireAdmin, user, profile, profileLoading, verifyAdminFromDB])

  // 로딩 중이거나 사용자는 있지만 프로필이 아직 로딩 중인 경우
  if (loading || (user && (profileLoading || !profile)) || (requireAdmin && adminVerifying)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-black">
            {loading ? '인증 정보를 확인하는 중...' : 
             adminVerifying ? '🔒 관리자 권한을 DB에서 검증하는 중...' :
             '프로필 정보를 불러오는 중...'}
          </p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/auth/login" replace />
  }

  // 관리자 권한이 필요한 경우, 실시간 DB 검증 결과 확인
  if (requireAdmin) {
    // 실시간 검증이 완료되었고 권한이 없는 경우
    if (!adminVerifying && !adminVerified) {
      console.log('🚫 ProtectedRoute: 관리자 권한 없음', { 
        userId: user.id, 
        profileRole: profile?.role, 
        adminVerified 
      })
      
      return (
        <div className="min-h-screen flex items-center justify-center bg-white">
          <div className="text-center">
            <div className="mb-4">
              <svg className="w-16 h-16 text-red-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 0h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-black mb-2">접근 권한이 없습니다</h1>
            <p className="text-gray-600 mb-6">관리자 권한이 필요한 페이지입니다.</p>
            <p className="text-sm text-gray-500 mb-6">
              🔒 보안을 위해 데이터베이스에서 실시간으로 권한을 확인했습니다.
            </p>
            <button
              onClick={() => window.history.back()}
              className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              이전 페이지로 돌아가기
            </button>
          </div>
        </div>
      )
    }
  }

  console.log('✅ ProtectedRoute: 접근 허용', { 
    requireAdmin, 
    adminVerified, 
    userId: user.id,
    profileRole: profile?.role 
  })

  return children
}

export default ProtectedRoute