'use client'

import { useState, useEffect, useTransition } from 'react'
import { createSupabaseClient } from '../../lib/supabase-client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Button from '../../components/ui/Button'
import Loading from '../../components/ui/Loading'
import { 
  createProfessorResource, 
  updateProfessorResource, 
  deleteProfessorResource, 
  toggleResourceStatus, 
  getAdminResources 
} from '../../../lib/actions/resource-actions'
import { getAdminBooks } from '../../../lib/actions/book-actions'

type ResourceType = 'lecture_slides' | 'source_code' | 'book_info' | 'copyright'

interface ProfessorResource {
  id: string
  book_id: string | null
  resource_type: ResourceType
  title: string
  description?: string
  file_url?: string
  download_count?: number
  is_active: boolean
  created_at: string
  updated_at?: string
  books?: {
    id?: string
    title: string
    author?: string
  } | null
}

interface SupabaseResource extends Omit<ProfessorResource, 'books'> {
  books: { title: string }[] | null
}

export default function ProfessorResourcesPage() {
  const router = useRouter()
  const [resources, setResources] = useState<ProfessorResource[]>([])
  const [filteredResources, setFilteredResources] = useState<ProfessorResource[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingResource, setEditingResource] = useState<ProfessorResource | null>(null)
  const [books, setBooks] = useState<any[]>([])
  const [selectedType, setSelectedType] = useState('전체')
  const [selectedBook, setSelectedBook] = useState('전체')
  const [selectedStatus, setSelectedStatus] = useState('전체')
  const [isPending, startTransition] = useTransition()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    book_id: '',
    resource_type: 'lecture_slides' as ResourceType,
    file_url: '',
    is_active: true
  })
  const supabase = createSupabaseClient()

  const resourceTypes = ['전체', '강의교안', '소스코드', '도서정보', '판권']
  const statusOptions = ['전체', '활성', '비활성']

  // 관리자 권한 확인
  useEffect(() => {
    checkAdminAuth()
  }, [])

  // 자료 목록 조회
  useEffect(() => {
    if (isAdmin) {
      fetchResources()
      fetchBooks()
    }
  }, [isAdmin])

  // 필터링
  useEffect(() => {
    filterResources()
  }, [resources, selectedType, selectedBook, selectedStatus])

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

  const fetchResources = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const result = await getAdminResources(1, 1000) // 모든 자료 가져오기
      
      if (!result.success) {
        throw new Error(result.error)
      }
      
      setResources(result.data.resources)
      setFilteredResources(result.data.resources)
    } catch (error: any) {
      setError(`자료 목록을 불러오는데 실패했습니다: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const fetchBooks = async () => {
    try {
      const result = await getAdminBooks(1, 1000)
      
      if (result.success) {
        // 활성 도서만 필터링
        const activeBooks = result.data.books.filter(book => book.is_active)
        setBooks(activeBooks)
      } else {
        console.error('도서 조회 실패:', result.error)
      }
    } catch (error) {
      console.error('도서 조회 실패:', error)
    }
  }

  const filterResources = () => {
    let filtered = resources

    if (selectedType !== '전체') {
      const typeMapping = {
        '강의교안': 'lecture_slides',
        '소스코드': 'source_code',
        '도서정보': 'book_info',
        '판권': 'copyright'
      }
      filtered = filtered.filter(resource => resource.resource_type === typeMapping[selectedType as keyof typeof typeMapping])
    }

    if (selectedBook !== '전체') {
      filtered = filtered.filter(resource => resource.book_id === selectedBook)
    }

    if (selectedStatus !== '전체') {
      const isActive = selectedStatus === '활성'
      filtered = filtered.filter(resource => resource.is_active === isActive)
    }

    setFilteredResources(filtered)
  }

  const resetForm = () => {
    setFormData({
      book_id: '',
      resource_type: 'lecture_slides' as ResourceType,
      file_url: '',
      is_active: true
    })
    setEditingResource(null)
    setShowAddModal(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError(null)
    
    startTransition(async () => {
      try {
        // FormData 객체 생성
        const formDataObj = new FormData()
        
        formDataObj.append('book_id', formData.book_id)
        formDataObj.append('resource_type', formData.resource_type)
        formDataObj.append('file_url', formData.file_url)
        formDataObj.append('is_active', formData.is_active.toString())

        let result
        if (editingResource) {
          formDataObj.append('id', editingResource.id)
          result = await updateProfessorResource(formDataObj)
        } else {
          result = await createProfessorResource(formDataObj)
        }

        if (!result.success) {
          throw new Error(result.error)
        }

        alert(result.message || (editingResource ? '자료가 성공적으로 수정되었습니다.' : '자료가 성공적으로 등록되었습니다.'))
        resetForm()
        fetchResources()
      } catch (error: any) {
        setSubmitError(`자료 저장 중 오류가 발생했습니다: ${error.message}`)
      }
    })
  }

  const handleEdit = (resource: ProfessorResource) => {
    setEditingResource(resource)
    setFormData({
      book_id: resource.book_id || '',
      resource_type: resource.resource_type,
      file_url: resource.file_url || '',
      is_active: resource.is_active
    })
    setShowAddModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return

    startTransition(async () => {
      try {
        const result = await deleteProfessorResource(id)

        if (!result.success) {
          throw new Error(result.error)
        }

        alert(result.message || '자료가 삭제되었습니다.')
        fetchResources()
      } catch (error: any) {
        alert(`자료 삭제 중 오류가 발생했습니다: ${error.message}`)
      }
    })
  }

  const handleToggleActive = async (resource: ProfessorResource) => {
    const newStatus = !resource.is_active
    const action = newStatus ? '활성화' : '비활성화'
    
    if (!confirm(`"${resource.title}" 자료를 ${action} 하시겠습니까?`)) {
      return
    }

    startTransition(async () => {
      try {
        const result = await toggleResourceStatus(resource.id, newStatus)

        if (!result.success) {
          throw new Error(result.error)
        }

        alert(result.message || `자료가 ${action}되었습니다.`)
        fetchResources()
      } catch (error: any) {
        alert(`자료 ${action} 중 오류가 발생했습니다: ${error.message}`)
      }
    })
  }

  const getResourceTypeLabel = (type: string) => {
    const labels = {
      lecture_slides: '강의교안',
      source_code: '소스코드',
      book_info: '도서정보',
      copyright: '판권'
    }
    return labels[type as keyof typeof labels] || type
  }

  const getResourceTypeColor = (type: string) => {
    const colors = {
      lecture_slides: 'bg-blue-100 text-blue-800',
      source_code: 'bg-green-100 text-green-800',
      book_info: 'bg-primary-100 text-primary-800',
      copyright: 'bg-gray-100 text-gray-800'
    }
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800'
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
            <h1 className="text-3xl font-bold text-gray-900">교수 자료 관리</h1>
            <p className="text-gray-600 mt-1">총 {resources.length}개의 자료 등록됨</p>
          </div>
          <Button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3"
          >
            + 새 자료 추가
          </Button>
        </div>

        {/* 필터 바 */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center gap-4">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              {resourceTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            
            <select
              value={selectedBook}
              onChange={(e) => setSelectedBook(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="전체">전체 도서</option>
              {books.map(book => (
                <option key={book.id} value={book.id}>{book.title}</option>
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

            <div className="text-sm text-gray-500 ml-auto">
              {filteredResources.length}개 표시
            </div>
          </div>
        </div>

        {/* 자료 목록 */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {error ? (
            <div className="p-6 text-center">
              <p className="text-red-600 mb-3">{error}</p>
              <button 
                onClick={fetchResources} 
                className="px-4 py-2 text-sm text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-lg"
              >
                다시 시도
              </button>
            </div>
          ) : filteredResources.length === 0 ? (
            <div className="text-center py-16">
              <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {selectedType === '전체' && selectedStatus === '전체'
                  ? '등록된 자료가 없습니다'
                  : '조건에 맞는 자료가 없습니다'
                }
              </h3>
              <p className="text-gray-500">
                {selectedType === '전체' && selectedStatus === '전체'
                  ? '새 자료를 추가해보세요'
                  : '다른 필터를 시도해보세요'
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">도서</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">자료 유형</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">파일 URL</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">다운로드</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">상태</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">등록일</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredResources.map((resource) => (
                    <tr key={resource.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm text-gray-900">
                        {resource.books?.title || '미선택'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-1 text-xs rounded ${getResourceTypeColor(resource.resource_type)}`}>
                          {getResourceTypeLabel(resource.resource_type)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="min-w-0">
                          {resource.file_url ? (
                            <a
                              href={resource.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:text-blue-800"
                              title={resource.file_url}
                            >
                              {resource.file_url.length > 30 
                                ? `${resource.file_url.substring(0, 30)}...`
                                : resource.file_url
                              }
                            </a>
                          ) : (
                            <span className="text-sm text-gray-400">파일 URL 없음</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm font-medium text-gray-900">
                        {resource.download_count}회
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-1 text-xs rounded ${
                          resource.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {resource.is_active ? '활성' : '비활성'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500">
                        {new Date(resource.created_at).toLocaleDateString('ko-KR')}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEdit(resource)}
                            className="px-3 py-1 text-xs text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded"
                          >
                            수정
                          </button>
                          <button
                            onClick={() => handleToggleActive(resource)}
                            className={`px-3 py-1 text-xs rounded ${
                              resource.is_active 
                                ? 'text-orange-600 hover:text-orange-800 bg-orange-50 hover:bg-orange-100' 
                                : 'text-green-600 hover:text-green-800 bg-green-50 hover:bg-green-100'
                            }`}
                          >
                            {resource.is_active ? '비활성화' : '활성화'}
                          </button>
                          <button
                            onClick={() => handleDelete(resource.id)}
                            className="px-3 py-1 text-xs text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 rounded"
                          >
                            삭제
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

      {/* 자료 추가/수정 모달 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[95vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {editingResource ? '자료 수정' : '새 자료 추가'}
              </h2>
              <button
                onClick={resetForm}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  도서 선택
                </label>
                <select
                  value={formData.book_id}
                  onChange={(e) => setFormData({ ...formData, book_id: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">도서를 선택하세요 (선택사항)</option>
                  {books.map((book) => (
                    <option key={book.id} value={book.id}>
                      {book.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  자료 유형 *
                </label>
                <select
                  value={formData.resource_type}
                  onChange={(e) => setFormData({ ...formData, resource_type: e.target.value as any })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                >
                  <option value="lecture_slides">강의교안</option>
                  <option value="source_code">소스코드</option>
                  <option value="book_info">도서정보</option>
                  <option value="copyright">판권</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  파일 URL *
                </label>
                <input
                  type="url"
                  value={formData.file_url}
                  onChange={(e) => setFormData({ ...formData, file_url: e.target.value })}
                  placeholder="https://..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">활성화</span>
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  취소
                </button>
                <Button type="submit" className="px-6 py-2">
                  {editingResource ? '수정' : '등록'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}