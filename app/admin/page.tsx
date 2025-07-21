import { createSupabaseServerClient } from '../lib/supabase-server'
import { redirect } from 'next/navigation'
import AdminDashboard from './components/AdminDashboard'

export default async function AdminPage() {
  const supabase = await createSupabaseServerClient()
  
  // 서버에서 사용자 인증 확인
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (!user || userError) {
    redirect('/auth/login')
  }
  
  // 사용자 프로필 및 관리자 권한 확인
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  
  if (!profile || profileError || profile.role !== 'admin') {
    redirect('/')
  }
  
  return <AdminDashboard />
}