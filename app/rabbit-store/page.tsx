'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createSupabaseClient } from '../lib/supabase-client'
import SmartImage from '../components/SmartImage'
import Card from '../components/ui/Card'
import Loading from '../components/ui/Loading'
import Button from '../components/ui/Button'

interface Product {
  id: string
  name: string
  description?: string
  price: number
  image_url?: string
  category: string
  stock_quantity: number
  is_active: boolean
  is_featured: boolean
  created_at: string
}

const categories = [
  { id: 'all', name: '전체' },
  { id: 'goods', name: '굿즈' },
  { id: 'lifestyle', name: '생활용품' },
  { id: 'stationery', name: '문구' },
  { id: 'clothing', name: '의류' },
  { id: 'other', name: '기타' },
]

export default function RabbitStorePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const supabase = createSupabaseClient()

  useEffect(() => {
    fetchProducts()
  }, [selectedCategory])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      
      let query = supabase
        .from('rabbit_store_products')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (selectedCategory !== 'all') {
        query = query.eq('category', selectedCategory)
      }

      const { data, error } = await query

      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      console.error('상품 조회 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR').format(price)
  }

  const addToCart = async (productId: string) => {
    // 장바구니 추가 로직 (임시)
    alert('장바구니 기능은 준비 중입니다!')
  }

  return (
    <div className="min-h-screen bg-black">
      {/* 헤더 섹션 */}
      <div className="bg-gradient-to-r from-primary-500 to-white text-primary-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="text-6xl mb-4">🐰</div>
            <h1 className="text-4xl font-bold mb-4 text-primary-500">토끼상점</h1>
            <p className="text-xl opacity-90 max-w-2xl mx-auto text-primary-500">
              골든래빗만의 특별한 상품들을 만나보세요! 실제 구매가 가능한 프리미엄 아이템들입니다.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 안내 메시지 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-blue-900 mb-2">토끼상점 안내</h3>
              <div className="text-blue-800 space-y-1">
                <p>• 토끼상점은 관리자가 등록한 특별 상품을 판매하는 공간입니다</p>
                <p>• 도서 페이지와 달리 실제 구매 기능이 포함되어 있습니다</p>
                <p>• 모든 상품은 한정 수량으로 판매되며, 품절 시 재입고까지 시간이 소요될 수 있습니다</p>
              </div>
            </div>
          </div>
        </div>

        {/* 검색 및 필터 */}
        <div className="mb-8 space-y-6">
          {/* 검색바 */}
          <div className="relative max-w-md mx-auto">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="상품명을 검색하세요..."
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* 카테고리 필터 */}
          <div className="flex flex-wrap justify-center gap-3">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-6 py-2 rounded-full font-medium transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-orange-500 text-white shadow-lg'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* 상품 목록 */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }, (_, i) => (
              <Card key={i} padding="none" className="overflow-visible animate-pulse">
                <div className="p-4 pb-0">
                  <Loading.Skeleton variant="image" className="aspect-square" />
                </div>
                <div className="p-6 space-y-3">
                  <Loading.Skeleton variant="title" />
                  <Loading.Skeleton variant="text" width="75%" />
                  <Loading.Skeleton variant="text" width="50%" />
                  <Loading.Skeleton variant="button" />
                </div>
              </Card>
            ))}
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <Card
                key={product.id}
                hover={true}
                padding="none"
                className="overflow-visible group"
              >
                <div className="p-4 pb-0">
                  <div className="aspect-square bg-neutral-100 relative overflow-hidden rounded-lg shadow-sm group-hover:shadow-md transition-all duration-300">
                    <SmartImage
                      src={product.image_url}
                      alt={product.name}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      fallback={
                        <div className="w-full h-full bg-neutral-100 flex items-center justify-center p-8">
                          <svg className="w-12 h-12 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                        </div>
                      }
                    />
                    {product.is_featured && (
                      <div className="absolute top-3 right-3 px-2 py-1 bg-orange-500 text-white text-xs font-medium rounded-full shadow-sm">
                        인기
                      </div>
                    )}
                    {product.stock_quantity === 0 && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <span className="text-white font-bold text-lg">품절</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-neutral-900 mb-2 line-clamp-2 group-hover:text-orange-500 transition-colors">
                    {product.name}
                  </h3>
                  {product.description && (
                    <p className="text-neutral-600 text-sm mb-3 line-clamp-2">
                      {product.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-orange-500 font-bold text-lg">
                      {formatPrice(product.price)}원
                    </p>
                    <span className="text-sm text-neutral-500">
                      재고: {product.stock_quantity}개
                    </span>
                  </div>
                  <Button
                    onClick={() => addToCart(product.id)}
                    disabled={product.stock_quantity === 0}
                    className="w-full"
                    variant={product.stock_quantity === 0 ? 'outline' : 'primary'}
                  >
                    {product.stock_quantity === 0 ? '품절' : '장바구니 담기'}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-6xl mb-6">🛍️</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {searchQuery ? '검색 결과가 없습니다' : '등록된 상품이 없습니다'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchQuery ? '다른 검색어로 시도해보세요' : '곧 새로운 상품들이 추가될 예정입니다'}
            </p>
            {searchQuery && (
              <Button onClick={() => setSearchQuery('')} variant="outline">
                검색 초기화
              </Button>
            )}
          </div>
        )}

        {/* 장바구니 링크 */}
        <div className="fixed bottom-6 right-6">
          <Link href="/cart">
            <Button
              size="lg"
              className="shadow-lg hover:shadow-xl rounded-full p-4"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m1.6 8L5 5H3m4 8v6a2 2 0 002 2h6a2 2 0 002-2v-6" />
              </svg>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}