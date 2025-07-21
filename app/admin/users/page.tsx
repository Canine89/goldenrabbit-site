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
  role: 'user' | 'admin'
  is_active: boolean
  created_at: string
  last_sign_in_at?: string
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
  const [newRole, setNewRole] = useState<'user' | 'admin'>('user')

  const supabase = createSupabaseClient()
  const roleOptions = ['전체', '사용자', '관리자']
  const statusOptions = ['전체', '활성', '비활성']

  // 관리자 권한 확인
  useEffect(() => {
    checkAdminAuth()
  }, [])

  // 사용자 목록 조회
  useEffect(() => {
    if (isAdmin) {
      fetchUsers()
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
          role,
          is_active,
          created_at
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

  const filterUsers = () => {
    let filtered = users

    // 역할 필터링
    if (selectedRole !== '전체') {
      const roleMapping = { '사용자': 'user', '관리자': 'admin' }
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

  const handleRoleChange = (user: User) => {
    setSelectedUser(user)
    setNewRole(user.role)
    setShowRoleModal(true)
  }

  const updateUserRole = async () => {
    if (!selectedUser) return

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', selectedUser.id)

      if (error) throw error

      alert(`${selectedUser.username || selectedUser.email}의 역할이 ${newRole === 'admin' ? '관리자' : '사용자'}로 변경되었습니다.`)
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
    return role === 'admin' ? '관리자' : '사용자'
  }

  const getRoleColor = (role: string) => {
    return role === 'admin' 
      ? 'bg-purple-100 text-purple-800' 
      : 'bg-blue-100 text-blue-800'
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
                              {user.username || '사용자명 없음'}
                            </div>
                            <div className="text-sm text-gray-500">{user.email}</div>
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
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="user"
                    checked={newRole === 'user'}
                    onChange={(e) => setNewRole(e.target.value as 'user' | 'admin')}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 mr-3"
                  />
                  <span className="text-sm">사용자 - 일반 사용자 권한</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="admin"
                    checked={newRole === 'admin'}
                    onChange={(e) => setNewRole(e.target.value as 'user' | 'admin')}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 mr-3"
                  />
                  <span className="text-sm">관리자 - 모든 관리 기능 접근 가능</span>
                </label>
              </div>
            </div>

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
    </div>
  )
}