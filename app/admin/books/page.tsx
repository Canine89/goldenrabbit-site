'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseClient } from '../../lib/supabase-client'
import SmartImage from '../../components/SmartImage'
import Loading from '../../components/ui/Loading'
import Button from '../../components/ui/Button'
import DocsImporter from '../../components/admin/DocsImporter'

interface Book {
  id: string
  title: string
  author: string
  author_bio?: string
  price: number
  cover_image_url?: string
  category: string
  isbn?: string
  page_count?: number
  size?: string
  publication_date?: string
  table_of_contents?: string
  description?: string
  publisher_review?: string
  testimonials?: string
  is_featured: boolean
  is_active: boolean
  created_at: string
}

interface FormData {
  title: string
  author: string
  category: string
  price: string
  description: string
  publisher_review: string
  testimonials: string
  cover_image_url: string
  isbn: string
  page_count: string
  width: string
  height: string
  publication_date: string
  table_of_contents: string
  author_bio: string
  is_featured: boolean
  yes24_link: string
  kyobo_link: string
  aladin_link: string
}

export default function BookManagementPage() {
  const router = useRouter()
  const [books, setBooks] = useState<Book[]>([])
  const [filteredBooks, setFilteredBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingBook, setEditingBook] = useState<Book | null>(null)
  const [selectedCategory, setSelectedCategory] = useState('전체')
  const [selectedStatus, setSelectedStatus] = useState('전체')
  const [formData, setFormData] = useState<FormData>({
    title: '',
    author: '',
    category: '',
    price: '',
    description: '',
    publisher_review: '',
    testimonials: '',
    cover_image_url: '',
    isbn: '',
    page_count: '',
    width: '',
    height: '',
    publication_date: '',
    table_of_contents: '',
    author_bio: '',
    is_featured: false,
    yes24_link: '',
    kyobo_link: '',
    aladin_link: '',
  })

  const supabase = createSupabaseClient()
  const categories = ['경제경영', 'IT전문서', 'IT활용서', '학습만화', '좋은여름', '수상작품']
  const allCategories = ['전체', ...categories]
  const statusOptions = ['전체', '활성', '비활성']

  // 관리자 권한 확인
  useEffect(() => {
    checkAdminAuth()
  }, [])

  // 도서 목록 조회
  useEffect(() => {
    if (isAdmin) {
      fetchBooks()
    }
  }, [isAdmin])

  // 필터링
  useEffect(() => {
    filterBooks()
  }, [books, selectedCategory, selectedStatus])

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

  const fetchBooks = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      setBooks(data || [])
      setFilteredBooks(data || [])
    } catch (error: any) {
      setError(`도서 목록을 불러오는데 실패했습니다: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const filterBooks = () => {
    let filtered = books

    if (selectedCategory !== '전체') {
      filtered = filtered.filter(book => book.category === selectedCategory)
    }

    if (selectedStatus !== '전체') {
      const isActive = selectedStatus === '활성'
      filtered = filtered.filter(book => book.is_active === isActive)
    }

    setFilteredBooks(filtered)
  }

  const resetForm = () => {
    setFormData({
      title: '',
      author: '',
      category: '',
      price: '',
      description: '',
      publisher_review: '',
      testimonials: '',
      cover_image_url: '',
      isbn: '',
      page_count: '',
      width: '',
      height: '',
      publication_date: '',
      table_of_contents: '',
      author_bio: '',
      is_featured: false,
      yes24_link: '',
      kyobo_link: '',
      aladin_link: '',
    })
    setEditingBook(null)
    setShowAddForm(false)
  }

  // 책 크기 문자열을 가로/세로로 분리하는 함수
  const parseSizeString = (sizeStr: string) => {
    if (!sizeStr) return { width: '', height: '' }
    
    // "188 x 257", "188x257", "188mm x 257mm" 등의 형태를 처리
    const cleanSize = sizeStr.replace(/mm/g, '').trim()
    const parts = cleanSize.split(/\s*[x×]\s*/)
    
    if (parts.length >= 2) {
      return {
        width: parts[0].trim(),
        height: parts[1].trim()
      }
    }
    
    return { width: '', height: '' }
  }

  const handleEdit = (book: Book) => {
    const { width, height } = parseSizeString(book.size || '')
    
    setFormData({
      title: book.title,
      author: book.author,
      category: book.category,
      price: book.price.toString(),
      description: book.description || '',
      publisher_review: book.publisher_review || '',
      testimonials: book.testimonials || '',
      cover_image_url: book.cover_image_url || '',
      isbn: book.isbn || '',
      page_count: book.page_count?.toString() || '',
      width,
      height,
      publication_date: book.publication_date || '',
      table_of_contents: book.table_of_contents || '',
      author_bio: book.author_bio || '',
      is_featured: book.is_featured,
      yes24_link: (book as any).yes24_link || '',
      kyobo_link: (book as any).kyobo_link || '',
      aladin_link: (book as any).aladin_link || '',
    })
    setEditingBook(book)
    setShowAddForm(true)
  }

  // 보도자료에서 추출된 도서 정보 처리
  const handleBookInfoExtracted = (extractedInfo: any) => {
    console.log('🔄 Received extracted info:', extractedInfo)
    
    // DocsImporter에서 직접 추출된 가로/세로 값 사용, 없으면 기존 parseSizeString 사용
    let width = ''
    let height = ''
    
    if (extractedInfo.book_width && extractedInfo.book_height) {
      width = extractedInfo.book_width.trim()
      height = extractedInfo.book_height.trim()
      console.log('✅ Using direct extraction - Width:', width, 'Height:', height)
    } else if (extractedInfo.book_size) {
      const parsed = parseSizeString(extractedInfo.book_size.trim())
      width = parsed.width
      height = parsed.height
      console.log('🔧 Using parseSizeString - Width:', width, 'Height:', height)
    } else {
      console.log('❌ No size information found')
    }
    
    setFormData(prevData => ({
      ...prevData,
      title: (extractedInfo.title && extractedInfo.title.trim()) ? extractedInfo.title.trim() : prevData.title,
      author: (extractedInfo.author && extractedInfo.author.trim()) ? extractedInfo.author.trim() : prevData.author,
      category: (extractedInfo.category && extractedInfo.category.trim()) ? extractedInfo.category.trim() : prevData.category,
      price: (extractedInfo.price && extractedInfo.price.trim()) ? extractedInfo.price.trim() : prevData.price,
      description: (extractedInfo.description && extractedInfo.description.trim()) ? extractedInfo.description.trim() : prevData.description,
      publisher_review: (extractedInfo.publisher_review && extractedInfo.publisher_review.trim()) ? extractedInfo.publisher_review.trim() : prevData.publisher_review,
      testimonials: (extractedInfo.testimonials && extractedInfo.testimonials.trim()) ? extractedInfo.testimonials.trim() : prevData.testimonials,
      isbn: (extractedInfo.isbn && extractedInfo.isbn.trim()) ? extractedInfo.isbn.trim() : prevData.isbn,
      page_count: (extractedInfo.page_count && extractedInfo.page_count.trim()) ? extractedInfo.page_count.trim() : prevData.page_count,
      width: width || prevData.width,
      height: height || prevData.height,
      publication_date: (extractedInfo.publication_date && extractedInfo.publication_date.trim()) ? extractedInfo.publication_date.trim() : prevData.publication_date,
      table_of_contents: (extractedInfo.table_of_contents && extractedInfo.table_of_contents.trim()) ? extractedInfo.table_of_contents.trim() : prevData.table_of_contents,
      author_bio: (extractedInfo.author_bio && extractedInfo.author_bio.trim()) ? extractedInfo.author_bio.trim() : prevData.author_bio
    }))
    
    console.log('📝 Form data updated with width:', width || prevData.width, 'height:', height || prevData.height)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      // 가로/세로를 합쳐서 size 문자열 생성
      const sizeString = (formData.width && formData.height) 
        ? `${formData.width} x ${formData.height}`
        : ''
      
      const bookData = {
        title: formData.title,
        author: formData.author,
        category: formData.category,
        price: parseInt(formData.price),
        description: formData.description,
        publisher_review: formData.publisher_review,
        testimonials: formData.testimonials,
        cover_image_url: formData.cover_image_url,
        isbn: formData.isbn,
        page_count: formData.page_count ? parseInt(formData.page_count) : null,
        size: sizeString,
        publication_date: formData.publication_date || null,
        table_of_contents: formData.table_of_contents,
        author_bio: formData.author_bio,
        is_featured: formData.is_featured,
        is_active: true,
        yes24_link: formData.yes24_link || null,
        kyobo_link: formData.kyobo_link || null,
        aladin_link: formData.aladin_link || null,
      }

      if (editingBook) {
        const { error } = await supabase
          .from('books')
          .update(bookData)
          .eq('id', editingBook.id)

        if (error) throw error
        alert('도서가 성공적으로 수정되었습니다.')
      } else {
        const { error } = await supabase
          .from('books')
          .insert([bookData])

        if (error) throw error
        alert('도서가 성공적으로 등록되었습니다.')
      }

      resetForm()
      fetchBooks()
    } catch (error: any) {
      alert(`도서 저장 중 오류가 발생했습니다: ${error.message}`)
    }
  }

  const handleDelete = async (book: Book) => {
    if (!confirm(`"${book.title}" 도서를 완전히 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('books')
        .delete()
        .eq('id', book.id)

      if (error) throw error

      alert('도서가 삭제되었습니다.')
      fetchBooks()
    } catch (error: any) {
      alert(`도서 삭제 중 오류가 발생했습니다: ${error.message}`)
    }
  }

  const handleToggleActive = async (book: Book) => {
    const newStatus = !book.is_active
    const action = newStatus ? '활성화' : '비활성화'
    
    if (!confirm(`"${book.title}" 도서를 ${action} 하시겠습니까?`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('books')
        .update({ is_active: newStatus })
        .eq('id', book.id)

      if (error) throw error

      alert(`도서가 ${action}되었습니다.`)
      fetchBooks()
    } catch (error: any) {
      alert(`도서 ${action} 중 오류가 발생했습니다: ${error.message}`)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR').format(price)
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
            <h1 className="text-3xl font-bold text-gray-900">도서 관리</h1>
            <p className="text-gray-600 mt-1">총 {books.length}권의 도서 등록됨</p>
          </div>
          <Button
            onClick={() => setShowAddForm(true)}
            className="px-6 py-3"
          >
            + 새 도서 추가
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
              {filteredBooks.length}개 표시
            </div>
          </div>
        </div>

        {/* 도서 등록/수정 폼 */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[95vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingBook ? '도서 수정' : '새 도서 등록'}
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
                {/* 보도자료 불러오기 */}
                <DocsImporter onBookInfoExtracted={handleBookInfoExtracted} />

                {/* 기본 정보 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      도서명 *
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
                      저자 *
                    </label>
                    <input
                      type="text"
                      value={formData.author}
                      onChange={(e) => setFormData({...formData, author: e.target.value})}
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
                      <option value="">카테고리 선택</option>
                      {categories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      가격 (원) *
                    </label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      표지 이미지 URL
                    </label>
                    <input
                      type="url"
                      value={formData.cover_image_url}
                      onChange={(e) => setFormData({...formData, cover_image_url: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="구글 드라이브 공유 링크 또는 이미지 URL"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ISBN
                    </label>
                    <input
                      type="text"
                      value={formData.isbn}
                      onChange={(e) => setFormData({...formData, isbn: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="979-11-94383-35-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      페이지 수
                    </label>
                    <input
                      type="number"
                      value={formData.page_count}
                      onChange={(e) => setFormData({...formData, page_count: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      책 크기 (mm)
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <input
                          type="number"
                          value={formData.width}
                          onChange={(e) => setFormData({...formData, width: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          placeholder="가로"
                        />
                        <div className="text-xs text-gray-500 mt-1">가로 (폭)</div>
                      </div>
                      <div>
                        <input
                          type="number"
                          value={formData.height}
                          onChange={(e) => setFormData({...formData, height: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          placeholder="세로"
                        />
                        <div className="text-xs text-gray-500 mt-1">세로 (높이)</div>
                      </div>
                    </div>
                    {formData.width && formData.height && (
                      <div className="text-sm text-gray-600 mt-1">
                        표시: {formData.width} x {formData.height}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      출간일
                    </label>
                    <input
                      type="date"
                      value={formData.publication_date}
                      onChange={(e) => setFormData({...formData, publication_date: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>

                {/* 긴 텍스트 필드들 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    도서 설명
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    rows={6}
                    placeholder="마크다운 문법을 사용할 수 있습니다"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    출판사 리뷰
                  </label>
                  <textarea
                    value={formData.publisher_review}
                    onChange={(e) => setFormData({...formData, publisher_review: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    rows={6}
                    placeholder="출판사 리뷰 내용을 입력하세요 (마크다운 문법 사용 가능)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    추천사
                  </label>
                  <textarea
                    value={formData.testimonials}
                    onChange={(e) => setFormData({...formData, testimonials: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    rows={6}
                    placeholder="추천사 내용을 입력하세요 (마크다운 문법 사용 가능)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    목차
                  </label>
                  <textarea
                    value={formData.table_of_contents}
                    onChange={(e) => setFormData({...formData, table_of_contents: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    rows={8}
                    placeholder="마크다운 문법을 사용할 수 있습니다"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    저자 소개
                  </label>
                  <textarea
                    value={formData.author_bio}
                    onChange={(e) => setFormData({...formData, author_bio: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    rows={4}
                    placeholder="마크다운 문법을 사용할 수 있습니다"
                  />
                </div>

                {/* 온라인 서점 링크 */}
                <div className="space-y-4">
                  <h4 className="text-lg font-medium text-gray-900 border-b pb-2">온라인 서점 링크</h4>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        YES24 링크
                      </label>
                      <input
                        type="url"
                        value={formData.yes24_link}
                        onChange={(e) => setFormData({...formData, yes24_link: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="https://www.yes24.com/Product/Goods/..."
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        교보문고 링크
                      </label>
                      <input
                        type="url"
                        value={formData.kyobo_link}
                        onChange={(e) => setFormData({...formData, kyobo_link: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="https://product.kyobobook.co.kr/detail/..."
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        알라딘 링크
                      </label>
                      <input
                        type="url"
                        value={formData.aladin_link}
                        onChange={(e) => setFormData({...formData, aladin_link: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="https://www.aladin.co.kr/shop/wproduct.aspx?..."
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_featured"
                    checked={formData.is_featured}
                    onChange={(e) => setFormData({...formData, is_featured: e.target.checked})}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_featured" className="ml-2 block text-sm text-gray-700">
                    추천 도서로 설정
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
                    {editingBook ? '수정' : '등록'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 도서 목록 */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {error ? (
            <div className="p-6 text-center">
              <p className="text-red-600 mb-3">{error}</p>
              <button 
                onClick={fetchBooks} 
                className="px-4 py-2 text-sm text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-lg"
              >
                다시 시도
              </button>
            </div>
          ) : filteredBooks.length === 0 ? (
            <div className="text-center py-16">
              <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {selectedCategory === '전체' && selectedStatus === '전체' 
                  ? '등록된 도서가 없습니다'
                  : '조건에 맞는 도서가 없습니다'
                }
              </h3>
              <p className="text-gray-500">
                {selectedCategory === '전체' && selectedStatus === '전체' 
                  ? '새 도서를 추가해보세요'
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
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">카테고리</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">가격</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">상태</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">등록일</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredBooks.map((book) => (
                    <tr key={book.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <div className="w-12 h-16 mr-3 flex-shrink-0">
                            <SmartImage
                              src={book.cover_image_url}
                              alt={book.title}
                              width={48}
                              height={64}
                              className="w-full h-full object-cover rounded"
                              fallback={
                                <div className="w-full h-full rounded bg-gray-200 flex items-center justify-center">
                                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                  </svg>
                                </div>
                              }
                            />
                          </div>
                          <div className="min-w-0">
                            <button
                              onClick={() => handleEdit(book)}
                              className="text-sm font-medium text-gray-900 mb-1 hover:text-primary-600 text-left transition-colors cursor-pointer"
                              title="클릭하여 수정"
                            >
                              {book.title}
                            </button>
                            <div className="text-sm text-gray-600">
                              {book.author}
                            </div>
                            {book.is_featured && (
                              <span className="inline-block mt-1 px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">
                                추천
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                          {book.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm font-medium text-gray-900">
                        {formatPrice(book.price)}원
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-1 text-xs rounded ${
                          book.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {book.is_active ? '활성' : '비활성'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500">
                        {new Date(book.created_at).toLocaleDateString('ko-KR')}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEdit(book)}
                            className="px-3 py-1 text-xs text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded"
                          >
                            수정
                          </button>
                          <button
                            onClick={() => handleToggleActive(book)}
                            className={`px-3 py-1 text-xs rounded ${
                              book.is_active 
                                ? 'text-orange-600 hover:text-orange-800 bg-orange-50 hover:bg-orange-100' 
                                : 'text-green-600 hover:text-green-800 bg-green-50 hover:bg-green-100'
                            }`}
                          >
                            {book.is_active ? '비활성화' : '활성화'}
                          </button>
                          <button
                            onClick={() => handleDelete(book)}
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
    </div>
  )
}