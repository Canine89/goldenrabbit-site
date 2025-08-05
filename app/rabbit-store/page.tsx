'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { createSupabaseClient } from '../lib/supabase-client'
import SmartImage from '../components/SmartImage'
import Card from '../components/ui/Card'
import Loading from '../components/ui/Loading'
import Button from '../components/ui/Button'
import { useCart } from '../contexts/CartContext'
import type { Product } from '../../lib/actions/product-actions'

const categories = [
  { id: 'all', name: '전체', slug: 'all' },
  { id: 'goods', name: '굿즈', slug: 'goods' },
  { id: 'lifestyle', name: '생활용품', slug: 'lifestyle' },
  { id: 'stationery', name: '문구', slug: 'stationery' },
  { id: 'clothing', name: '의류', slug: 'clothing' },
  { id: 'other', name: '기타', slug: 'other' },
]

export default function RabbitStorePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const supabase = createSupabaseClient()
  const { addToCart } = useCart()

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

  // Enter로 입력된 줄바꿈을 JSX로 처리하는 함수
  const formatTextWithBreaks = (text: string) => {
    if (!text) return text
    return text.split('\n').map((line, index, array) => (
      <React.Fragment key={index}>
        {line}
        {index < array.length - 1 && <br />}
      </React.Fragment>
    ))
  }

  const handleAddToCart = async (productId: string) => {
    const product = products.find(p => p.id === productId)
    if (product) {
      addToCart({
        id: product.id,
        name: product.name,
        price: product.price,
        image_url: product.image_url,
        category: product.category,
        stock_quantity: product.stock_quantity
      }, 1)
      alert(`${product.name}이(가) 장바구니에 추가되었습니다!`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 섹션 */}
      <div className="bg-gradient-gold shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="text-center">
            <h1 className="text-2xl sm:text-4xl font-bold mb-3 sm:mb-4 text-white">토끼상점</h1>
            <p className="text-base sm:text-lg max-w-2xl mx-auto text-white opacity-90 px-2">
              골든래빗만의 특별한 상품들을 만나보세요! 실제 구매가 가능한 프리미엄 아이템들입니다.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* 검색 및 필터 */}
        <div className="mb-6 sm:mb-8 space-y-4 sm:space-y-6">
          {/* 검색바 */}
          <div className="relative max-w-full sm:max-w-lg mx-auto">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="상품명을 검색하세요..."
              className="block w-full pl-12 pr-12 py-3 sm:py-3 bg-white border border-gray-300 rounded-xl shadow-sm text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:outline-none transition-all duration-200 min-h-[48px] text-base"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors min-w-[44px] min-h-[44px] justify-center"
                aria-label="검색어 지우기"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* 카테고리 필터 */}
          <div className="overflow-x-auto">
            <div className="flex gap-2 sm:gap-3 justify-start sm:justify-center min-w-max px-4 sm:px-0">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex-shrink-0 px-4 sm:px-6 py-2 sm:py-2 rounded-full font-medium transition-colors min-h-[44px] flex items-center justify-center whitespace-nowrap text-sm sm:text-base ${
                    selectedCategory === category.id
                      ? 'bg-primary-500 text-white shadow-lg'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 상품 목록 */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
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
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {filteredProducts.map((product) => (
              <Card
                key={product.id}
                hover={true}
                padding="none"
                className="overflow-visible group"
              >
                <Link href={`/rabbit-store/${product.id}`} className="block">
                  <div className="p-2 sm:p-4 pb-0">
                    <div className="aspect-square bg-neutral-100 overflow-hidden rounded-lg shadow-sm group-hover:shadow-md transition-all duration-300 relative">
                      <SmartImage
                        src={product.image_url}
                        alt={product.name}
                        width={300}
                        height={300}
                        className="w-full h-full object-cover p-1 sm:p-2 group-hover:scale-105 transition-transform duration-300"
                        fallback={
                          <div className="w-full h-full bg-neutral-100 flex items-center justify-center p-4 sm:p-8">
                            <svg className="w-8 h-8 sm:w-12 sm:h-12 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                          </div>
                        }
                      />
                      {product.is_featured && (
                        <div className="absolute top-2 right-2 sm:top-3 sm:right-3 px-2 py-1 bg-secondary-500 text-neutral-900 text-xs font-medium rounded-full shadow-sm">
                          인기
                        </div>
                      )}
                      {product.stock_quantity === 0 && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                          <span className="text-white font-bold text-lg">품절</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="p-3 sm:p-6">
                    <h3 className="text-sm sm:text-lg font-semibold text-neutral-900 mb-1 sm:mb-2 line-clamp-2 group-hover:text-primary-500 transition-colors leading-tight">
                      {formatTextWithBreaks(product.name)}
                    </h3>
                    {product.description && (
                      <p className="text-neutral-600 text-xs sm:text-sm mb-1 sm:mb-2 line-clamp-2">
                        {formatTextWithBreaks(product.description)}
                      </p>
                    )}
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-primary-500 font-bold text-lg">
                        {formatPrice(product.price)}원
                      </p>
                      <span className="text-xs sm:text-sm text-neutral-500">
                        재고: {product.stock_quantity}개
                      </span>
                    </div>
                  </div>
                </Link>
                <div className="p-3 sm:p-6 pt-0">
                  <Button
                    onClick={(e: React.MouseEvent) => {
                      e.preventDefault()
                      handleAddToCart(product.id)
                    }}
                    disabled={product.stock_quantity === 0}
                    size="sm"
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
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
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
        <div className="fixed bottom-6 right-6 z-50">
          <Link href="/cart">
            <button className="bg-primary-500 text-white p-4 rounded-full shadow-lg hover:shadow-xl hover:bg-primary-600 transition-all duration-200">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m1.6 8L5 5H3m4 8v6a2 2 0 002 2h6a2 2 0 002-2v-6" />
              </svg>
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}