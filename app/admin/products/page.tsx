import { createSupabaseServerClient } from '../../lib/supabase-server'
import { redirect } from 'next/navigation'

export default async function ProductManagementPage() {
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
  
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">상품 관리</h1>
          <p className="text-gray-600 mt-2">토끼상점 상품을 관리하고 편집합니다</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-500">상품 관리 기능이 곧 추가될 예정입니다.</p>
        </div>
      </div>
    </div>
  )
}