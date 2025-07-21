import { useState, useEffect } from 'react'
import { useRabbitStoreProducts } from '../hooks/useRabbitStore'
import { useStore } from '../store/useStore'
import ProductCard from '../components/book/ProductCard'

export default function RabbitStore() {
  const [selectedCategory, setSelectedCategory] = useState(null)
  const { products, loading, error, refetch } = useRabbitStoreProducts(selectedCategory)
  const { cart, getCartTotal } = useStore()

  // 카테고리 목록 (동적으로 생성)
  const [categories, setCategories] = useState([])

  useEffect(() => {
    if (products.length > 0) {
      const uniqueCategories = [...new Set(products.map(p => p.category).filter(Boolean))]
      setCategories([
        { id: null, name: '전체' },
        ...uniqueCategories.map(cat => ({ id: cat, name: cat }))
      ])
    }
  }, [products])

  const getCategoryCount = (categoryId) => {
    if (!categoryId) return products.length
    return products.filter(product => product.category === categoryId).length
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-gray-200 rounded-lg h-80"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            데이터를 불러오는 중 오류가 발생했습니다
          </h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={refetch}
            className="bg-golden-rabbit-orange text-white px-4 py-2 rounded hover:bg-orange-600 transition-colors"
          >
            다시 시도
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 페이지 헤더 */}
      <div className="bg-gradient-to-r from-golden-rabbit-orange to-golden-rabbit-gold text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">
              🐰 토끼상점
            </h1>
            <p className="text-xl opacity-90 mb-8">
              골든래빗에서 준비한 특별한 상품들을 만나보세요!
            </p>
            
            {/* 장바구니 상태 표시 */}
            {getCartTotal() > 0 && (
              <div className="inline-flex items-center bg-white bg-opacity-20 backdrop-blur-sm rounded-lg px-4 py-2">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m1.6 8L5 5H3m4 8v6a2 2 0 002 2h6a2 2 0 002-2v-6" />
                </svg>
                <span>장바구니에 {getCartTotal()}개 상품</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* 사이드바 - 카테고리 필터 */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                카테고리
              </h2>
              
              <div className="space-y-2">
                {categories.map((category) => (
                  <button
                    key={category.id || 'all'}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      selectedCategory === category.id
                        ? 'bg-golden-rabbit-orange text-white'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span>{category.name}</span>
                      <span className={`text-sm ${
                        selectedCategory === category.id ? 'text-white' : 'text-gray-500'
                      }`}>
                        {getCategoryCount(category.id)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              {/* 새로고침 버튼 */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={refetch}
                  className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  새로고침
                </button>
              </div>
            </div>
          </div>

          {/* 메인 콘텐츠 */}
          <div className="flex-1">
            {/* 현재 선택된 카테고리 표시 */}
            {selectedCategory && (
              <div className="mb-6">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">카테고리:</span>
                  <span className="bg-golden-rabbit-orange text-white px-3 py-1 rounded-full text-sm font-medium">
                    {categories.find(c => c.id === selectedCategory)?.name}
                  </span>
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* 상품 목록 */}
            {products.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  등록된 상품이 없습니다
                </h3>
                <p className="text-gray-600">
                  곧 새로운 상품이 추가될 예정입니다
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 고정 장바구니 버튼 (모바일) */}
      {getCartTotal() > 0 && (
        <div className="fixed bottom-4 right-4 lg:hidden">
          <button className="bg-golden-rabbit-orange text-white p-4 rounded-full shadow-lg hover:bg-orange-600 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m1.6 8L5 5H3m4 8v6a2 2 0 002 2h6a2 2 0 002-2v-6" />
            </svg>
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {getCartTotal()}
            </span>
          </button>
        </div>
      )}
    </div>
  )
}