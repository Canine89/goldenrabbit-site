import { createSupabaseServerClient } from './lib/supabase-server'
import ClientWrapper from './components/ClientWrapper'
import './globals.css'

export const metadata = {
  title: '골든래빗 - IT 전문서 출판사',
  description: 'IT 전문서와 실용서로 더 나은 세상을 만들어가는 출판사',
}

// 모든 페이지를 동적으로 렌더링하도록 설정 (Supabase 인증 때문에 필요)
export const dynamic = 'force-dynamic'

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Supabase 클라이언트 생성을 try-catch로 감싸서 빌드 시 에러 방지
  let user = null
  let userProfile = null
  
  try {
    const supabase = await createSupabaseServerClient()
    
    // 서버에서 검증된 사용자 정보 조회 (getUser는 Supabase 서버에서 검증)
    const { data: { user: supabaseUser }, error: userError } = await supabase.auth.getUser()
    user = supabaseUser
    
    if (user && !userError) {
      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        
        if (!profileError) {
          userProfile = profile
        }
      } catch (error) {
        // 프로필 조회 실패 시 무시
      }
    }
  } catch (error) {
    // Supabase 연결 실패 시 무시 (빌드 시 환경변수가 없을 수 있음)
    console.warn('Supabase 연결 실패 (빌드 시 정상):', error)
    user = null
    userProfile = null
  }

  return (
    <html lang="ko" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ClientWrapper 
          initialUser={user || null}
          initialProfile={userProfile}
        >
          {children}
        </ClientWrapper>
      </body>
    </html>
  )
}