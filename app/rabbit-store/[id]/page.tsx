'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeSanitize from 'rehype-sanitize'
import { createSupabaseClient } from '../../lib/supabase-client'
import SmartImage from '../../components/SmartImage'
import Loading from '../../components/ui/Loading'
import Button from '../../components/ui/Button'
import { useCart } from '../../contexts/CartContext'
import type { Product } from '../../../lib/actions/product-actions'

export default function ProductDetailPage() {
  const params = useParams()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const supabase = createSupabaseClient()
  const { addToCart } = useCart()

  useEffect(() => {
    if (params?.id) {
      fetchProduct(params.id as string)
    }
  }, [params?.id])

  const fetchProduct = async (productId: string) => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('rabbit_store_products')
        .select('*')
        .eq('id', productId)
        .eq('is_active', true)
        .single()

      if (error) throw error
      setProduct(data)
    } catch (error) {
      console.error('상품 조회 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR').format(price)
  }

  const handleQuantityChange = (delta: number) => {
    const newQuantity = quantity + delta
    if (newQuantity >= 1 && newQuantity <= (product?.stock_quantity || 0)) {
      setQuantity(newQuantity)
    }
  }

  const handleAddToCart = () => {
    if (product) {
      addToCart({
        id: product.id,
        name: product.name,
        price: product.price,
        image_url: product.image_url,
        category: product.category,
        stock_quantity: product.stock_quantity
      }, quantity)
      alert(`${product.name} ${quantity}개를 장바구니에 담았습니다!`)
    }
  }

  const buyNow = () => {
    alert(`${product?.name} ${quantity}개를 구매합니다.\n(결제 기능은 준비 중입니다)`)
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

  // 마크다운 전처리 함수
  const preprocessMarkdownForLineBreaks = (content: string) => {
    return content
      .replace(/\n{2,}/g, '\n')
      .replace(/\n/g, '  \n')
  }

  // 마크다운과 일반 텍스트를 모두 처리하는 함수
  const renderContent = (content: string, isMarkdown: boolean = true) => {
    if (!content) return null
    
    if (isMarkdown) {
      const processedContent = preprocessMarkdownForLineBreaks(content)
      
      return (
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeSanitize]}
          components={{
            p: ({ children }) => <p className="mb-4 leading-relaxed text-gray-600">{children}</p>,
            h1: ({ children }) => <h1 className="text-2xl font-bold mb-4 text-gray-900">{children}</h1>,
            h2: ({ children }) => <h2 className="text-xl font-bold mb-3 text-gray-800">{children}</h2>,
            h3: ({ children }) => <h3 className="text-lg font-semibold mb-2 text-gray-800">{children}</h3>,
            ul: ({ children }) => <ul className="mb-4 space-y-2 list-disc list-inside">{children}</ul>,
            ol: ({ children }) => <ol className="mb-4 space-y-2 list-decimal list-inside">{children}</ol>,
            li: ({ children }) => <li className="text-gray-600">{children}</li>,
            strong: ({ children }) => <strong className="font-bold text-gray-900">{children}</strong>,
            em: ({ children }) => <em className="italic">{children}</em>,
            blockquote: ({ children }) => (
              <blockquote className="border-l-4 border-primary-500 pl-4 my-4 italic text-gray-700">
                {children}
              </blockquote>
            ),
            code: ({ children }) => (
              <code className="bg-gray-100 text-gray-800 px-1 py-0.5 rounded text-sm">
                {children}
              </code>
            ),
            pre: ({ children }) => (
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto my-4">
                {children}
              </pre>
            ),
            img: ({ src, alt }) => (
              <img src={src} alt={alt || ''} className="rounded-lg my-4 max-w-full h-auto" />
            ),
            a: ({ children, href }) => (
              <a href={href} className="text-primary-600 hover:text-primary-700 underline">
                {children}
              </a>
            ),
          }}
        >
          {processedContent}
        </ReactMarkdown>
      )
    } else {
      return <div className="text-gray-600">{formatTextWithBreaks(content)}</div>
    }
  }

  const getCategoryName = (category: string) => {
    const categories: { [key: string]: string } = {
      'goods': '굿즈',
      'lifestyle': '생활용품',
      'stationery': '문구',
      'clothing': '의류',
      'other': '기타'
    }
    return categories[category] || category
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loading size="lg" text="상품 정보 로딩 중..." />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">상품을 찾을 수 없습니다</h1>
          <p className="text-gray-600 mb-6">요청하신 상품이 존재하지 않거나 판매가 종료되었습니다.</p>
          <Link href="/rabbit-store">
            <Button>상품 목록으로 돌아가기</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* 상단 네비게이션 */}
        <div className="mb-4 sm:mb-6">
          <Link href="/rabbit-store" className="inline-flex items-center text-primary-600 hover:text-primary-700 min-h-[44px] text-sm sm:text-base">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            토끼상점으로 돌아가기
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            {/* 왼쪽: 상품 이미지 */}
            <div className="bg-gray-50 p-4 sm:p-8">
              <div className="aspect-square bg-white rounded-lg overflow-hidden shadow-sm">
                <SmartImage
                  src={product.image_url}
                  alt={product.name}
                  width={600}
                  height={600}
                  className="w-full h-full object-cover"
                  fallback={
                    <div className="w-full h-full bg-neutral-100 flex items-center justify-center">
                      <svg className="w-20 h-20 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                  }
                />
              </div>
            </div>

            {/* 오른쪽: 상품 정보 및 구매 옵션 */}
            <div className="p-4 sm:p-8">
              {/* 카테고리 */}
              <div className="mb-4">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-700">
                  {getCategoryName(product.category)}
                </span>
                {product.is_featured && (
                  <span className="ml-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-secondary-100 text-secondary-700">
                    인기 상품
                  </span>
                )}
              </div>

              {/* 상품명 */}
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
                {formatTextWithBreaks(product.name)}
              </h1>

              {/* 가격 */}
              <div className="mb-6">
                <div className="text-3xl font-bold text-primary-500 mb-2">
                  {formatPrice(product.price)}원
                </div>
                <p className="text-sm text-gray-500">배송비는 결제 시 확인하실 수 있습니다</p>
              </div>

              {/* 재고 상태 */}
              <div className="mb-6">
                {product.stock_quantity > 0 ? (
                  <p className="text-sm text-gray-600">
                    재고: <span className="font-medium text-gray-900">{product.stock_quantity}개</span>
                  </p>
                ) : (
                  <p className="text-red-600 font-medium">품절</p>
                )}
              </div>

              {/* 수량 선택 */}
              {product.stock_quantity > 0 && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    수량
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleQuantityChange(-1)}
                      disabled={quantity <= 1}
                      className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                      </svg>
                    </button>
                    <span className="w-16 text-center font-medium text-lg">{quantity}</span>
                    <button
                      onClick={() => handleQuantityChange(1)}
                      disabled={quantity >= product.stock_quantity}
                      className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}

              {/* 구매 버튼 */}
              <div className="space-y-3 mb-6">
                <Button
                  onClick={buyNow}
                  disabled={product.stock_quantity === 0}
                  size="lg"
                  className="w-full"
                  variant="primary"
                >
                  {product.stock_quantity === 0 ? '품절' : '바로 구매하기'}
                </Button>
                <Button
                  onClick={handleAddToCart}
                  disabled={product.stock_quantity === 0}
                  size="lg"
                  className="w-full"
                  variant="outline"
                >
                  장바구니 담기
                </Button>
              </div>

              {/* 안내 사항 */}
              <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600 space-y-2">
                <p>• 실제 상품과 이미지가 다를 수 있습니다</p>
                <p>• 교환 및 환불은 구매 후 7일 이내 가능합니다</p>
                <p>• 한정 수량 상품으로 조기 품절될 수 있습니다</p>
              </div>
            </div>
          </div>

          {/* 상품 설명 */}
          {product.description && (
            <div className="border-t border-gray-200 p-4 sm:p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">상품 설명</h2>
              <div className="prose max-w-none">
                {renderContent(product.description)}
              </div>
            </div>
          )}

          {/* 공유하기 */}
          <div className="border-t border-gray-200 p-4 sm:p-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">공유하기</h3>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: product.name,
                      text: `골든래빗 토끼상점 - ${product.name}`,
                      url: window.location.href,
                    })
                  } else {
                    navigator.clipboard.writeText(window.location.href)
                    alert('링크가 클립보드에 복사되었습니다!')
                  }
                }}
                className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                </svg>
                공유하기
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}