import { useState } from 'react'
import { useBooks } from '../hooks/useBooks'
import BookList from '../components/book/BookList'
import Container from '../components/ui/Container'
import Section from '../components/ui/Section'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'

export default function Books() {
  const [selectedCategory, setSelectedCategory] = useState(null)
  const { books, loading, error, refetch } = useBooks(selectedCategory)

  const categories = [
    { id: null, name: '전체', count: null },
    { id: '경제경영', name: '경제경영', count: null },
    { id: 'IT전문서', name: 'IT전문서', count: null },
    { id: 'IT활용서', name: 'IT활용서', count: null },
    { id: '학습만화', name: '학습만화', count: null },
    { id: '좋은여름', name: '좋은여름', count: null },
    { id: '수상작품', name: '수상작품', count: null },
  ]

  // 카테고리별 도서 개수 계산
  const getCategoryCount = (categoryId) => {
    if (!categoryId) return books.length
    return books.filter(book => book.category === categoryId).length
  }

  return (
    <div className="bg-neutral-50 min-h-screen">
      {/* 페이지 헤더 */}
      <Section background="gradient-subtle" padding="default">
        <Container>
          <Section.Header 
            title="도서 목록"
            description="골든래빗에서 출간한 다양한 분야의 전문서와 실용서를 만나보세요"
            titleClassName="text-neutral-900"
            descriptionClassName="text-neutral-600"
          />
        </Container>
      </Section>

      {/* 메인 콘텐츠 */}
      <Section background="transparent" padding="default">
        <Container>
          <div className="flex flex-col lg:flex-row gap-8">
            {/* 사이드바 - 카테고리 필터 */}
            <div className="lg:w-72 flex-shrink-0">
              <Card className="sticky top-24" padding="lg">
                <Card.Header>
                  <Card.Title className="text-neutral-900 mb-0">카테고리</Card.Title>
                </Card.Header>
                
                <div className="space-y-2">
                  {categories.map((category) => (
                    <button
                      key={category.id || 'all'}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`group w-full text-left px-4 py-3 rounded-lg transition-all duration-200 ${
                        selectedCategory === category.id
                          ? 'bg-primary-500 text-white shadow-md'
                          : 'text-neutral-700 hover:bg-neutral-50 hover:text-primary-500'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{category.name}</span>
                        {!loading && (
                          <Badge 
                            variant={selectedCategory === category.id ? "secondary" : "outline"}
                            size="sm"
                            className={selectedCategory === category.id ? "bg-white/20 text-white" : ""}
                          >
                            {getCategoryCount(category.id)}
                          </Badge>
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                {/* 새로고침 버튼 */}
                <Card.Footer className="border-t border-neutral-200 pt-6 mt-6">
                  <Button
                    onClick={refetch}
                    disabled={loading}
                    variant="ghost"
                    className="w-full"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    {loading ? '로딩 중...' : '새로고침'}
                  </Button>
                </Card.Footer>
              </Card>
            </div>

            {/* 메인 콘텐츠 */}
            <div className="flex-1">
              {/* 현재 선택된 카테고리 표시 */}
              {selectedCategory && (
                <Card className="mb-8" padding="md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-sm text-neutral-500 font-medium">선택된 카테고리:</span>
                      <Badge variant="primary" size="md">
                        {categories.find(c => c.id === selectedCategory)?.name}
                      </Badge>
                      <span className="text-sm text-neutral-500">
                        총 {getCategoryCount(selectedCategory)}권
                      </span>
                    </div>
                    <Button
                      onClick={() => setSelectedCategory(null)}
                      variant="ghost"
                      size="sm"
                      className="text-neutral-400 hover:text-neutral-600"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </Button>
                  </div>
                </Card>
              )}

              {/* 도서 목록 */}
              <BookList 
                books={books} 
                loading={loading} 
                error={error} 
                showFilters={true}
              />
            </div>
          </div>
        </Container>
      </Section>
    </div>
  )
}