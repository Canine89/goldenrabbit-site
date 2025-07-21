import { useAuth } from '../../contexts/AuthContext'
import { useState, useEffect } from 'react'

const AdminGuard = ({ 
  children, 
  fallback = null, 
  showLoading = true, // 기본값을 true로 변경하여 로딩 상태 표시
  requireRealtimeVerification = false, // 실시간 DB 검증이 필요한 경우
  preserveOnRefresh = true // 새로고침 시 이전 상태 유지 옵션
}) => {
  const { profile, profileLoading, verifyAdminFromDB, user, forceUpdateTrigger } = useAuth()
  const [realtimeVerified, setRealtimeVerified] = useState(false)
  const [realtimeLoading, setRealtimeLoading] = useState(false)
  const [lastKnownAdminState, setLastKnownAdminState] = useState(null) // 마지막으로 알려진 관리자 상태

  // 실시간 DB 검증이 필요한 경우
  useEffect(() => {
    if (requireRealtimeVerification && user && profile && !profileLoading) {
      setRealtimeLoading(true)
      verifyAdminFromDB()
        .then((isAdmin) => {
          console.log('🔒 AdminGuard 실시간 DB 검증 결과:', isAdmin)
          setRealtimeVerified(isAdmin)
        })
        .catch((error) => {
          console.error('❌ AdminGuard DB 검증 실패:', error)
          setRealtimeVerified(false)
        })
        .finally(() => {
          setRealtimeLoading(false)
        })
    }
  }, [requireRealtimeVerification, user, profile, profileLoading, verifyAdminFromDB, forceUpdateTrigger])

  // 프로필 상태 변경 시 마지막 알려진 관리자 상태 업데이트
  useEffect(() => {
    if (profile?.role === 'admin') {
      setLastKnownAdminState(true)
      // 세션 스토리지에 임시 저장 (새로고침 대응)
      if (preserveOnRefresh) {
        sessionStorage.setItem('lastAdminState', 'true')
      }
    } else if (profile?.role && profile.role !== 'admin') {
      setLastKnownAdminState(false)
      if (preserveOnRefresh) {
        sessionStorage.removeItem('lastAdminState')
      }
    }
  }, [profile?.role, preserveOnRefresh])

  // 초기 로드 시 세션 스토리지에서 이전 상태 복원
  useEffect(() => {
    if (preserveOnRefresh && user && !profile && profileLoading) {
      const savedState = sessionStorage.getItem('lastAdminState')
      if (savedState === 'true') {
        setLastKnownAdminState(true)
        console.log('🔄 AdminGuard: 세션에서 이전 관리자 상태 복원')
      }
    }
  }, [user, profile, profileLoading, preserveOnRefresh])

  // forceUpdateTrigger 변경 시 컴포넌트 상태 추적
  useEffect(() => {
    if (forceUpdateTrigger > 0) {
      console.log('🔄 AdminGuard: 강제 업데이트 트리거 감지', { 
        forceUpdateTrigger, 
        profileRole: profile?.role,
        userId: user?.id,
        lastKnownAdminState 
      })
    }
  }, [forceUpdateTrigger, profile, user, lastKnownAdminState])

  // 프로필 로딩 중이거나 실시간 검증 중일 때의 처리
  if (profileLoading || (requireRealtimeVerification && realtimeLoading)) {
    // 새로고침 시 이전 상태 유지 옵션이 활성화되어 있고, 마지막 알려진 상태가 관리자라면 표시
    if (preserveOnRefresh && lastKnownAdminState === true) {
      console.log('🔄 AdminGuard: 로딩 중이지만 이전 관리자 상태 유지')
      return children
    }
    
    if (showLoading) {
      return (
        <div className="inline-block">
          <div className="animate-pulse bg-gray-200 h-4 w-16 rounded"></div>
        </div>
      )
    }
    return null
  }

  // 권한 체크 로직
  const hasAdminAccess = requireRealtimeVerification 
    ? realtimeVerified  // 실시간 DB 검증 결과 사용
    : profile?.role === 'admin'  // 기본 프로필 기반 검증

  console.log('🔐 AdminGuard 권한 체크:', {
    requireRealtimeVerification,
    profileRole: profile?.role,
    realtimeVerified,
    hasAdminAccess,
    lastKnownAdminState,
    preserveOnRefresh,
    userId: user?.id
  })

  // 관리자 권한이 없는 경우
  if (!hasAdminAccess) {
    return fallback
  }

  return children
}

export default AdminGuard