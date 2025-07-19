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

  useEffect(() => {
    let mounted = true
    
    // 초기 세션 확인
    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!mounted) return
        
        setUser(session?.user ?? null)
        
        if (session?.user) {
          await fetchUserProfile(session.user.id, session.user)
        }
        
        if (mounted) {
          setLoading(false)
        }
      } catch (error) {
        console.error('세션 확인 중 오류:', error)
        if (mounted) {
          setLoading(false)
        }
      }
    }

    getSession()

    // 인증 상태 변경 리스너
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return
        
        if (event === 'SIGNED_OUT' || !session) {
          setUser(null)
          setProfile(null)
          setLoading(false)
          return
        }
        
        if (session?.user) {
          setUser(session.user)
          await fetchUserProfile(session.user.id, session.user)
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

  const fetchUserProfile = async (userId, currentUser = null) => {
    try {
      // 관리자 이메일 확인
      const adminEmails = ['hgpark@goldenrabbit.co.kr', 'hwchoi@goldenrabbit.co.kr', 'ohhc@goldenrabbit.co.kr']
      const userEmail = currentUser?.email || user?.email
      const shouldBeAdmin = adminEmails.includes(userEmail)

      // 관리자 사용자의 경우 임시 프로필 생성 (RLS 정책 우회)
      if (shouldBeAdmin) {
        const tempProfile = {
          id: userId,
          email: userEmail,
          username: userEmail,
          role: 'admin',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        
        setProfile(tempProfile)
        return
      }

      // 일반 사용자의 경우 데이터베이스에서 프로필 조회
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('프로필 조회 중 오류:', error)
      }

      if (error && error.code === 'PGRST116') {
        // 프로필이 없으면 생성
        const newProfile = {
          id: userId,
          email: userEmail,
          username: userEmail,
          role: shouldBeAdmin ? 'admin' : 'customer'
        }
        
        const { data: insertData, error: insertError } = await supabase
          .from('profiles')
          .insert([newProfile])
          .select()
          .single()
        
        if (insertError) {
          console.error('프로필 생성 오류:', insertError)
          return
        }
        
        setProfile(insertData)
        return
      }

      if (error) {
        console.error('프로필 조회 중 오류:', error)
        return
      }

      // 프로필이 있는 경우 - 관리자 권한 확인 및 자동 업데이트
      if (data && shouldBeAdmin && data.role !== 'admin') {
        const { data: updatedProfile, error: updateError } = await supabase
          .from('profiles')
          .update({ role: 'admin' })
          .eq('id', userId)
          .select()
          .single()
        
        if (updateError) {
          console.error('관리자 권한 업데이트 오류:', updateError)
          setProfile(data)
        } else {
          setProfile(updatedProfile)
        }
      } else {
        setProfile(data)
      }
    } catch (error) {
      console.error('프로필 조회 중 오류:', error)
    }
  }

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
    return profile?.role === 'admin'
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
    signInWithGoogle,
    signOut,
    isAdmin,
    fetchUserProfile,
    updateUserRole
  }


  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}