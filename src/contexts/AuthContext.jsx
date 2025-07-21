import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(false)
  const [forceUpdateTrigger, setForceUpdateTrigger] = useState(0) // 강제 리렌더링용

  useEffect(() => {
    let mounted = true
    
    // 초기 세션 확인 - 새로고침 시 반드시 DB에서 최신 role 확인
    const getSession = async () => {
      try {
        console.log('🔍 세션 확인 시작 - DB에서 최신 role 정보 확인')
        
        // 새로고침 대응: 세션 스토리지에서 캐시된 프로필 정보 우선 로드
        const cachedProfile = sessionStorage.getItem('userProfile')
        if (cachedProfile) {
          try {
            const parsedProfile = JSON.parse(cachedProfile)
            console.log('📱 캐시된 프로필 정보 임시 로드:', parsedProfile)
            setProfile(parsedProfile)
          } catch (parseError) {
            console.warn('캐시된 프로필 파싱 실패:', parseError)
            sessionStorage.removeItem('userProfile')
          }
        }
        
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!mounted) return
        
        setUser(session?.user ?? null)
        
        if (session?.user) {
          // 새로고침 시 반드시 DB에서 최신 프로필 정보 조회
          console.log('🔄 새로고침 감지 - DB에서 최신 프로필 조회 중...')
          await fetchUserProfileFromDB(session.user.id, session.user, true)
        } else {
          // 세션이 없으면 프로필도 초기화
          setProfile(null)
          sessionStorage.removeItem('userProfile')
        }
        
        if (mounted) {
          setLoading(false)
        }
      } catch (error) {
        console.error('세션 확인 중 오류:', error)
        if (mounted) {
          setUser(null)
          setProfile(null)
          sessionStorage.removeItem('userProfile')
          setLoading(false)
        }
      }
    }

    getSession()

    // 인증 상태 변경 리스너
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return
        
        console.log(`🔐 인증 상태 변경: ${event}`)
        
        if (event === 'SIGNED_OUT' || !session) {
          setUser(null)
          setProfile(null)
          setLoading(false)
          return
        }
        
        if (session?.user) {
          setUser(session.user)
          // 로그인/토큰 갱신 시에도 반드시 DB에서 최신 role 확인
          await fetchUserProfileFromDB(session.user.id, session.user, true)
        }
        
        if (mounted) {
          setLoading(false)
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  // Supabase 연결 테스트 함수
  const testSupabaseConnection = async () => {
    try {
      console.log('🔍 Supabase 연결 테스트 시작...')
      
      // 가장 간단한 쿼리로 연결 테스트
      const { data, error } = await supabase
        .from('profiles')
        .select('count', { count: 'exact', head: true })
      
      if (error) {
        console.error('❌ Supabase 연결 실패:', error)
        return false
      }
      
      console.log('✅ Supabase 연결 성공:', { count: data })
      return true
    } catch (error) {
      console.error('❌ Supabase 연결 테스트 오류:', error)
      return false
    }
  }

  // DB에서 반드시 최신 프로필 정보를 조회하는 함수
  const fetchUserProfileFromDB = async (userId, currentUser = null, forceRefresh = false) => {
    try {
      setProfileLoading(true)
      const userEmail = currentUser?.email || user?.email

      if (forceRefresh) {
        console.log('🔒 보안 중요: DB에서 최신 role 정보 강제 조회 중...')
        // 기존 프로필 상태를 일시적으로 초기화하여 캐시 방지
        setProfile(null)
      }

      console.log('📡 Supabase 쿼리 시작:', { userId, userEmail })
      
      // 새로고침 시 빠른 응답을 위해 연결 테스트 생략
      // const connectionOk = await testSupabaseConnection()
      // if (!connectionOk) {
      //   console.log('🚨 Supabase 연결 실패 - 즉시 fallback 처리')
      //   throw new Error('Supabase 연결 실패')
      // }
      
      // 더 간단하고 안전한 쿼리 시도
      let data, error
      
      try {
        console.log('📡 profiles 테이블 쿼리 시작...')
        
        // 간단하고 빠른 쿼리
        const response = await supabase
          .from('profiles')
          .select('id, email, username, role')
          .eq('id', userId)
          .single()
        data = response.data
        error = response.error
        
        console.log('📡 Supabase 쿼리 응답:', { 
          hasData: !!data, 
          hasError: !!error, 
          errorCode: error?.code,
          errorMessage: error?.message,
          userId 
        })
      } catch (fetchError) {
        console.error('📡 쿼리 실행 중 오류:', fetchError)
        
        // 즉시 fallback으로 처리
        throw fetchError
      }

      if (error && error.code === 'PGRST116') {
        // 프로필이 없으면 생성
        console.log('👤 새 사용자 프로필 생성 중...')
        const newProfile = {
          id: userId,
          email: userEmail,
          username: userEmail,
          role: 'customer' // 기본값은 일반 사용자
        }
        
        const { data: insertData, error: insertError } = await supabase
          .from('profiles')
          .insert([newProfile])
          .select()
          .single()
        
        if (insertError) {
          console.error('❌ 프로필 생성 오류:', insertError)
          setProfileLoading(false)
          return
        }
        
        console.log('✅ 새 프로필 생성 완료:', insertData)
        setProfile(insertData)
        setProfileLoading(false)
        return
      }

      if (error) {
        console.error('❌ 프로필 조회 중 오류:', error)
        setProfileLoading(false)
        return
      }

      console.log('✅ DB에서 최신 프로필 조회 완료:', { userId, role: data.role, email: data.email })
      
      // 상태 업데이트를 강제로 동기화
      setProfile(data)
      setProfileLoading(false)
      
      // 새로고침 대응을 위해 세션 스토리지에 프로필 정보 저장
      try {
        sessionStorage.setItem('userProfile', JSON.stringify(data))
        console.log('💾 프로필 정보 세션 스토리지에 저장')
      } catch (storageError) {
        console.warn('세션 스토리지 저장 실패:', storageError)
      }
      
      // 모든 관련 컴포넌트 강제 리렌더링 트리거
      setForceUpdateTrigger(prev => prev + 1)
      
      // React 상태 업데이트 강제 트리거 (개발 환경에서만)
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 React 상태 동기화 강제 트리거:', { 
          newRole: data.role, 
          timestamp: new Date().toISOString(),
          forceUpdateTrigger: forceUpdateTrigger + 1
        })
      }
    } catch (error) {
      console.error('❌ 프로필 조회 중 오류:', error)
      
      // 모든 DB 오류에 대해 즉시 fallback 처리 (무한 로딩 방지)
      console.log('🚨 즉시 fallback 처리 - 사용자 경험 보호')
      
      // 이메일 기반으로 임시 관리자 권한 부여 (특정 이메일만)
      const userEmail = currentUser?.email || user?.email
      const isKnownAdmin = userEmail === 'hgpark@goldenrabbit.co.kr' // 실제 관리자 이메일
      
      const fallbackProfile = {
        id: userId,
        email: userEmail,
        username: userEmail,
        role: isKnownAdmin ? 'admin' : 'customer',
        _fallback: true, // fallback 표시
        _fallbackReason: error.message || 'DB connection failed',
        _timestamp: new Date().toISOString()
      }
      
      console.log('🔄 Fallback 프로필 즉시 생성:', { 
        email: userEmail, 
        role: fallbackProfile.role, 
        isFallback: true,
        reason: fallbackProfile._fallbackReason
      })
      
      // 즉시 상태 업데이트하여 무한 로딩 방지
      setProfile(fallbackProfile)
      setProfileLoading(false)
      
      // 세션 스토리지에도 fallback 상태 저장
      try {
        sessionStorage.setItem('userProfile', JSON.stringify(fallbackProfile))
        console.log('💾 Fallback 프로필 세션 스토리지에 저장')
      } catch (storageError) {
        console.warn('세션 스토리지 저장 실패:', storageError)
      }
      
      // 백그라운드에서 재시도 (사용자 경험을 방해하지 않음)
      setTimeout(() => {
        console.log('🔄 백그라운드 재시도 시작...')
        fetchUserProfileFromDB(userId, currentUser, false).catch(() => {
          console.log('🚫 백그라운드 재시도도 실패 - fallback 상태 유지')
        })
      }, 5000) // 5초 후 재시도
    }
  }

  // 하위 호환성을 위한 기존 함수명 유지
  const fetchUserProfile = fetchUserProfileFromDB

  const signInWithGoogle = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) {
        console.error('Google 로그인 오류:', error)
        throw error
      }

      return data
    } catch (error) {
      console.error('Google 로그인 중 오류:', error)
      throw error
    }
  }

  const signOut = async () => {
    try {
      // 1. 즉시 상태 초기화 (UI 반영)
      setUser(null)
      setProfile(null)
      setLoading(false)
      
      // 2. Supabase 인증 세션 종료
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Supabase 로그아웃 오류:', error)
      }
      
      // 3. 브라우저 저장소 완전 삭제
      localStorage.clear()
      sessionStorage.clear()
      // AdminGuard 관련 세션 스토리지도 정리
      sessionStorage.removeItem('lastAdminState')
      sessionStorage.removeItem('userProfile')
      
      // 4. 쿠키 삭제 (Supabase 관련)
      document.cookie.split(";").forEach(function(c) { 
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
      });
      
      // 5. 강제 새로고침으로 완전 초기화
      window.location.reload()
      
    } catch (error) {
      console.error('로그아웃 중 오류:', error)
      
      // 오류가 있어도 강제 초기화
      setUser(null)
      setProfile(null)
      setLoading(false)
      localStorage.clear()
      sessionStorage.clear()
      
      // 강제 홈으로 이동
      window.location.href = '/'
    }
  }

  const isAdmin = () => {
    const result = profile?.role === 'admin'
    console.log('🔐 관리자 권한 체크:', { 
      userId: user?.id, 
      email: user?.email, 
      currentRole: profile?.role, 
      isAdmin: result,
      profileLoaded: !!profile 
    })
    return result
  }

  // 실시간 DB 검증이 필요한 경우를 위한 함수
  const verifyAdminFromDB = async () => {
    if (!user?.id) {
      console.log('🚫 사용자 ID 없음 - 관리자 권한 없음')
      return false
    }

    try {
      console.log('🔍 실시간 DB 관리자 권한 검증 중...')
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('❌ DB 권한 검증 오류:', error)
        return false
      }

      const isAdminResult = data?.role === 'admin'
      console.log('✅ 실시간 DB 권한 검증 완료:', { 
        userId: user.id, 
        dbRole: data?.role, 
        isAdmin: isAdminResult 
      })

      // 만약 현재 상태와 DB 상태가 다르면 프로필 업데이트
      if (profile?.role !== data?.role) {
        console.log('⚠️ 권한 불일치 감지 - 프로필 동기화 중...', {
          currentRole: profile?.role,
          dbRole: data?.role
        })
        await fetchUserProfileFromDB(user.id, user, true)
      }

      return isAdminResult
    } catch (error) {
      console.error('❌ 실시간 DB 권한 검증 중 오류:', error)
      return false
    }
  }

  const updateUserRole = async (email, role) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ role })
        .eq('email', email)
        .select()
        .single()

      if (error) {
        console.error('역할 업데이트 오류:', error)
        return false
      }
      
      // 현재 사용자의 역할이 업데이트되었으면 프로필 새로고침
      if (user?.email === email) {
        setProfile(data)
      }
      
      return true
    } catch (error) {
      console.error('역할 업데이트 중 오류:', error)
      return false
    }
  }


  const value = {
    user,
    profile,
    loading,
    profileLoading,
    forceUpdateTrigger, // 컴포넌트 리렌더링 트리거용
    signInWithGoogle,
    signOut,
    isAdmin,
    verifyAdminFromDB,
    fetchUserProfile,
    fetchUserProfileFromDB,
    updateUserRole
  }


  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}