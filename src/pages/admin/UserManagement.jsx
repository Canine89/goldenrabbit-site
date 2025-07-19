import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

export default function UserManagement() {
  const { user, profile } = useAuth()
  const [users, setUsers] = useState([])
  const [filteredUsers, setFilteredUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('전체')
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    newUsersThisMonth: 0
  })

  const statusOptions = ['전체', '활성', '비활성']

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    filterUsers()
  }, [users, searchTerm, selectedStatus])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) {
        throw error
      }
      
      setUsers(data || [])
      calculateStats(data || [])
    } catch (error) {
      setError(`사용자 목록을 불러오는데 실패했습니다: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (usersData) => {
    const now = new Date()
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    
    const stats = {
      totalUsers: usersData.length,
      activeUsers: usersData.filter(user => !user.is_banned).length,
      newUsersThisMonth: usersData.filter(user => 
        new Date(user.created_at) >= thisMonth
      ).length
    }
    
    setStats(stats)
  }

  const filterUsers = () => {
    let filtered = users

    // 검색어 필터링
    if (searchTerm) {
      filtered = filtered.filter(user => 
        (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (user.username && user.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (user.full_name && user.full_name.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    // 상태 필터링
    if (selectedStatus !== '전체') {
      const isActive = selectedStatus === '활성'
      filtered = filtered.filter(user => !user.is_banned === isActive)
    }

    setFilteredUsers(filtered)
  }

  const handleEditUser = (user) => {
    setEditingUser(user)
    setShowEditModal(true)
  }

  const handleToggleUserStatus = async (user) => {
    const newStatus = !user.is_banned
    const action = newStatus ? '비활성화' : '활성화'
    
    if (!confirm(`"${user.email}" 사용자를 ${action} 하시겠습니까?`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_banned: newStatus })
        .eq('id', user.id)

      if (error) throw error

      alert(`사용자가 ${action}되었습니다.`)
      fetchUsers()
    } catch (error) {
      alert(`사용자 ${action} 중 오류가 발생했습니다.`)
    }
  }

  const handleUpdateUserRole = async (user) => {
    const currentRole = users.find(u => u.id === user.id)?.role || 'customer'
    const newRole = user.role
    
    if (currentRole === newRole) {
      alert('변경된 내용이 없습니다.')
      return
    }

    const roleText = newRole === 'admin' ? '관리자' : '일반 사용자'
    
    if (!confirm(`"${user.email}" 사용자의 역할을 "${roleText}"로 변경하시겠습니까?`)) {
      return
    }

    try {
      console.log('역할 변경 시도:', {
        userId: user.id,
        userEmail: user.email,
        currentRole,
        newRole,
        userObject: user
      })

      const { data, error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', user.id)
        .select()

      console.log('Supabase UPDATE 응답:', { data, error })

      if (error) {
        console.error('Supabase 업데이트 에러:', error)
        throw error
      }

      if (data && data.length > 0) {
        console.log('업데이트 성공, 변경된 데이터:', data[0])
        alert(`사용자 역할이 "${roleText}"로 변경되었습니다.`)
      } else {
        console.warn('업데이트는 성공했지만 반환된 데이터가 없습니다.')
        alert('역할 변경 요청이 처리되었습니다. 잠시 후 새로고침해주세요.')
      }

      setShowEditModal(false)
      setEditingUser(null)
      
      // 업데이트 후 사용자 목록 새로고침
      await fetchUsers()
      
      // 추가 검증: 실제로 변경되었는지 확인
      setTimeout(async () => {
        const { data: verifyData, error: verifyError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()
        
        if (verifyError) {
          console.error('검증 조회 오류:', verifyError)
        } else {
          console.log('변경 후 실제 역할:', verifyData?.role)
          if (verifyData?.role !== newRole) {
            alert('주의: 역할 변경이 완전히 반영되지 않았을 수 있습니다. 관리자에게 문의하세요.')
          }
        }
      }, 1000)

    } catch (error) {
      console.error('역할 변경 오류 상세:', error)
      alert(`역할 변경 중 오류가 발생했습니다: ${error.message}`)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ko-KR')
  }

  const formatLastSeen = (dateString) => {
    if (!dateString) return '알 수 없음'
    
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return '방금 전'
    if (diffInHours < 24) return `${diffInHours}시간 전`
    
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays}일 전`
    
    return formatDate(dateString)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">사용자 정보를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* 간결한 헤더 */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">사용자 관리</h1>
          <p className="text-neutral-600 mt-1">총 {stats.totalUsers}명의 사용자</p>
        </div>
      </div>

      {/* 간단한 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg border border-neutral-200 p-6">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm text-neutral-600">전체 사용자</p>
              <p className="text-2xl font-bold text-neutral-900">{stats.totalUsers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-neutral-200 p-6">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm text-neutral-600">활성 사용자</p>
              <p className="text-2xl font-bold text-neutral-900">{stats.activeUsers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-neutral-200 p-6">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm text-neutral-600">이번 달 신규</p>
              <p className="text-2xl font-bold text-neutral-900">{stats.newUsersThisMonth}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 검색 및 필터 */}
      <div className="bg-white rounded-lg border border-neutral-200 p-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="이메일, 사용자명으로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
              <svg className="w-5 h-5 text-neutral-400 absolute left-3 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="border border-neutral-300 rounded-lg px-3 py-2 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          >
            {statusOptions.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
          
          <div className="text-sm text-neutral-500">
            {filteredUsers.length}개 표시
          </div>
        </div>
      </div>

      {/* 사용자 목록 */}
      <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
        {error ? (
          <div className="p-6 text-center">
            <p className="text-red-600 mb-3">{error}</p>
            <button 
              onClick={fetchUsers} 
              className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
            >
              다시 시도
            </button>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-16">
            <svg className="w-12 h-12 mx-auto text-neutral-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
            <h3 className="text-lg font-medium text-neutral-900 mb-2">
              {searchTerm || selectedStatus !== '전체' ? '검색 결과가 없습니다' : '등록된 사용자가 없습니다'}
            </h3>
            <p className="text-neutral-500">
              {searchTerm || selectedStatus !== '전체' ? '다른 검색어나 필터를 시도해보세요' : '새로운 사용자가 가입하면 여기에 표시됩니다'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="text-left py-3 px-4 text-xs font-medium text-neutral-500 uppercase">사용자</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-neutral-500 uppercase">가입일</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-neutral-500 uppercase">마지막 활동</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-neutral-500 uppercase">상태</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-neutral-500 uppercase">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium mr-3">
                          {(user.username || user.email || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-neutral-900">
                            {user.full_name || user.username || '이름 없음'}
                          </div>
                          <div className="text-sm text-neutral-500">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-neutral-500">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="py-3 px-4 text-sm text-neutral-500">
                      {formatLastSeen(user.updated_at)}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2 py-1 text-xs rounded ${
                        user.is_banned 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {user.is_banned ? '비활성' : '활성'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleEditUser(user)}
                          className="px-2 py-1 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                        >
                          수정
                        </button>
                        <button
                          onClick={() => handleToggleUserStatus(user)}
                          className={`px-2 py-1 text-xs rounded transition-colors ${
                            user.is_banned 
                              ? 'text-green-600 hover:text-green-800 hover:bg-green-50' 
                              : 'text-orange-600 hover:text-orange-800 hover:bg-orange-50'
                          }`}
                        >
                          {user.is_banned ? '활성화' : '비활성화'}
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

      {/* 사용자 수정 모달 */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-neutral-900">사용자 정보 수정</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-neutral-500 hover:text-neutral-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4 mb-6">
              {/* 사용자 정보 표시 */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">이메일</label>
                <div className="text-sm text-neutral-900 bg-neutral-50 px-3 py-2 rounded border">
                  {editingUser.email}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">이름</label>
                <div className="text-sm text-neutral-900 bg-neutral-50 px-3 py-2 rounded border">
                  {editingUser.full_name || editingUser.username || '이름 없음'}
                </div>
              </div>

              {/* 역할 선택 */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">역할</label>
                <select
                  value={editingUser.role || 'customer'}
                  onChange={(e) => setEditingUser({...editingUser, role: e.target.value})}
                  className="w-full border border-neutral-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="customer">일반 사용자</option>
                  <option value="admin">관리자</option>
                </select>
              </div>

              {/* 가입일 */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">가입일</label>
                <div className="text-sm text-neutral-900 bg-neutral-50 px-3 py-2 rounded border">
                  {formatDate(editingUser.created_at)}
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-neutral-600 hover:text-neutral-800 transition-colors"
              >
                취소
              </button>
              <button
                onClick={() => handleUpdateUserRole(editingUser)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}