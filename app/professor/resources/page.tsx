'use client'

import { useState, useEffect } from 'react'
import { createSupabaseClient } from '../../lib/supabase-client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
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
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [resources, setResources] = useState<ProfessorResource[]>([])
  const [filteredResources, setFilteredResources] = useState<ProfessorResource[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedType, setSelectedType] = useState<string>('전체')
  const [selectedBook, setSelectedBook] = useState<string>('전체')
  const [books, setBooks] = useState<any[]>([])
  const supabase = createSupabaseClient()

  // 로그인 확인
  useEffect(() => {
    checkAuth()
  }, [])

  // 자료 목록 조회 (로그인 후에만)
  useEffect(() => {
    if (user) {
      fetchResources()
      fetchBooks()
    }
  }, [user])

  // 필터링
  useEffect(() => {
    filterResources()
  }, [resources, selectedType, selectedBook])

  const checkAuth = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        // 로그인되지 않은 경우 리다이렉트하지 않고 로그인 UI 표시
        setUser(null)
        setLoading(false)
        return
      }

      // 사용자 프로필 확인 (role 체크)
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, full_name, university, department')
        .eq('id', user.id)
        .single()

      if (!profileError && profile) {
        // professor_pending 상태면 접근 차단
        if (profile.role === 'professor_pending') {
          setUser({ ...user, profile })
          setLoading(false)
          return
        }
        
        // professor 또는 admin만 접근 허용
        if (profile.role === 'professor' || profile.role === 'admin') {
          setUser({ ...user, profile })
        } else {
          setUser({ ...user, profile })
        }
      } else {
        setUser({ ...user, profile: null })
      }
      
      setLoading(false)
    } catch (error) {
      console.error('인증 확인 실패:', error)
      setUser(null)
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          scopes: 'openid email profile https://www.googleapis.com/auth/drive'
        }
      })
      
      if (error) {
        console.error('로그인 오류:', error)
        alert('로그인 중 오류가 발생했습니다.')
      }
    } catch (error) {
      console.error('로그인 처리 오류:', error)
      alert('로그인 중 오류가 발생했습니다.')
    }
  }

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

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-6">
            <svg className="w-16 h-16 mx-auto text-primary-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">교수 자료실</h2>
            <p className="text-gray-600">
              교수 자료실에 접근하려면 로그인이 필요합니다.
            </p>
          </div>
          
          <div className="space-y-4">
            <Button 
              onClick={handleGoogleLogin}
              className="w-full"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google로 로그인
            </Button>
            
            <div className="text-sm text-gray-500">
              <p>골든래빗 출간 도서의 교수용 자료를 제공합니다.</p>
              <p className="mt-2">• 강의교안 • 소스코드 • 도서정보 • 판권자료</p>
            </div>
            
            <div className="pt-4 border-t border-gray-200">
              <Link href="/" className="text-primary-600 hover:text-primary-700 text-sm">
                ← 메인 페이지로 돌아가기
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 교수회원 대기 상태인 경우 접근 차단
  if (user?.profile?.role === 'professor_pending') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-6">
            <svg className="w-16 h-16 mx-auto text-yellow-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">교수회원 승인 대기 중</h2>
            <p className="text-gray-600 mb-4">
              교수회원 신청이 접수되었습니다.
            </p>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="text-sm text-yellow-800">
              <p className="font-medium mb-2">신청자 정보</p>
              <p><strong>이름:</strong> {user.profile.full_name || '정보 없음'}</p>
              <p><strong>소속:</strong> {user.profile.university} {user.profile.department && `- ${user.profile.department}`}</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              <p className="font-medium text-gray-800 mb-2">관리자 승인 후 이용 가능합니다</p>
              <p>승인이 완료되면 교수회원 자료실의 모든 자료를 다운로드하실 수 있습니다.</p>
            </div>
            
            <div className="pt-4 border-t border-gray-200 space-y-2">
              <Link 
                href="/professor" 
                className="inline-block text-primary-600 hover:text-primary-700 text-sm font-medium"
              >
                교수회원 신청 페이지로 이동
              </Link>
              <br />
              <Link 
                href="/" 
                className="text-gray-600 hover:text-gray-700 text-sm"
              >
                ← 메인 페이지로 돌아가기
              </Link>
            </div>
            
            <div className="text-xs text-gray-500 pt-4 border-t border-gray-200">
              승인 관련 문의: <a href="mailto:master@goldenrabbit.co.kr" className="text-primary-600 underline">master@goldenrabbit.co.kr</a>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 일반 사용자(교수가 아닌 경우)도 접근 차단
  if (user?.profile && user.profile.role !== 'professor' && user.profile.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-6">
            <svg className="w-16 h-16 mx-auto text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">교수 자료실</h2>
            <p className="text-gray-600">
              교수회원만 이용할 수 있는 서비스입니다.
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                교수회원으로 가입하시면 골든래빗 출간 도서의 강의교안, 소스코드, 도서정보, 판권자료를 다운로드하실 수 있습니다.
              </p>
            </div>
            
            <Link 
              href="/professor"
              className="inline-block w-full px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
            >
              교수회원 가입하기
            </Link>
            
            <div className="pt-4 border-t border-gray-200">
              <Link href="/" className="text-gray-600 hover:text-gray-700 text-sm">
                ← 메인 페이지로 돌아가기
              </Link>
            </div>
          </div>
        </div>
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