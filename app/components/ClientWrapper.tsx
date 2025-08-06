'use client'

import { useEffect, useState } from 'react'
import { createSupabaseClient } from '../lib/supabase-client'
import Header from './Header'
import Footer from './Footer'
import { CartProvider } from '../contexts/CartContext'
import type { User, AuthChangeEvent, Session } from '@supabase/supabase-js'

interface ClientWrapperProps {
  children: React.ReactNode
  initialUser: User | null
  initialProfile: any
}

export default function ClientWrapper({ 
  children, 
  initialUser, 
  initialProfile 
}: ClientWrapperProps) {
  const [user, setUser] = useState<User | null>(initialUser)
  const [profile, setProfile] = useState(initialProfile)
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)


  const supabase = createSupabaseClient()

  // 클라이언트 사이드 마운트 확인
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    // 인증 상태 변경 리스너
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        if (event === 'SIGNED_OUT' || !session) {
          setUser(null)
          setProfile(null)
          return
        }
        
        if (session?.user) {
          // 서버에서 이미 사용자 데이터를 받았고, 같은 사용자라면 추가 조회 불필요
          if (initialUser && initialUser.id === session.user.id && initialProfile) {
            setUser(session.user)
            setProfile(initialProfile)
            return
          }
          
          setUser(session.user)
          
          // 새로운 사용자이거나 프로필이 없는 경우에만 조회
          try {
            setLoading(true)
            const { data: newProfile, error } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single()
            
            if (!error) {
              setProfile(newProfile)
            }
          } catch (error) {
            // 프로필 조회 실패 시 무시
          } finally {
            setLoading(false)
          }
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase, initialUser, initialProfile])

  return (
    <CartProvider>
      <div className="min-h-screen flex flex-col">
        <Header user={user} profile={profile} loading={loading} />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
      </div>
    </CartProvider>
  )
}