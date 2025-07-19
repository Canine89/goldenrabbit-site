import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { createProfileData } from '../../utils/auth'

const AuthCallback = () => {
  const navigate = useNavigate()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('인증 콜백 오류:', error)
          navigate('/auth/error')
          return
        }

        if (data.session) {
          const user = data.session.user
          
          // 프로필 존재 확인
          const { data: existingProfile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()

          if (profileError && profileError.code === 'PGRST116') {
            // 프로필이 없으면 생성
            const profileData = createProfileData(user)
            
            const { error: insertError } = await supabase
              .from('profiles')
              .insert([profileData])

            if (insertError) {
              console.error('프로필 생성 오류:', insertError)
            } else {
              console.log('프로필 생성 완료:', profileData)
            }
          }

          // 홈으로 리다이렉트
          navigate('/')
        } else {
          navigate('/auth/error')
        }
      } catch (error) {
        console.error('인증 콜백 처리 중 오류:', error)
        navigate('/auth/error')
      }
    }

    handleAuthCallback()
  }, [navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#009BE0] mx-auto mb-4"></div>
        <p className="text-black">로그인 처리 중...</p>
      </div>
    </div>
  )
}

export default AuthCallback