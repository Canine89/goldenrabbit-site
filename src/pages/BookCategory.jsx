import { useParams } from 'react-router-dom'
import { useBooks } from '../hooks/useBooks'
import BookList from '../components/book/BookList'

export default function BookCategory() {
  const { category } = useParams()
  
  // 카테고리 정보 매핑
  const categoryInfo = {
    'economy': { name: '경제경영', key: '경제경영', description: '경제와 경영 분야의 실무 가이드와 전략서' },
    'it-professional': { name: 'IT전문서', key: 'IT전문서', description: '개발자와 IT 전문가를 위한 심화 기술서' },
    'it-practical': { name: 'IT활용서', key: 'IT활용서', description: '실무에서 바로 활용할 수 있는 IT 도구 활용법' },
    'comic': { name: '학습만화', key: '학습만화', description: '만화로 쉽게 배우는 IT 기술과 개념' },
    'good-summer': { name: '좋은여름', key: '좋은여름', description: '여름 특집 도서와 계절별 추천 도서' },
    'award': { name: '수상작품', key: '수상작품', description: '각종 상을 수상한 우수 도서들' }
  }

  const currentCategory = categoryInfo[category] || { 
    name: '알 수 없는 카테고리', 
    key: category,
    description: '카테고리 정보를 찾을 수 없습니다.' 
  }

  // 실제 카테고리 키로 useBooks 훅 호출 (이미 필터링되어 반환됨)
  const { books, loading, error } = useBooks(currentCategory.key)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 카테고리 헤더 */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {currentCategory.name}
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {currentCategory.description}
            </p>
            
            {/* 카테고리 통계 */}
            {!loading && (
              <div className="mt-8 flex justify-center">
                <div className="bg-golden-rabbit-orange text-white px-6 py-2 rounded-full">
                  총 {books.length}권의 도서
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 도서 목록 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <BookList 
          books={books} 
          loading={loading} 
          error={error}
          showFilters={true}
        />
      </div>
    </div>
  )
}