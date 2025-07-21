import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import Button from '../../components/ui/Button'
import RichTextEditor from '../../components/admin/RichTextEditor'
import SmartImage from '../../components/common/SmartImage'

export default function ArticleManagement() {
  const { user, profile } = useAuth()
  const [articles, setArticles] = useState([])
  const [filteredArticles, setFilteredArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingArticle, setEditingArticle] = useState(null)
  const [selectedStatus, setSelectedStatus] = useState('전체')
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    featured_image_url: '',
    is_featured: false,
    tags: '',
    category: ''
  })

  const statusOptions = ['전체', '공개', '비공개']
  const categoryOptions = ['이벤트', '공지사항', '신간소식', '래빗레터']

  useEffect(() => {
    fetchArticles()
  }, [])

  const fetchArticles = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Articles fetch error:', error)
        throw error
      }
      setArticles(data || [])
      setFilteredArticles(data || [])
    } catch (error) {
      setError(`아티클 목록을 불러오는데 실패했습니다: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const filterArticles = () => {
    let filtered = articles

    if (selectedStatus !== '전체') {
      const isPublished = selectedStatus === '공개'
      filtered = filtered.filter(article => article.is_published === isPublished)
    }

    setFilteredArticles(filtered)
  }

  useEffect(() => {
    filterArticles()
  }, [articles, selectedStatus])

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      excerpt: '',
      featured_image_url: '',
      is_featured: false,
      tags: '',
      category: ''
    })
    setEditingArticle(null)
    setShowAddForm(false)
  }

  const handleEdit = (article) => {
    setFormData({
      title: article.title,
      content: article.content || '',
      excerpt: article.excerpt || '',
      featured_image_url: article.featured_image_url || '',
      is_featured: article.is_featured || false,
      tags: article.tags ? (Array.isArray(article.tags) ? article.tags.join(', ') : '') : '',
      category: article.category || ''
    })
    setEditingArticle(article)
    setShowAddForm(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      // 모든 필드 포함
      const baseData = {
        title: formData.title,
        content: formData.content,
        excerpt: formData.excerpt,
        featured_image_url: formData.featured_image_url,
        is_featured: formData.is_featured,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
        category: formData.category
      }

      if (editingArticle) {
        // 수정 시
        const { error } = await supabase
          .from('articles')
          .update(baseData)
          .eq('id', editingArticle.id)

        if (error) {
          console.error('Update error:', error)
          throw error
        }
        alert('아티클이 성공적으로 수정되었습니다.')
      } else {
        // 새 글 작성 시에는 author_id 추가
        const articleData = {
          ...baseData,
          author_id: user.id
        }
        
        const { error } = await supabase
          .from('articles')
          .insert([articleData])

        if (error) {
          console.error('Insert error:', error)
          throw error
        }
        alert('아티클이 성공적으로 등록되었습니다.')
      }

      resetForm()
      fetchArticles()
    } catch (error) {
      console.error('Submit error:', error)
      alert(`아티클 저장 중 오류가 발생했습니다: ${error.message}`)
    }
  }

  const handleDelete = async (article) => {
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
    } catch (error) {
      alert('아티클 삭제 중 오류가 발생했습니다.')
    }
  }

  const handleTogglePublished = async (article) => {
    const newStatus = !article.is_published
    const action = newStatus ? '공개' : '비공개'
    
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
    } catch (error) {
      alert(`아티클 ${action} 중 오류가 발생했습니다.`)
    }
  }

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* 심플한 헤더 */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">아티클 관리</h1>
          <p className="text-neutral-600 mt-1">총 {articles.length}개의 아티클 등록됨</p>
        </div>
        <Button
          onClick={() => setShowAddForm(true)}
          variant="primary"
          className="px-4 py-2"
        >
          + 새 아티클 작성
        </Button>
      </div>

      {/* 컴팩트한 필터 바 */}
      <div className="bg-white rounded-lg border border-neutral-200 p-4 mb-6">
        <div className="flex items-center gap-4">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="border border-neutral-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
          >
            {statusOptions.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>

          <div className="text-sm text-neutral-500 ml-auto">
            {filteredArticles.length}개 표시
          </div>
        </div>
      </div>

      {/* 아티클 등록/수정 폼 */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-[95vw] max-h-[95vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-neutral-900">
                {editingArticle ? '아티클 수정' : '새 아티클 작성'}
              </h2>
              <button
                onClick={resetForm}
                className="text-neutral-400 hover:text-neutral-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 제목 */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  제목 *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full border border-neutral-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent text-lg"
                  placeholder="아티클 제목을 입력하세요"
                  required
                />
              </div>

              {/* 요약 */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  요약
                </label>
                <textarea
                  value={formData.excerpt}
                  onChange={(e) => setFormData({...formData, excerpt: e.target.value})}
                  className="w-full border border-neutral-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  rows="3"
                  placeholder="아티클 요약을 입력하세요"
                />
              </div>

              {/* 카테고리 */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  카테고리 *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full border border-neutral-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                >
                  <option value="">카테고리를 선택하세요</option>
                  {categoryOptions.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              {/* 태그 */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  태그
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({...formData, tags: e.target.value})}
                  className="w-full border border-neutral-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="태그를 쉼표로 구분해서 입력하세요 (예: React, JavaScript, 개발)"
                />
              </div>

              {/* 컨텐츠 에디터 */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  내용 *
                </label>
                <RichTextEditor
                  value={formData.content}
                  onChange={(content) => setFormData({...formData, content})}
                  placeholder="아티클 내용을 작성하세요..."
                />
              </div>

              {/* 추천 아티클 */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_featured"
                  checked={formData.is_featured}
                  onChange={(e) => setFormData({...formData, is_featured: e.target.checked})}
                  className="h-4 w-4 text-primary-500 focus:ring-primary-500 border-neutral-300 rounded"
                />
                <label htmlFor="is_featured" className="ml-2 block text-sm text-neutral-700">
                  추천 아티클로 설정
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-neutral-600 hover:text-neutral-800 transition-colors"
                >
                  취소
                </button>
                <Button
                  type="submit"
                  variant="primary"
                  className="px-6 py-2"
                >
                  {editingArticle ? '수정' : '등록'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 심플한 아티클 목록 */}
      <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
        {error ? (
          <div className="p-6 text-center">
            <p className="text-red-600 mb-3">{error}</p>
            <button 
              onClick={fetchArticles} 
              className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
            >
              다시 시도
            </button>
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="text-center py-16">
            <svg className="w-12 h-12 mx-auto text-neutral-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-medium text-neutral-900 mb-2">
              {selectedStatus === '전체' 
                ? '등록된 아티클이 없습니다'
                : '조건에 맞는 아티클이 없습니다'
              }
            </h3>
            <p className="text-neutral-500">
              {selectedStatus === '전체' 
                ? '새 아티클을 작성해보세요'
                : '다른 필터를 시도해보세요'
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="text-left py-3 px-4 text-xs font-medium text-neutral-500 uppercase">아티클</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-neutral-500 uppercase">카테고리</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-neutral-500 uppercase">태그</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-neutral-500 uppercase">상태</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-neutral-500 uppercase">작성일</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-neutral-500 uppercase">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {filteredArticles.map((article) => (
                  <tr key={article.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="py-3 px-4">
                      <div>
                        <div className="text-sm font-medium text-neutral-900 mb-1">
                          {article.title}
                          {article.is_featured && (
                            <span className="ml-2 inline-block px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">
                              추천
                            </span>
                          )}
                        </div>
                        {article.excerpt && (
                          <div className="text-sm text-neutral-600 line-clamp-2">
                            {article.excerpt}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {article.category ? (
                        <span className="inline-block px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded">
                          {article.category}
                        </span>
                      ) : (
                        <span className="text-xs text-neutral-400">카테고리 없음</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {article.tags && article.tags.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {article.tags.slice(0, 3).map((tag, index) => (
                            <span key={index} className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                              {tag}
                            </span>
                          ))}
                          {article.tags.length > 3 && (
                            <span className="text-xs text-neutral-500">+{article.tags.length - 3}</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-neutral-400">태그 없음</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2 py-1 text-xs rounded ${
                        article.is_published 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {article.is_published ? '공개' : '비공개'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-neutral-500">
                      {new Date(article.created_at).toLocaleDateString('ko-KR')}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleEdit(article)}
                          className="px-2 py-1 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                        >
                          수정
                        </button>
                        <button
                          onClick={() => handleTogglePublished(article)}
                          className={`px-2 py-1 text-xs rounded transition-colors ${
                            article.is_published 
                              ? 'text-orange-600 hover:text-orange-800 hover:bg-orange-50' 
                              : 'text-green-600 hover:text-green-800 hover:bg-green-50'
                          }`}
                        >
                          {article.is_published ? '비공개' : '공개'}
                        </button>
                        <button
                          onClick={() => handleDelete(article)}
                          className="px-2 py-1 text-xs text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
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
  )
}