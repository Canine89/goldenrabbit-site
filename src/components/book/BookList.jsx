import { useState } from 'react'
import BookCard from './BookCard'
import Card from '../ui/Card'
import Button from '../ui/Button'

export default function BookList({ books, loading, error, showFilters = true }) {
  const [sortBy, setSortBy] = useState('newest')
  const [searchQuery, setSearchQuery] = useState('')

  // 정렬 옵션
  const sortOptions = [
    { value: 'newest', label: '최신순' },
    { value: 'oldest', label: '오래된순' },
    { value: 'title', label: '제목순' },
    { value: 'author', label: '저자순' },
    { value: 'price_low', label: '가격 낮은순' },
    { value: 'price_high', label: '가격 높은순' }
  ]

  // 검색 필터링
  const filteredBooks = books.filter(book => {
    if (!searchQuery) return true
    
    const query = searchQuery.toLowerCase()
    return (
      book.title.toLowerCase().includes(query) ||
      book.author.toLowerCase().includes(query) ||
      book.category.toLowerCase().includes(query)
    )
  })

  // 정렬 적용
  const sortedBooks = [...filteredBooks].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.created_at) - new Date(a.created_at)
      case 'oldest':
        return new Date(a.created_at) - new Date(b.created_at)
      case 'title':
        return a.title.localeCompare(b.title)
      case 'author':
        return a.author.localeCompare(b.author)
      case 'price_low':
        return a.price - b.price
      case 'price_high':
        return b.price - a.price
      default:
        return 0
    }
  })

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {[...Array(8)].map((_, i) => (
          <Card key={i} padding="none" className="animate-pulse-subtle">
            <div className="p-4 pb-0">
              <div className="aspect-[3/4] bg-neutral-200 rounded-lg"></div>
            </div>
            <Card.Content className="space-y-3">
              <div className="h-4 bg-neutral-200 rounded"></div>
              <div className="h-3 bg-neutral-200 rounded w-3/4"></div>
              <div className="h-4 bg-neutral-200 rounded w-1/2"></div>
            </Card.Content>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Card className="text-center" padding="xl">
        <div className="text-red-500 mb-6">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <Card.Title className="text-neutral-900 mb-3">
          데이터를 불러오는 중 오류가 발생했습니다
        </Card.Title>
        <Card.Description className="mb-6">
          {error}
        </Card.Description>
        <Button 
          onClick={() => window.location.reload()}
          variant="primary"
        >
          다시 시도
        </Button>
      </Card>
    )
  }

  return (
    <div>
      {/* 검색 및 정렬 필터 */}
      {showFilters && (
        <Card className="mb-8" padding="lg">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
            {/* 검색 */}
            <div className="relative flex-1 max-w-lg">
              <input
                type="text"
                placeholder="도서명, 저자명으로 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-white placeholder-neutral-500"
              />
              <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* 정렬 */}
            <div className="flex items-center space-x-3 flex-shrink-0">
              <label className="text-sm font-medium text-neutral-700">정렬:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border border-neutral-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white min-w-[140px]"
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>
      )}

      {/* 검색 결과 정보 */}
      {searchQuery && (
        <Card className="mb-8" padding="md">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span className="text-neutral-600">
              '<span className="font-semibold text-primary-500">{searchQuery}</span>' 
              검색 결과 <span className="font-medium">{filteredBooks.length}개</span>
            </span>
          </div>
        </Card>
      )}

      {/* 도서 목록 */}
      {sortedBooks.length === 0 ? (
        <Card className="text-center" padding="xl">
          <div className="text-neutral-400 mb-6">
            <svg className="w-20 h-20 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <Card.Title className="text-neutral-900 mb-3">
            {searchQuery ? '검색 결과가 없습니다' : '등록된 도서가 없습니다'}
          </Card.Title>
          <Card.Description>
            {searchQuery ? '다른 검색어로 시도해보세요' : '곧 새로운 도서가 추가될 예정입니다'}
          </Card.Description>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {sortedBooks.map((book) => (
            <BookCard key={book.id} book={book} showCategory={true} />
          ))}
        </div>
      )}
    </div>
  )
}