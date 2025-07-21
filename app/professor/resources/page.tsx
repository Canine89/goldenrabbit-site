'use client'

import { useState, useEffect } from 'react'
import { createSupabaseClient } from '../../lib/supabase-client'
import Button from '../../components/ui/Button'
import Loading from '../../components/ui/Loading'

type ResourceType = 'lecture_slides' | 'source_code' | 'book_info' | 'copyright'

interface ProfessorResource {
  id: string
  book_id: string | null
  resource_type: ResourceType
  title: string
  description?: string
  file_url?: string
  download_count: number
  is_active: boolean
  created_at: string
  books?: {
    title: string
    author: string
    category: string
    cover_image_url?: string
  } | null
}

interface SupabaseResource extends Omit<ProfessorResource, 'books'> {
  books: { title: string; author: string; category: string }[] | null
}

export default function ProfessorResourcesPage() {
  const [resources, setResources] = useState<ProfessorResource[]>([])
  const [filteredResources, setFilteredResources] = useState<ProfessorResource[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedType, setSelectedType] = useState<string>('전체')
  const [selectedBook, setSelectedBook] = useState<string>('전체')
  const [books, setBooks] = useState<any[]>([])
  const supabase = createSupabaseClient()

  // 자료 목록 조회
  useEffect(() => {
    fetchResources()
    fetchBooks()
  }, [])

  // 필터링
  useEffect(() => {
    filterResources()
  }, [resources, selectedType, selectedBook])

  const fetchResources = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // 먼저 professor_resources 데이터 조회
      const { data: resourcesData, error: resourcesError } = await supabase
        .from('professor_resources')
        .select(`
          id,
          book_id,
          resource_type,
          title,
          description,
          file_url,
          download_count,
          is_active,
          created_at
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (resourcesError) throw resourcesError
      
      // book_id가 있는 항목들의 도서 정보 따로 조회
      const resourcesWithBooks: ProfessorResource[] = []
      
      for (const resource of resourcesData || []) {
        let bookInfo = null
        
        if (resource.book_id) {
          const { data: bookData, error: bookError } = await supabase
            .from('books')
            .select('title, author, category, cover_image_url')
            .eq('id', resource.book_id)
            .single()
          
          if (!bookError && bookData) {
            bookInfo = bookData
          }
        }
        
        resourcesWithBooks.push({
          ...resource,
          books: bookInfo
        })
      }
      
      setResources(resourcesWithBooks)
      setFilteredResources(resourcesWithBooks)
    } catch (error: any) {
      setError(`자료를 불러오는데 실패했습니다: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const fetchBooks = async () => {
    try {
      const { data, error } = await supabase
        .from('books')
        .select('id, title, author')
        .eq('is_active', true)
        .order('title')

      if (error) throw error
      setBooks(data || [])
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

    setFilteredResources(filtered)
  }

  const handleDownload = async (resource: ProfessorResource) => {
    if (!resource.file_url) {
      alert('다운로드 링크가 없습니다.')
      return
    }

    try {
      // 다운로드 카운트 증가
      await supabase
        .from('professor_resources')
        .update({ download_count: resource.download_count + 1 })
        .eq('id', resource.id)

      // 새 탭에서 파일 열기
      window.open(resource.file_url, '_blank')
      
      // 로컬 상태 업데이트
      setResources(prev => prev.map(r => 
        r.id === resource.id 
          ? { ...r, download_count: r.download_count + 1 }
          : r
      ))
      setFilteredResources(prev => prev.map(r => 
        r.id === resource.id 
          ? { ...r, download_count: r.download_count + 1 }
          : r
      ))
    } catch (error) {
      console.error('다운로드 실패:', error)
      alert('다운로드 중 오류가 발생했습니다.')
    }
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

  const getCategoryColor = (category: string) => {
    const colors = {
      '경제경영': 'bg-purple-100 text-purple-800',
      'IT전문서': 'bg-blue-100 text-blue-800',
      'IT활용서': 'bg-cyan-100 text-cyan-800',
      '학습만화': 'bg-yellow-100 text-yellow-800',
      '좋은여름': 'bg-green-100 text-green-800',
      '수상작품': 'bg-red-100 text-red-800'
    }
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loading size="lg" text="자료를 불러오는 중..." />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">교수 자료실</h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            골든래빗에서 출간한 도서의 교수용 자료를 제공합니다.<br />
            강의교안, 소스코드, 도서정보, 판권 자료를 확인하실 수 있습니다.
          </p>
          <div className="mt-4 text-sm text-gray-500">
            총 {resources.length}개의 자료가 등록되어 있습니다.
          </div>
        </div>

        {/* 필터 바 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="flex items-center gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  자료 유형
                </label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="전체">전체</option>
                  <option value="강의교안">강의교안</option>
                  <option value="소스코드">소스코드</option>
                  <option value="도서정보">도서정보</option>
                  <option value="판권">판권</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  도서 선택
                </label>
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
              </div>
            </div>

            <div className="text-sm text-gray-500 md:ml-auto">
              {filteredResources.length}개 자료 표시
            </div>
          </div>
        </div>

        {/* 자료 목록 */}
        {error ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="text-red-600 mb-4">
              <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-lg font-medium">{error}</p>
            </div>
            <button 
              onClick={fetchResources} 
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              다시 시도
            </button>
          </div>
        ) : filteredResources.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm text-center py-16">
            <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              {selectedType === '전체' && selectedBook === '전체'
                ? '등록된 자료가 없습니다'
                : '조건에 맞는 자료가 없습니다'
              }
            </h3>
            <p className="text-gray-500">
              {selectedType === '전체' && selectedBook === '전체'
                ? '곧 유용한 교수 자료들이 등록될 예정입니다.'
                : '다른 필터 조건을 시도해보세요.'
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredResources.map((resource) => (
              <div key={resource.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                <div className="p-6">
                  {/* 헤더 */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${getResourceTypeColor(resource.resource_type)} mb-2`}>
                        {getResourceTypeLabel(resource.resource_type)}
                      </span>
                      {resource.books && (
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {resource.books.title}
                        </h3>
                      )}
                    </div>
                  </div>

                  {/* 도서 정보 */}
                  {resource.books && (
                    <div className="mb-4 pb-4 border-b border-gray-100">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm text-gray-600">저자:</span>
                        <span className="text-sm font-medium text-gray-900">{resource.books.author}</span>
                      </div>
                      {resource.books.category && (
                        <span className={`inline-block px-2 py-1 text-xs rounded ${getCategoryColor(resource.books.category)}`}>
                          {resource.books.category}
                        </span>
                      )}
                    </div>
                  )}

                  {/* 자료 정보 */}
                  <div className="mb-4">
                    <div className="text-sm text-gray-500 mb-2">
                      등록일: {new Date(resource.created_at).toLocaleDateString('ko-KR')}
                    </div>
                    <div className="text-sm text-gray-500">
                      다운로드: {resource.download_count}회
                    </div>
                  </div>

                  {/* 다운로드 버튼 */}
                  <button
                    onClick={() => handleDownload(resource)}
                    disabled={!resource.file_url}
                    className={`w-full px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                      resource.file_url
                        ? 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {resource.file_url ? (
                      <div className="flex items-center justify-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        자료 다운로드
                      </div>
                    ) : (
                      '파일을 준비 중입니다'
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}