'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseClient } from '../../lib/supabase-client'
import Loading from '../../components/ui/Loading'
import Button from '../../components/ui/Button'
import { 
  updateUserRole as updateUserRoleAction, 
  toggleUserStatus, 
  getAdminUsers 
} from '../../../lib/actions/user-actions'
import { getAdminBooks } from '../../../lib/actions/book-actions'

interface User {
  id: string
  email?: string
  username?: string
  full_name?: string
  role: 'customer' | 'admin' | 'professor' | 'professor_pending'
  is_active?: boolean
  created_at?: string
  updated_at?: string
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

interface DrivePermissionResult {
  success: boolean
  permissionId?: string
  folderName?: string
  error?: string
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
  const [newRole, setNewRole] = useState<'customer' | 'admin' | 'professor' | 'professor_pending'>('customer')
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [detailUser, setDetailUser] = useState<User | null>(null)
  const [books, setBooks] = useState<any[]>([])
  const [isPending, startTransition] = useTransition()
  const [submitError, setSubmitError] = useState<string | null>(null)
  
  // 불필요한 상태 제거됨

  const supabase = createSupabaseClient()
  
  // Google Drive 폴더 설정 (활성 폴더만)
  const DRIVE_FOLDERS = [
    { 
      id: '1p1RcwJlrJbIVP7IOpmTfwrY1Eg2SKIsN', 
      name: '08. 골든래빗 도서 교안(PPT)'
    }
    // 폴더 2는 권한 설정 제한으로 제외: 1nQNK776WO84RqCXhwC6reOVPvLojZE9Z
  ]

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
      
      const result = await getAdminUsers(1, 1000) // 모든 사용자 가져오기
      
      if (!result.success) {
        throw new Error(result.error)
      }
      
      // 사용자 데이터 처리
      const usersData = result.data.users.map(profile => ({
        ...profile,
        email: profile.username || profile.email || 'Unknown',
        is_active: profile.is_active ?? true
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
      const result = await getAdminBooks(1, 1000)
      
      if (result.success) {
        setBooks(result.data.books)
      } else {
        console.error('도서 조회 실패:', result.error)
      }
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
        '사용자': 'customer', 
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
        (user.email && user.email.toLowerCase().includes(searchLower)) ||
        (user.username && user.username.toLowerCase().includes(searchLower)) ||
        (user.full_name && user.full_name.toLowerCase().includes(searchLower))
      )
    }

    setFilteredUsers(filtered)
  }

  // Google Drive API 관련 함수들 제거됨 - 수동 권한 부여 방식으로 변경

  const handleRoleChange = async (user: User) => {
    setSelectedUser(user)
    setNewRole(user.role)
    setShowRoleModal(true)
  }

  const updateUserRole = async () => {
    if (!selectedUser) return

    // 교수회원 신청 이력이 있는 사용자의 역할 변경 제한
    if ((newRole === 'customer' || newRole === 'admin') && selectedUser.professor_application_date) {
      alert('교수회원 신청 이랕이 있는 사용자는 교수 관련 역할만 변경 가능합니다.')
      return
    }

    setSubmitError(null)
    startTransition(async () => {
      try {
        // role 매핑 (professor_pending -> customer 변환)
        const mappedRole = newRole === 'professor_pending' ? 'customer' : newRole
        
        const result = await updateUserRoleAction(selectedUser.id, mappedRole as 'customer' | 'professor' | 'admin')

        if (!result.success) {
          throw new Error(result.error)
        }

        const roleLabels = {
          'admin': '관리자',
          'customer': '사용자',
          'professor': '교수',
          'professor_pending': '교수회원 대기'
        }
        
        alert(result.message || `${selectedUser.username || selectedUser.email}의 역할이 ${roleLabels[newRole]}(으)로 변경되었습니다.`)
        setShowRoleModal(false)
        setSelectedUser(null)
        fetchUsers()
      } catch (error: any) {
        setSubmitError(`역할 변경 중 오류가 발생했습니다: ${error.message}`)
      }
    })
  }

  const handleToggleActive = async (user: User) => {
    const newStatus = !user.is_active
    const action = newStatus ? '활성화' : '비활성화'
    
    if (!confirm(`${user.username || user.email} 사용자를 ${action} 하시경습니까?`)) {
      return
    }

    startTransition(async () => {
      try {
        const result = await toggleUserStatus(user.id, newStatus)

        if (!result.success) {
          throw new Error(result.error)
        }

        alert(result.message || `사용자가 ${action}되었습니다.`)
        fetchUsers()
      } catch (error: any) {
        alert(`사용자 ${action} 중 오류가 발생했습니다: ${error.message}`)
      }
    })
  }

  const getRoleLabel = (role: string) => {
    const labels = {
      'admin': '관리자',
      'customer': '사용자',
      'professor': '교수',
      'professor_pending': '교수회원 대기'
    }
    return labels[role as keyof typeof labels] || '사용자'
  }

  const getRoleColor = (role: string) => {
    const colors = {
      'admin': 'bg-purple-100 text-purple-800',
      'customer': 'bg-blue-100 text-blue-800',
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
    <div>
      <div>
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">사용자 관리</h1>
            <p className="text-gray-600 mt-1">총 {users.length}명의 사용자 등록됨</p>
          </div>
        </div>

        {/* Google Drive 수동 권한 관리 안내 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h4 className="text-sm font-medium text-blue-800 mb-1">📁 Google Drive 권한 관리 안내</h4>
              <p className="text-sm text-blue-700">
                교수회원 승인 시 Google Drive 자료실 폴더에 대한 권한을 수동으로 부여해주세요. 
                교수로 역할 변경할 때 자세한 안내가 표시됩니다.
              </p>
              <p className="text-xs text-blue-600 mt-1">
                📂 관리 대상 폴더: {DRIVE_FOLDERS.map(f => f.name).join(', ')}
              </p>
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
                            {(user.username || user.email || 'U').charAt(0).toUpperCase()}
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
                        {user.created_at ? formatDate(user.created_at) : '-'}
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
                    value="customer"
                    checked={newRole === 'customer'}
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

            {/* Google Drive 자료실 권한 부여 안내 */}
            {newRole === 'professor' && selectedUser.professor_application_date && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">📁 Google Drive 자료실 권한 부여</h3>
                
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.876c1.429 0 2.63-1.104 2.744-2.515l.879-10.871c.116-1.445-.883-2.703-2.333-2.703H2.828c-1.45 0-2.449 1.258-2.333 2.703l.88 10.87c.113 1.412 1.314 2.516 2.743 2.516z" />
                    </svg>
                    <div>
                      <h4 className="text-sm font-medium text-amber-800 mb-2">교수 승인 전 필수 확인사항</h4>
                      <p className="text-sm text-amber-700 mb-3">
                        다음 사용자를 Google Drive 교수 자료실에 추가하셨나요?
                      </p>
                      <div className="bg-white rounded p-3 mb-3">
                        <p className="text-sm font-medium text-gray-900">👤 사용자 이메일:</p>
                        <p className="text-base font-mono bg-gray-100 px-2 py-1 rounded mt-1">{selectedUser.email}</p>
                      </div>
                      <div className="bg-white rounded p-3 mb-3">
                        <p className="text-sm font-medium text-gray-900 mb-2">📂 대상 폴더:</p>
                        <div className="space-y-2">
                          {DRIVE_FOLDERS.map(folder => (
                            <div key={folder.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <span className="text-sm text-gray-700">{folder.name}</span>
                              <button
                                onClick={() => window.open(`https://drive.google.com/drive/folders/${folder.id}`, '_blank')}
                                className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                              >
                                📁 폴더 열기
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="bg-blue-50 border border-blue-200 rounded p-3">
                        <p className="text-xs text-blue-800 font-medium mb-1">💡 권한 부여 방법:</p>
                        <ol className="text-xs text-blue-700 space-y-1">
                          <li>1. 위 "📁 폴더 열기" 버튼으로 폴더 접속</li>
                          <li>2. 폴더 우클릭 → "공유" 선택</li>
                          <li>3. 사용자 이메일 추가</li>
                          <li>4. 권한을 "뷰어" 또는 "편집자"로 설정</li>
                          <li>5. "전송" 클릭하여 권한 부여 완료</li>
                        </ol>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-800 font-medium">
                    ⚠️ Google Drive 권한을 먼저 부여한 후 교수로 승인해주세요.
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