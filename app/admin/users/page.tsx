'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseClient } from '../../lib/supabase-client'
import Loading from '../../components/ui/Loading'
import Button from '../../components/ui/Button'
import AdminNavigation from '../components/AdminNavigation'

interface User {
  id: string
  email: string
  username?: string
  full_name?: string
  role: 'user' | 'admin' | 'professor' | 'professor_pending'
  is_active: boolean
  created_at: string
  last_sign_in_at?: string
  // 교수회원 정보
  phone?: string
  university?: string
  department?: string
  course?: string
  professor_book_id?: string
  professor_message?: string
  professor_application_date?: string
}

export default function UserManagementPage() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedRole, setSelectedRole] = useState('전체')
  const [selectedStatus, setSelectedStatus] = useState('전체')
  const [searchTerm, setSearchTerm] = useState('')
  const [showRoleModal, setShowRoleModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [newRole, setNewRole] = useState<'user' | 'admin' | 'professor' | 'professor_pending'>('user')
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [detailUser, setDetailUser] = useState<User | null>(null)
  const [books, setBooks] = useState<any[]>([])
  
  // Google Drive 관련 상태 (수동 권한 부여용)
  const [driveFolders, setDriveFolders] = useState<{[key: string]: {name: string}}>({})
  // 수동 권한 부여만 사용하므로 자동 권한 부여 관련 상태 제거됨

  const supabase = createSupabaseClient()
  
  // 📁 Google Drive 폴더 설정 (수동 권한 부여 방식)
  const DRIVE_FOLDERS_CONFIG = [
    { 
      id: '1p1RcwJlrJbIVP7IOpmTfwrY1Eg2SKIsN', 
      name: '08. 골든래빗 도서 교안(PPT)', 
      fallbackName: '08. 골든래빗 도서 교안(PPT)',
      status: 'manual_only' // 수동 권한 부여만 지원
    },
    { 
      id: '1nQNK776WO84RqCXhwC6reOVPvLojZE9Z', 
      name: '07. 골든래빗 도서 교안(PPT)', 
      fallbackName: '07. 골든래빗 도서 교안(PPT)',
      status: 'manual_only' // 수동 권한 부여만 지원
    }
  ]

  // 진단 도구 제거됨 - 수동 모드에서는 불필요
  
  // 수동 권한 부여만 사용하는 모드 (API 호출 없음)
  const USE_MANUAL_MODE_ONLY = true
  const roleOptions = ['전체', '사용자', '관리자', '교수', '교수회원 대기']
  const statusOptions = ['전체', '활성', '비활성']

  // 관리자 권한 확인
  useEffect(() => {
    checkAdminAuth()
  }, [])

  // 사용자 목록 조회
  useEffect(() => {
    if (isAdmin) {
      fetchUsers()
      fetchBooks()
    }
  }, [isAdmin])

  // 필터링 및 검색
  useEffect(() => {
    filterUsers()
  }, [users, selectedRole, selectedStatus, searchTerm])

  const checkAdminAuth = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        router.push('/auth/login')
        return
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profileError || profile?.role !== 'admin') {
        router.push('/')
        return
      }

      setIsAdmin(true)
    } catch (error) {
      console.error('관리자 권한 확인 실패:', error)
      router.push('/')
    }
  }

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          username,
          full_name,
          role,
          is_active,
          created_at,
          phone,
          university,
          department,
          course,
          professor_book_id,
          professor_message,
          professor_application_date
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      // 사용자 데이터 처리
      const usersData = (data || []).map(profile => ({
        ...profile,
        email: profile.username || 'Unknown',
        is_active: profile.is_active ?? true // is_active가 null이면 true로 설정
      }))
      
      setUsers(usersData)
      setFilteredUsers(usersData)
    } catch (error: any) {
      setError(`사용자 목록을 불러오는데 실패했습니다: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const fetchBooks = async () => {
    try {
      const { data, error } = await supabase
        .from('books')
        .select('id, title, author')
        .order('title')

      if (error) throw error
      setBooks(data || [])
    } catch (error) {
      console.error('도서 조회 실패:', error)
    }
  }

  const handleShowDetail = (user: User) => {
    setDetailUser(user)
    setShowDetailModal(true)
  }

  const filterUsers = () => {
    let filtered = users

    // 역할 필터링
    if (selectedRole !== '전체') {
      const roleMapping = { 
        '사용자': 'user', 
        '관리자': 'admin',
        '교수': 'professor',
        '교수회원 대기': 'professor_pending'
      }
      filtered = filtered.filter(user => user.role === roleMapping[selectedRole as keyof typeof roleMapping])
    }

    // 상태 필터링
    if (selectedStatus !== '전체') {
      const isActive = selectedStatus === '활성'
      filtered = filtered.filter(user => user.is_active === isActive)
    }

    // 검색 필터링
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(user => 
        user.email.toLowerCase().includes(searchLower) ||
        (user.username && user.username.toLowerCase().includes(searchLower))
      )
    }

    setFilteredUsers(filtered)
  }

  // Google Drive API 관련 함수들
  const getAccessToken = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      return session?.provider_token
    } catch (error) {
      console.error('액세스 토큰 가져오기 실패:', error)
      return null
    }
  }

  // fetchFolderInfo 함수 제거됨 - 수동 모드에서는 하드코딩된 이름 사용

  const loadFolderNames = async () => {
    const folderData: {[key: string]: {name: string}} = {}
    
    // 수동 모드: API 호출 없이 하드코딩된 폴더 이름 사용
    if (USE_MANUAL_MODE_ONLY) {
      console.log('📁 수동 모드로 폴더 정보 설정')
      for (const folder of DRIVE_FOLDERS_CONFIG) {
        folderData[folder.id] = { name: folder.name }
        console.log(`✅ ${folder.name} (ID: ${folder.id}) - 수동 권한 부여 가능`)
      }
      setDriveFolders(folderData)
      return
    }
    
    // API 호출 모드는 비활성화됨 - 수동 모드만 사용
  }

  // 자동 권한 부여 기능 제거됨 - 수동 권한 부여만 사용

  const handleRoleChange = async (user: User) => {
    setSelectedUser(user)
    setNewRole(user.role)
    setShowRoleModal(true)
    
    // 교수로 변경하는 경우 Drive 폴더 정보 로드
    if (user.professor_application_date) {
      await loadFolderNames()
    }
  }

  const updateUserRole = async () => {
    if (!selectedUser) return

    // 교수회원 신청 이력이 있는 사용자의 역할 변경 제한
    if ((newRole === 'user' || newRole === 'admin') && selectedUser.professor_application_date) {
      alert('교수회원 신청 이력이 있는 사용자는 교수 관련 역할만 변경 가능합니다.')
      return
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', selectedUser.id)

      if (error) throw error

      const roleLabels = {
        'admin': '관리자',
        'user': '사용자',
        'professor': '교수',
        'professor_pending': '교수회원 대기'
      }
      
      alert(`${selectedUser.username || selectedUser.email}의 역할이 ${roleLabels[newRole]}(으)로 변경되었습니다.`)
      setShowRoleModal(false)
      setSelectedUser(null)
      fetchUsers()
    } catch (error: any) {
      alert(`역할 변경 중 오류가 발생했습니다: ${error.message}`)
    }
  }

  const handleToggleActive = async (user: User) => {
    const newStatus = !user.is_active
    const action = newStatus ? '활성화' : '비활성화'
    
    if (!confirm(`${user.username || user.email} 사용자를 ${action} 하시겠습니까?`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: newStatus })
        .eq('id', user.id)

      if (error) throw error

      alert(`사용자가 ${action}되었습니다.`)
      fetchUsers()
    } catch (error: any) {
      alert(`사용자 ${action} 중 오류가 발생했습니다: ${error.message}`)
    }
  }

  const getRoleLabel = (role: string) => {
    const labels = {
      'admin': '관리자',
      'user': '사용자',
      'professor': '교수',
      'professor_pending': '교수회원 대기'
    }
    return labels[role as keyof typeof labels] || '사용자'
  }

  const getRoleColor = (role: string) => {
    const colors = {
      'admin': 'bg-purple-100 text-purple-800',
      'user': 'bg-blue-100 text-blue-800',
      'professor': 'bg-green-100 text-green-800',
      'professor_pending': 'bg-yellow-100 text-yellow-800'
    }
    return colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading || !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loading size="lg" text="권한 확인 중..." />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 관리자 내비게이션 */}
      <AdminNavigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">사용자 관리</h1>
            <p className="text-gray-600 mt-1">총 {users.length}명의 사용자 등록됨</p>
          </div>
          
          {/* 수동 Google Drive 권한 부여 모드 */}
          <div className="flex gap-2">
            <span className="px-3 py-2 text-sm text-green-700 bg-green-100 rounded">
              📁 수동 권한 부여 모드
            </span>
          </div>
        </div>

        {/* Google Drive 수동 권한 부여 안내 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-blue-800 mb-1">📁 Google Drive 수동 권한 부여 모드</h3>
              <div className="text-sm text-blue-700">
                <p>교수 승인 시 Google Drive 폴더에 대한 권한을 수동으로 부여할 수 있습니다.</p>
                <p className="mt-1">
                  <strong>사용 방법:</strong> 교수 승인 시 나타나는 "📁 수동 권한 설정" 버튼을 클릭하여 
                  Google Drive에서 직접 해당 사용자를 폴더에 추가하세요.
                </p>
                <p className="mt-1 font-medium">
                  📂 07. 골든래빗 도서 교안(PPT) | 📂 08. 골든래빗 도서 교안(PPT)
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 필터 및 검색 */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="flex items-center gap-4">
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {roleOptions.map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
              
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {statusOptions.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            <div className="flex-1 max-w-md">
              <input
                type="text"
                placeholder="이메일 또는 사용자명으로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div className="text-sm text-gray-500">
              {filteredUsers.length}명 표시
            </div>
          </div>
        </div>

        {/* 사용자 목록 */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {error ? (
            <div className="p-6 text-center">
              <p className="text-red-600 mb-3">{error}</p>
              <button 
                onClick={fetchUsers} 
                className="px-4 py-2 text-sm text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-lg"
              >
                다시 시도
              </button>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-16">
              <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm || selectedRole !== '전체' || selectedStatus !== '전체'
                  ? '조건에 맞는 사용자가 없습니다'
                  : '등록된 사용자가 없습니다'
                }
              </h3>
              <p className="text-gray-500">
                {searchTerm || selectedRole !== '전체' || selectedStatus !== '전체'
                  ? '다른 필터를 시도해보세요'
                  : '새로운 사용자가 등록되면 여기에 표시됩니다'
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">사용자</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">역할</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">상태</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">가입일</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white text-sm font-medium mr-3">
                            {(user.username || user.email).charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {user.full_name || user.username || '사용자명 없음'}
                            </div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                            {(user.role === 'professor' || user.role === 'professor_pending') && user.university && (
                              <div className="text-xs text-gray-400 mt-1">
                                {user.university} {user.department && `- ${user.department}`}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-1 text-xs rounded ${getRoleColor(user.role)}`}>
                          {getRoleLabel(user.role)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-1 text-xs rounded ${
                          user.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {user.is_active ? '활성' : '비활성'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500">
                        {formatDate(user.created_at)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          {(user.role === 'professor' || user.role === 'professor_pending') && (
                            <button
                              onClick={() => handleShowDetail(user)}
                              className="px-3 py-1 text-xs text-primary-600 hover:text-primary-800 bg-primary-50 hover:bg-primary-100 rounded"
                            >
                              상세보기
                            </button>
                          )}
                          <button
                            onClick={() => handleRoleChange(user)}
                            className="px-3 py-1 text-xs text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded"
                          >
                            역할 변경
                          </button>
                          <button
                            onClick={() => handleToggleActive(user)}
                            className={`px-3 py-1 text-xs rounded ${
                              user.is_active 
                                ? 'text-orange-600 hover:text-orange-800 bg-orange-50 hover:bg-orange-100' 
                                : 'text-green-600 hover:text-green-800 bg-green-50 hover:bg-green-100'
                            }`}
                          >
                            {user.is_active ? '비활성화' : '활성화'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* 역할 변경 모달 */}
      {showRoleModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">사용자 역할 변경</h2>
              <button
                onClick={() => setShowRoleModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-4">
                <strong>{selectedUser.username || selectedUser.email}</strong>의 역할을 변경합니다.
              </p>
              
              <div className="space-y-3">
                <label className={`flex items-center ${selectedUser.professor_application_date ? 'opacity-50' : ''}`}>
                  <input
                    type="radio"
                    value="user"
                    checked={newRole === 'user'}
                    onChange={(e) => setNewRole(e.target.value as any)}
                    disabled={!!selectedUser.professor_application_date}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 mr-3 disabled:opacity-50"
                  />
                  <span className="text-sm">사용자 - 일반 사용자 권한</span>
                  {selectedUser.professor_application_date && (
                    <span className="text-xs text-red-500 ml-2">(교수회원 신청자는 선택 불가)</span>
                  )}
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="professor_pending"
                    checked={newRole === 'professor_pending'}
                    onChange={(e) => setNewRole(e.target.value as any)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 mr-3"
                  />
                  <span className="text-sm">교수회원 대기 - 교수 승인 대기 중</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="professor"
                    checked={newRole === 'professor'}
                    onChange={(e) => setNewRole(e.target.value as any)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 mr-3"
                  />
                  <span className="text-sm">교수 - 교수 자료실 접근 가능</span>
                </label>
                <label className={`flex items-center ${selectedUser.professor_application_date ? 'opacity-50' : ''}`}>
                  <input
                    type="radio"
                    value="admin"
                    checked={newRole === 'admin'}
                    onChange={(e) => setNewRole(e.target.value as any)}
                    disabled={!!selectedUser.professor_application_date}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 mr-3 disabled:opacity-50"
                  />
                  <span className="text-sm">관리자 - 모든 관리 기능 접근 가능</span>
                  {selectedUser.professor_application_date && (
                    <span className="text-xs text-red-500 ml-2">(교수회원 신청자는 선택 불가)</span>
                  )}
                </label>
              </div>
            </div>

            {/* Google Drive 자료실 권한 부여 섹션 */}
            {newRole === 'professor' && selectedUser.professor_application_date && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Google Drive 자료실 권한 부여</h3>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800 mb-4">
                    교수로 승인하기 전에 필요한 Google Drive 자료실에 접근 권한을 부여해주세요.
                  </p>
                  <div className="space-y-3">
                    {Object.keys(driveFolders).length === 0 ? (
                      <div className="text-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="text-sm text-gray-500 mt-2">폴더 정보를 가져오는 중...</p>
                      </div>
                    ) : (
                      Object.entries(driveFolders).map(([folderId, folderInfo]) => (
                        <div key={folderId} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                          <div className="flex items-center">
                            <svg className="w-5 h-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2V7z" />
                            </svg>
                            <span className="text-sm font-medium text-gray-900">{folderInfo.name}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => {
                                const driveUrl = `https://drive.google.com/drive/folders/${folderId}`
                                window.open(driveUrl, '_blank')
                              }}
                              className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                              title="Google Drive에서 직접 권한을 부여하세요"
                            >
                              📁 수동 권한 설정
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <p className="text-xs text-blue-600 mt-3">
                    참고: 권한 부여는 선택사항이며, 나중에 수동으로도 설정할 수 있습니다.
                  </p>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowRoleModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                취소
              </button>
              <Button onClick={updateUserRole}>
                변경
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 교수회원 상세 정보 모달 */}
      {showDetailModal && detailUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">교수회원 상세 정보</h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              {/* 기본 정보 */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">기본 정보</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex">
                    <span className="text-sm font-medium text-gray-600 w-24">이름:</span>
                    <span className="text-sm text-gray-900">{detailUser.full_name || '미입력'}</span>
                  </div>
                  <div className="flex">
                    <span className="text-sm font-medium text-gray-600 w-24">이메일:</span>
                    <span className="text-sm text-gray-900">{detailUser.email}</span>
                  </div>
                  <div className="flex">
                    <span className="text-sm font-medium text-gray-600 w-24">연락처:</span>
                    <span className="text-sm text-gray-900">{detailUser.phone || '미입력'}</span>
                  </div>
                  <div className="flex">
                    <span className="text-sm font-medium text-gray-600 w-24">역할:</span>
                    <span className={`inline-block px-2 py-1 text-xs rounded ${getRoleColor(detailUser.role)}`}>
                      {getRoleLabel(detailUser.role)}
                    </span>
                  </div>
                </div>
              </div>

              {/* 교수 정보 */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">교수 정보</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex">
                    <span className="text-sm font-medium text-gray-600 w-24">학교:</span>
                    <span className="text-sm text-gray-900">{detailUser.university || '미입력'}</span>
                  </div>
                  <div className="flex">
                    <span className="text-sm font-medium text-gray-600 w-24">학과:</span>
                    <span className="text-sm text-gray-900">{detailUser.department || '미입력'}</span>
                  </div>
                  <div className="flex">
                    <span className="text-sm font-medium text-gray-600 w-24">강의과목:</span>
                    <span className="text-sm text-gray-900">{detailUser.course || '미입력'}</span>
                  </div>
                  {detailUser.professor_book_id && (
                    <div className="flex">
                      <span className="text-sm font-medium text-gray-600 w-24">사용도서:</span>
                      <span className="text-sm text-gray-900">
                        {books.find(book => book.id === detailUser.professor_book_id)?.title || '도서 정보 없음'}
                      </span>
                    </div>
                  )}
                  {detailUser.professor_application_date && (
                    <div className="flex">
                      <span className="text-sm font-medium text-gray-600 w-24">신청일:</span>
                      <span className="text-sm text-gray-900">
                        {new Date(detailUser.professor_application_date).toLocaleString('ko-KR')}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* 추가 메시지 */}
              {detailUser.professor_message && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">추가 메시지</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">{detailUser.professor_message}</p>
                  </div>
                </div>
              )}

              {/* 액션 버튼 */}
              {detailUser.role === 'professor_pending' && (
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600 mb-3">
                    교수회원 승인을 위해 역할을 '교수'로 변경해주세요.
                  </p>
                  <div className="flex space-x-3">
                    <Button
                      onClick={() => {
                        setSelectedUser(detailUser)
                        setNewRole('professor')
                        setShowDetailModal(false)
                        setShowRoleModal(true)
                      }}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      교수로 승인
                    </Button>
                    <button
                      onClick={() => setShowDetailModal(false)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      닫기
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}