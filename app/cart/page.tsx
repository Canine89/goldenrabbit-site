'use client'

import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCart, CartItem } from '../contexts/CartContext'
import SmartImage from '../components/SmartImage'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'

export default function CartPage() {
  const router = useRouter()
  const { items, updateQuantity, removeFromCart, clearCart, getTotalPrice, getTotalItems } = useCart()

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR').format(price)
  }

  const formatTextWithBreaks = (text: string) => {
    if (!text) return text
    return text.split('\n').map((line, index, array) => (
      <React.Fragment key={index}>
        {line}
        {index < array.length - 1 && <br />}
      </React.Fragment>
    ))
  }

  const handleQuantityChange = (item: CartItem, delta: number) => {
    const newQuantity = item.quantity + delta
    if (newQuantity > 0) {
      updateQuantity(item.id, newQuantity)
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

  const handleCheckout = () => {
    router.push('/checkout')
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* 헤더 섹션 */}
        <div className="bg-gradient-gold shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
            <div className="text-center">
              <h1 className="text-2xl sm:text-4xl font-bold mb-3 sm:mb-4 text-white">장바구니</h1>
              <p className="text-base sm:text-lg max-w-2xl mx-auto text-white opacity-90 px-2">
                선택하신 상품들을 확인하고 주문하세요
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m1.6 8L5 5H3m4 8v6a2 2 0 002 2h6a2 2 0 002-2v-6" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">장바구니가 비어있습니다</h2>
            <p className="text-gray-600 mb-8">토끼상점에서 마음에 드는 상품을 담아보세요!</p>
            <Link href="/rabbit-store">
              <Button size="lg">
                상품 둘러보기
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 섹션 */}
      <div className="bg-gradient-gold shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="text-center">
            <h1 className="text-2xl sm:text-4xl font-bold mb-3 sm:mb-4 text-white">장바구니</h1>
            <p className="text-base sm:text-lg max-w-2xl mx-auto text-white opacity-90 px-2">
              선택하신 상품들을 확인하고 주문하세요
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* 왼쪽: 장바구니 상품 목록 */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                장바구니 상품 ({getTotalItems()}개)
              </h2>
              <button
                onClick={clearCart}
                className="text-sm text-red-600 hover:text-red-700 font-medium"
              >
                전체 삭제
              </button>
            </div>

            <div className="space-y-4">
              {items.map((item) => (
                <Card key={item.id} padding="none" className="overflow-hidden">
                  <div className="p-4 sm:p-6">
                    <div className="flex gap-4">
                      {/* 상품 이미지 */}
                      <div className="flex-shrink-0">
                        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-100 rounded-lg overflow-hidden">
                          <SmartImage
                            src={item.image_url}
                            alt={item.name}
                            width={96}
                            height={96}
                            className="w-full h-full object-cover"
                            fallback={
                              <div className="w-full h-full bg-neutral-100 flex items-center justify-center">
                                <svg className="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                              </div>
                            }
                          />
                        </div>
                      </div>

                      {/* 상품 정보 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className="inline-block px-2 py-1 text-xs bg-primary-100 text-primary-700 rounded-full mb-2">
                              {getCategoryName(item.category)}
                            </span>
                            <h3 className="text-sm sm:text-base font-semibold text-gray-900 line-clamp-2">
                              <Link href={`/rabbit-store/${item.id}`} className="hover:text-primary-600">
                                {formatTextWithBreaks(item.name)}
                              </Link>
                            </h3>
                          </div>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="text-gray-400 hover:text-red-500 p-1"
                            aria-label="상품 삭제"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>

                        <div className="flex items-center justify-between">
                          {/* 수량 조정 */}
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleQuantityChange(item, -1)}
                              disabled={item.quantity <= 1}
                              className="w-8 h-8 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                              </svg>
                            </button>
                            <span className="w-12 text-center font-medium">{item.quantity}</span>
                            <button
                              onClick={() => handleQuantityChange(item, 1)}
                              disabled={item.quantity >= item.stock_quantity}
                              className="w-8 h-8 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                            </button>
                          </div>

                          {/* 가격 */}
                          <div className="text-right">
                            <div className="text-lg font-bold text-primary-500">
                              {formatPrice(item.price * item.quantity)}원
                            </div>
                            <div className="text-sm text-gray-500">
                              개당 {formatPrice(item.price)}원
                            </div>
                          </div>
                        </div>

                        {/* 재고 경고 */}
                        {item.quantity >= item.stock_quantity && (
                          <div className="mt-2 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                            재고 한계에 도달했습니다 (최대 {item.stock_quantity}개)
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* 오른쪽: 주문 요약 */}
          <div className="lg:col-span-1">
            <div className="sticky top-6">
              <Card>
                <h3 className="text-lg font-bold text-gray-900 mb-4">주문 요약</h3>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">상품 개수</span>
                    <span className="font-medium">{getTotalItems()}개</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">상품 금액</span>
                    <span className="font-medium">{formatPrice(getTotalPrice())}원</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">배송비</span>
                    <span className="font-medium">무료</span>
                  </div>
                  <hr />
                  <div className="flex justify-between text-lg font-bold">
                    <span>총 결제 금액</span>
                    <span className="text-primary-500">{formatPrice(getTotalPrice())}원</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button
                    onClick={handleCheckout}
                    size="lg"
                    className="w-full"
                  >
                    주문하기
                  </Button>
                  <Link href="/rabbit-store">
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full"
                    >
                      쇼핑 계속하기
                    </Button>
                  </Link>
                </div>

                {/* 안내 메시지 */}
                <div className="mt-6 bg-gray-50 rounded-lg p-4 text-sm text-gray-600 space-y-2">
                  <p>• 무료배송 (도서산간 지역 제외)</p>
                  <p>• 주문 후 1-3일 내 배송</p>
                  <p>• 교환/환불은 상품 수령 후 7일 이내</p>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}