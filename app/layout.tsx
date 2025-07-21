import { createSupabaseServerClient } from './lib/supabase-server'
import ClientWrapper from './components/ClientWrapper'
import './globals.css'

export const metadata = {
  title: '골든래빗 - IT 전문서 출판사',
  description: 'IT 전문서와 실용서로 더 나은 세상을 만들어가는 출판사',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createSupabaseServerClient()
  
  // 서버에서 검증된 사용자 정보 조회 (getUser는 Supabase 서버에서 검증)
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  let userProfile = null
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