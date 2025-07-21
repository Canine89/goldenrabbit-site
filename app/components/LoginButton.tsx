'use client'

import { createSupabaseClient } from '../lib/supabase-client'

interface LoginButtonProps {
  className?: string
}

export default function LoginButton({ className = '' }: LoginButtonProps) {
  const supabase = createSupabaseClient()

  const handleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) {
        console.error('Google 로그인 오류:', error)
      }
    } catch (error) {
      console.error('로그인 중 오류:', error)
    }
  }

  return (
    <button
      onClick={handleLogin}
      className={`px-4 py-2 bg-[#009BE0] text-white rounded-lg hover:bg-[#007BB5] transition-colors ${className}`}
    >
      로그인
    </button>
  )
}