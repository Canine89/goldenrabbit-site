import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import ImageUpload from '../../components/admin/ImageUpload'
import DocsImporter from '../../components/admin/DocsImporter'
import SmartImage from '../../components/common/SmartImage'
import Container from '../../components/ui/Container'
import Section from '../../components/ui/Section'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Loading from '../../components/ui/Loading'
import Input from '../../components/ui/Input'
import Alert from '../../components/ui/Alert'

export default function BookManagement() {
  const { user, profile } = useAuth()
  const [books, setBooks] = useState([])
  const [filteredBooks, setFilteredBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingBook, setEditingBook] = useState(null)
  const [selectedCategory, setSelectedCategory] = useState('전체')
  const [selectedStatus, setSelectedStatus] = useState('전체')
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    category: '',
    price: '',
    description: '',
    cover_image_url: '',
    isbn: '',
    page_count: '',
    book_size: '',
    publication_date: '',
    table_of_contents: '',
    author_bio: '',
    is_featured: false,
    yes24_link: '',
    kyobo_link: '',
    aladin_link: '',
    ridibooks_link: ''
  })

  const categories = ['경제경영', 'IT전문서', 'IT활용서', '학습만화', '좋은여름', '수상작품']
  const allCategories = ['전체', ...categories]
  const statusOptions = ['전체', '활성', '비활성']

  useEffect(() => {
    fetchBooks()
  }, [])

  const fetchBooks = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) {
        throw error
      }
      
      setBooks(data || [])
      setFilteredBooks(data || [])
    } catch (error) {
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

  useEffect(() => {
    filterBooks()
  }, [books, selectedCategory, selectedStatus])

  const resetForm = () => {
    setFormData({
      title: '',
      author: '',
      category: '',
      price: '',
      description: '',
      cover_image_url: '',
      isbn: '',
      page_count: '',
      book_size: '',
      publication_date: '',
      table_of_contents: '',
      author_bio: '',
      is_featured: false,
      yes24_link: '',
      kyobo_link: '',
      aladin_link: '',
      ridibooks_link: ''
    })
    setEditingBook(null)
    setShowAddForm(false)
  }

  const handleEdit = (book) => {
    setFormData({
      title: book.title,
      author: book.author,
      category: book.category,
      price: book.price.toString(),
      description: book.description || '',
      cover_image_url: book.cover_image_url || '',
      isbn: book.isbn || '',
      page_count: book.page_count?.toString() || '',
      book_size: book.book_size || '',
      publication_date: book.publication_date || '',
      table_of_contents: book.table_of_contents || '',
      author_bio: book.author_bio || '',
      is_featured: book.is_featured,
      yes24_link: book.yes24_link || '',
      kyobo_link: book.kyobo_link || '',
      aladin_link: book.aladin_link || '',
      ridibooks_link: book.ridibooks_link || ''
    })
    setEditingBook(book)
    setShowAddForm(true)
  }

  // 보도자료에서 추출된 도서 정보 처리
  const handleBookInfoExtracted = (extractedInfo) => {
    console.log('추출된 정보:', extractedInfo) // 디버깅용
    
    setFormData(prevData => ({
      ...prevData,
      title: (extractedInfo.title && extractedInfo.title.trim()) ? extractedInfo.title.trim() : prevData.title,
      author: (extractedInfo.author && extractedInfo.author.trim()) ? extractedInfo.author.trim() : prevData.author,
      category: (extractedInfo.category && extractedInfo.category.trim()) ? extractedInfo.category.trim() : prevData.category,
      price: (extractedInfo.price && extractedInfo.price.trim()) ? extractedInfo.price.trim() : prevData.price,
      description: (extractedInfo.description && extractedInfo.description.trim()) ? extractedInfo.description.trim() : prevData.description,
      isbn: (extractedInfo.isbn && extractedInfo.isbn.trim()) ? extractedInfo.isbn.trim() : prevData.isbn,
      page_count: (extractedInfo.page_count && extractedInfo.page_count.trim()) ? extractedInfo.page_count.trim() : prevData.page_count,
      book_size: (extractedInfo.book_size && extractedInfo.book_size.trim()) ? extractedInfo.book_size.trim() : prevData.book_size,
      publication_date: (extractedInfo.publication_date && extractedInfo.publication_date.trim()) ? extractedInfo.publication_date.trim() : prevData.publication_date,
      table_of_contents: (extractedInfo.table_of_contents && extractedInfo.table_of_contents.trim()) ? extractedInfo.table_of_contents.trim() : prevData.table_of_contents,
      author_bio: (extractedInfo.author_bio && extractedInfo.author_bio.trim()) ? extractedInfo.author_bio.trim() : prevData.author_bio
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      const bookData = {
        title: formData.title,
        author: formData.author,
        category: formData.category,
        price: parseInt(formData.price),
        description: formData.description,
        cover_image_url: formData.cover_image_url,
        isbn: formData.isbn,
        page_count: formData.page_count ? parseInt(formData.page_count) : null,
        book_size: formData.book_size,
        publication_date: formData.publication_date || null,
        table_of_contents: formData.table_of_contents,
        author_bio: formData.author_bio,
        is_featured: formData.is_featured,
        yes24_link: formData.yes24_link,
        kyobo_link: formData.kyobo_link,
        aladin_link: formData.aladin_link,
        ridibooks_link: formData.ridibooks_link
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
    } catch (error) {
      alert('도서 저장 중 오류가 발생했습니다.')
    }
  }

  const handleDelete = async (book) => {
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
    } catch (error) {
      alert('도서 삭제 중 오류가 발생했습니다.')
    }
  }

  const handleToggleActive = async (book) => {
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
    } catch (error) {
      alert(`도서 ${action} 중 오류가 발생했습니다.`)
    }
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('ko-KR').format(price)
  }

  if (loading) {
    return <Loading />
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* 심플한 헤더 */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">도서 관리</h1>
          <p className="text-neutral-600 mt-1">총 {books.length}권의 도서 등록됨</p>
        </div>
        <Button
          onClick={() => setShowAddForm(true)}
          variant="primary"
          className="px-4 py-2"
        >
          + 새 도서 추가
        </Button>
      </div>

      {/* 컴팩트한 필터 바 */}
      <div className="bg-white rounded-lg border border-neutral-200 p-4 mb-6">
        <div className="flex items-center gap-4">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="border border-neutral-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
          >
            {allCategories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          
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
            {filteredBooks.length}개 표시
          </div>
        </div>
      </div>

      {/* 도서 등록/수정 폼 */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-[95vw] max-h-[95vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-black">
                {editingBook ? '도서 수정' : '새 도서 등록'}
              </h2>
              <button
                onClick={resetForm}
                className="text-black hover:text-[#CFB074]"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 보도자료 불러오기 */}
              <DocsImporter onBookInfoExtracted={handleBookInfoExtracted} />

              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  도서명 *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full border border-black rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#009BE0] focus:border-transparent"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    저자 *
                  </label>
                  <input
                    type="text"
                    value={formData.author}
                    onChange={(e) => setFormData({...formData, author: e.target.value})}
                    className="w-full border border-black rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#009BE0] focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    카테고리 *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full border border-black rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#009BE0] focus:border-transparent"
                    required
                  >
                    <option value="">카테고리 선택</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
              </div>


              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 텍스트 영역들 - 중심 */}
                <div className="lg:col-span-2 space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-black mb-1">
                      도서 설명
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      className="w-full border border-black rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#009BE0] focus:border-transparent"
                      rows="8"
                      placeholder="도서 설명을 입력하세요"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-black mb-1">
                      목차
                    </label>
                    <textarea
                      value={formData.table_of_contents}
                      onChange={(e) => setFormData({...formData, table_of_contents: e.target.value})}
                      className="w-full border border-black rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#009BE0] focus:border-transparent"
                      rows="10"
                      placeholder="목차를 입력하세요"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-black mb-1">
                      저자 소개
                    </label>
                    <textarea
                      value={formData.author_bio}
                      onChange={(e) => setFormData({...formData, author_bio: e.target.value})}
                      className="w-full border border-black rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#009BE0] focus:border-transparent"
                      rows="6"
                      placeholder="저자 소개를 입력하세요"
                    />
                  </div>
                </div>

                {/* 사이드 정보들 */}
                <div className="space-y-6">
                  <div>
                    <ImageUpload
                      value={formData.cover_image_url}
                      onChange={(url) => setFormData({...formData, cover_image_url: url})}
                      label="표지 이미지"
                      bucket="images"
                      folder="books"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-black mb-2">
                      가격 (원) *
                    </label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: e.target.value})}
                      className="w-full border border-black rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#009BE0] focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-black mb-2">
                      ISBN
                    </label>
                    <input
                      type="text"
                      value={formData.isbn}
                      onChange={(e) => setFormData({...formData, isbn: e.target.value})}
                      className="w-full border border-black rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#009BE0] focus:border-transparent"
                      placeholder="979-11-94383-35-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-black mb-2">
                      페이지 수
                    </label>
                    <input
                      type="number"
                      value={formData.page_count}
                      onChange={(e) => setFormData({...formData, page_count: e.target.value})}
                      className="w-full border border-black rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#009BE0] focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-black mb-2">
                      책 크기
                    </label>
                    <input
                      type="text"
                      value={formData.book_size}
                      onChange={(e) => setFormData({...formData, book_size: e.target.value})}
                      className="w-full border border-black rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#009BE0] focus:border-transparent"
                      placeholder="188mm x 257mm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-black mb-2">
                      출간일
                    </label>
                    <input
                      type="date"
                      value={formData.publication_date}
                      onChange={(e) => setFormData({...formData, publication_date: e.target.value})}
                      className="w-full border border-black rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#009BE0] focus:border-transparent"
                    />
                  </div>
                </div>
              </div>


              {/* 판매처 링크 */}
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  온라인 서점 링크
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-neutral-600 mb-1">Yes24</label>
                    <input
                      type="url"
                      value={formData.yes24_link}
                      onChange={(e) => setFormData({...formData, yes24_link: e.target.value})}
                      className="w-full border border-black rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#009BE0] focus:border-transparent"
                      placeholder="https://www.yes24.com/..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-600 mb-1">교보문고</label>
                    <input
                      type="url"
                      value={formData.kyobo_link}
                      onChange={(e) => setFormData({...formData, kyobo_link: e.target.value})}
                      className="w-full border border-black rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#009BE0] focus:border-transparent"
                      placeholder="https://www.kyobobook.co.kr/..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-600 mb-1">알라딘</label>
                    <input
                      type="url"
                      value={formData.aladin_link}
                      onChange={(e) => setFormData({...formData, aladin_link: e.target.value})}
                      className="w-full border border-black rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#009BE0] focus:border-transparent"
                      placeholder="https://www.aladin.co.kr/..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-600 mb-1">리디북스</label>
                    <input
                      type="url"
                      value={formData.ridibooks_link}
                      onChange={(e) => setFormData({...formData, ridibooks_link: e.target.value})}
                      className="w-full border border-black rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#009BE0] focus:border-transparent"
                      placeholder="https://ridibooks.com/..."
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
                  className="h-4 w-4 text-[#009BE0] focus:ring-[#009BE0] border-black rounded"
                />
                <label htmlFor="is_featured" className="ml-2 block text-sm text-black">
                  추천 도서로 설정
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-black hover:text-[#CFB074] transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="bg-[#009BE0] text-white px-6 py-2 rounded-lg hover:bg-[#007BB3] transition-colors"
                >
                  {editingBook ? '수정' : '등록'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 심플한 도서 목록 */}
      <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
        {error ? (
          <div className="p-6 text-center">
            <p className="text-red-600 mb-3">{error}</p>
            <button 
              onClick={fetchBooks} 
              className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
            >
              다시 시도
            </button>
          </div>
        ) : filteredBooks.length === 0 ? (
          <div className="text-center py-16">
            <svg className="w-12 h-12 mx-auto text-neutral-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <h3 className="text-lg font-medium text-neutral-900 mb-2">
              {selectedCategory === '전체' && selectedStatus === '전체' 
                ? '등록된 도서가 없습니다'
                : '조건에 맞는 도서가 없습니다'
              }
            </h3>
            <p className="text-neutral-500">
              {selectedCategory === '전체' && selectedStatus === '전체' 
                ? '새 도서를 추가해보세요'
                : '다른 필터를 시도해보세요'
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="text-left py-3 px-4 text-xs font-medium text-neutral-500 uppercase">도서</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-neutral-500 uppercase">카테고리</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-neutral-500 uppercase">가격</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-neutral-500 uppercase">상태</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-neutral-500 uppercase">등록일</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-neutral-500 uppercase">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {filteredBooks.map((book) => (
                  <tr key={book.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <div className="w-10 h-14 mr-3 flex-shrink-0">
                          <SmartImage
                            src={book.cover_image_url}
                            alt={book.title}
                            className="w-full h-full rounded object-cover"
                            fallback={
                              <div className="w-full h-full rounded bg-neutral-200 flex items-center justify-center">
                                <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                              </div>
                            }
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-neutral-900 mb-1">
                            {book.title}
                          </div>
                          <div className="text-sm text-neutral-600">
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
                    <td className="py-3 px-4 text-sm font-medium text-neutral-900">
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
                    <td className="py-3 px-4 text-sm text-neutral-500">
                      {new Date(book.created_at).toLocaleDateString('ko-KR')}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleEdit(book)}
                          className="px-2 py-1 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                        >
                          수정
                        </button>
                        <button
                          onClick={() => handleToggleActive(book)}
                          className={`px-2 py-1 text-xs rounded transition-colors ${
                            book.is_active 
                              ? 'text-orange-600 hover:text-orange-800 hover:bg-orange-50' 
                              : 'text-green-600 hover:text-green-800 hover:bg-green-50'
                          }`}
                        >
                          {book.is_active ? '비활성화' : '활성화'}
                        </button>
                        <button
                          onClick={() => handleDelete(book)}
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