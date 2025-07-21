'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseClient } from '../../lib/supabase-client'
import SmartImage from '../../components/SmartImage'
import Loading from '../../components/ui/Loading'
import Button from '../../components/ui/Button'
import RichTextEditor from '../../components/RichTextEditor'

interface Article {
  id: string
  title: string
  content?: string
  excerpt?: string
  featured_image_url?: string
  category: string
  tags?: string[]
  is_featured: boolean
  is_published: boolean
  created_at: string
  updated_at: string
}

interface FormData {
  title: string
  excerpt: string
  content: string
  featured_image_url: string
  category: string
  tags: string
  is_featured: boolean
  is_published: boolean
}

export default function ArticleManagementPage() {
  const router = useRouter()
  const [articles, setArticles] = useState<Article[]>([])
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingArticle, setEditingArticle] = useState<Article | null>(null)
  const [selectedCategory, setSelectedCategory] = useState('전체')
  const [selectedStatus, setSelectedStatus] = useState('전체')
  const [formData, setFormData] = useState<FormData>({
    title: '',
    excerpt: '',
    content: '',
    featured_image_url: '',
    category: 'tech',
    tags: '',
    is_featured: false,
    is_published: true,
  })

  const supabase = createSupabaseClient()
  const categories = ['tech', 'news', 'event', 'notice']
  const allCategories = ['전체', ...categories]
  const statusOptions = ['전체', '발행됨', '임시저장']

  // 관리자 권한 확인
  useEffect(() => {
    checkAdminAuth()
  }, [])

  // 아티클 목록 조회
  useEffect(() => {
    if (isAdmin) {
      fetchArticles()
    }
  }, [isAdmin])

  // 필터링
  useEffect(() => {
    filterArticles()
  }, [articles, selectedCategory, selectedStatus])

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

  const fetchArticles = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      setArticles(data || [])
      setFilteredArticles(data || [])
    } catch (error: any) {
      setError(`아티클 목록을 불러오는데 실패했습니다: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const filterArticles = () => {
    let filtered = articles

    if (selectedCategory !== '전체') {
      filtered = filtered.filter(article => article.category === selectedCategory)
    }

    if (selectedStatus !== '전체') {
      const isPublished = selectedStatus === '발행됨'
      filtered = filtered.filter(article => article.is_published === isPublished)
    }

    setFilteredArticles(filtered)
  }

  const resetForm = () => {
    setFormData({
      title: '',
      excerpt: '',
      content: '',
      featured_image_url: '',
      category: 'tech',
      tags: '',
      is_featured: false,
      is_published: true,
    })
    setEditingArticle(null)
    setShowAddForm(false)
  }

  const handleEdit = (article: Article) => {
    setFormData({
      title: article.title,
      excerpt: article.excerpt || '',
      content: article.content || '',
      featured_image_url: article.featured_image_url || '',
      category: article.category,
      tags: article.tags ? article.tags.join(', ') : '',
      is_featured: article.is_featured,
      is_published: article.is_published,
    })
    setEditingArticle(article)
    setShowAddForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const tagsArray = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
      
      const articleData = {
        title: formData.title,
        excerpt: formData.excerpt,
        content: formData.content,
        featured_image_url: formData.featured_image_url,
        category: formData.category,
        tags: tagsArray,
        is_featured: formData.is_featured,
        is_published: formData.is_published,
      }

      if (editingArticle) {
        const { error } = await supabase
          .from('articles')
          .update(articleData)
          .eq('id', editingArticle.id)

        if (error) throw error
        alert('아티클이 성공적으로 수정되었습니다.')
      } else {
        const { error } = await supabase
          .from('articles')
          .insert([articleData])

        if (error) throw error
        alert('아티클이 성공적으로 등록되었습니다.')
      }

      resetForm()
      fetchArticles()
    } catch (error: any) {
      alert(`아티클 저장 중 오류가 발생했습니다: ${error.message}`)
    }
  }

  const handleDelete = async (article: Article) => {
    if (!confirm(`"${article.title}" 아티클을 완전히 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('articles')
        .delete()
        .eq('id', article.id)

      if (error) throw error

      alert('아티클이 삭제되었습니다.')
      fetchArticles()
    } catch (error: any) {
      alert(`아티클 삭제 중 오류가 발생했습니다: ${error.message}`)
    }
  }

  const handleTogglePublished = async (article: Article) => {
    const newStatus = !article.is_published
    const action = newStatus ? '발행' : '임시저장'
    
    if (!confirm(`"${article.title}" 아티클을 ${action} 하시겠습니까?`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('articles')
        .update({ is_published: newStatus })
        .eq('id', article.id)

      if (error) throw error

      alert(`아티클이 ${action}되었습니다.`)
      fetchArticles()
    } catch (error: any) {
      alert(`아티클 ${action} 중 오류가 발생했습니다: ${error.message}`)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // 글 내용에서 첫 번째 이미지 URL 추출
  const extractFirstImage = (content?: string) => {
    if (!content) return null
    
    const imgRegex = /<img[^>]+src="([^"]+)"[^>]*>/i
    const match = content.match(imgRegex)
    
    if (match && match[1]) {
      let imageSrc = match[1]
      
      // 구글 드라이브 이미지인 경우 그대로 사용
      if (imageSrc.includes('googleusercontent.com') || imageSrc.includes('drive.google.com')) {
        return imageSrc
      }
      // goldenrabbit.co.kr 이미지는 프록시 사용
      else if (imageSrc.includes('goldenrabbit.co.kr')) {
        return `https://images.weserv.nl/?url=${encodeURIComponent(imageSrc)}`
      }
      // 기타 일반 이미지
      else {
        return imageSrc
      }
    }
    
    return null
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 상단 네비게이션 */}
        <div className="mb-6">
          <Link href="/admin" className="inline-flex items-center text-primary-600 hover:text-primary-700">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            관리자 대시보드로 돌아가기
          </Link>
        </div>

        {/* 헤더 */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">아티클 관리</h1>
            <p className="text-gray-600 mt-1">총 {articles.length}개의 아티클 등록됨</p>
          </div>
          <Button
            onClick={() => setShowAddForm(true)}
            className="px-6 py-3"
          >
            + 새 아티클 추가
          </Button>
        </div>

        {/* 필터 바 */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center gap-4">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              {allCategories.map(category => (
                <option key={category} value={category}>{category}</option>
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
              {filteredArticles.length}개 표시
            </div>
          </div>
        </div>

        {/* 아티클 등록/수정 폼 */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[95vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingArticle ? '아티클 수정' : '새 아티클 등록'}
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
                {/* 기본 정보 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      제목 *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      카테고리 *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      required
                    >
                      <option value="tech">기술</option>
                      <option value="news">뉴스</option>
                      <option value="event">이벤트</option>
                      <option value="notice">공지사항</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      피처드 이미지 URL
                    </label>
                    <input
                      type="url"
                      value={formData.featured_image_url}
                      onChange={(e) => setFormData({...formData, featured_image_url: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="구글 드라이브 공유 링크 또는 이미지 URL"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      태그 (쉼표로 구분)
                    </label>
                    <input
                      type="text"
                      value={formData.tags}
                      onChange={(e) => setFormData({...formData, tags: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="React, Next.js, TypeScript"
                    />
                  </div>
                </div>

                {/* 요약 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    요약
                  </label>
                  <textarea
                    value={formData.excerpt}
                    onChange={(e) => setFormData({...formData, excerpt: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    rows={3}
                    placeholder="아티클의 간단한 요약을 작성하세요"
                  />
                </div>

                {/* 본문 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    본문 *
                  </label>
                  <RichTextEditor
                    value={formData.content}
                    onChange={(content) => setFormData({...formData, content})}
                    placeholder="아티클 본문을 작성하세요... 툴바를 사용하여 서식을 지정하고 이미지를 업로드할 수 있습니다."
                  />
                </div>

                <div className="flex items-center gap-6">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="is_featured"
                      checked={formData.is_featured}
                      onChange={(e) => setFormData({...formData, is_featured: e.target.checked})}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor="is_featured" className="ml-2 block text-sm text-gray-700">
                      추천 아티클로 설정
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="is_published"
                      checked={formData.is_published}
                      onChange={(e) => setFormData({...formData, is_published: e.target.checked})}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor="is_published" className="ml-2 block text-sm text-gray-700">
                      즉시 발행
                    </label>
                  </div>
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
                    {editingArticle ? '수정' : '등록'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 아티클 목록 */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {error ? (
            <div className="p-6 text-center">
              <p className="text-red-600 mb-3">{error}</p>
              <button 
                onClick={fetchArticles} 
                className="px-4 py-2 text-sm text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-lg"
              >
                다시 시도
              </button>
            </div>
          ) : filteredArticles.length === 0 ? (
            <div className="text-center py-16">
              <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {selectedCategory === '전체' && selectedStatus === '전체' 
                  ? '등록된 아티클이 없습니다'
                  : '조건에 맞는 아티클이 없습니다'
                }
              </h3>
              <p className="text-gray-500">
                {selectedCategory === '전체' && selectedStatus === '전체' 
                  ? '새 아티클을 추가해보세요'
                  : '다른 필터를 시도해보세요'
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">아티클</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">카테고리</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">상태</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">작성일</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredArticles.map((article) => {
                    const firstImage = extractFirstImage(article.content)
                    const imageUrl = firstImage || article.featured_image_url
                    
                    return (
                      <tr key={article.id} className="hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <div className="w-16 h-12 mr-3 flex-shrink-0">
                              {imageUrl ? (
                                <SmartImage
                                  src={imageUrl}
                                  alt={article.title}
                                  width={64}
                                  height={48}
                                  className="w-full h-full object-cover rounded"
                                />
                              ) : (
                                <div className="w-full h-full rounded bg-gray-200 flex items-center justify-center">
                                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <button
                                onClick={() => handleEdit(article)}
                                className="text-sm font-medium text-gray-900 mb-1 hover:text-primary-600 text-left transition-colors cursor-pointer"
                                title="클릭하여 수정"
                              >
                                {article.title}
                              </button>
                              <div className="text-sm text-gray-600">
                                {article.excerpt && article.excerpt.substring(0, 50)}
                                {article.excerpt && article.excerpt.length > 50 && '...'}
                              </div>
                              {article.is_featured && (
                                <span className="inline-block mt-1 px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">
                                  추천
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                            {article.category === 'tech' ? '기술' :
                             article.category === 'news' ? '뉴스' :
                             article.category === 'event' ? '이벤트' :
                             article.category === 'notice' ? '공지사항' : article.category}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-block px-2 py-1 text-xs rounded ${
                            article.is_published 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {article.is_published ? '발행됨' : '임시저장'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-500">
                          {formatDate(article.created_at)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleEdit(article)}
                              className="px-3 py-1 text-xs text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded"
                            >
                              수정
                            </button>
                            <button
                              onClick={() => handleTogglePublished(article)}
                              className={`px-3 py-1 text-xs rounded ${
                                article.is_published 
                                  ? 'text-orange-600 hover:text-orange-800 bg-orange-50 hover:bg-orange-100' 
                                  : 'text-green-600 hover:text-green-800 bg-green-50 hover:bg-green-100'
                              }`}
                            >
                              {article.is_published ? '임시저장' : '발행'}
                            </button>
                            <button
                              onClick={() => handleDelete(article)}
                              className="px-3 py-1 text-xs text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 rounded"
                            >
                              삭제
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}