import { Link } from 'react-router-dom'
import { useStore } from '../store/useStore'

export default function Cart() {
  const { cart, removeFromCart, clearCart, getCartPrice } = useStore()

  const formatPrice = (price) => {
    return new Intl.NumberFormat('ko-KR').format(price)
  }

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId)
    } else {
      // 수량 업데이트 로직 (현재는 단순히 제거만 구현)
      // 추후 addToCart 함수에 수량 업데이트 기능 추가 필요
    }
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="text-gray-400 mb-6">
              <svg className="w-24 h-24 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 3h2l.4 2M7 13h10l4-8H5.4m1.6 8L5 5H3m4 8v6a2 2 0 002 2h6a2 2 0 002-2v-6" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              장바구니가 비어있습니다
            </h2>
            <p className="text-gray-600 mb-8">
              토끼상점에서 마음에 드는 상품을 담아보세요!
            </p>
            <Link
              to="/rabbit-store"
              className="bg-golden-rabbit-orange text-white px-8 py-3 rounded-lg font-semibold hover:bg-orange-600 transition-colors"
            >
              토끼상점 둘러보기
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            장바구니
          </h1>
          <p className="text-gray-600">
            총 {cart.length}개의 상품이 담겨있습니다
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 장바구니 상품 목록 */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-gray-900">
                    상품 목록
                  </h2>
                  <button
                    onClick={clearCart}
                    className="text-sm text-gray-500 hover:text-red-600 transition-colors"
                  >
                    전체 삭제
                  </button>
                </div>
              </div>
              
              <div className="divide-y divide-gray-200">
                {cart.map((item) => (
                  <div key={item.id} className="p-6">
                    <div className="flex items-center space-x-4">
                      {/* 상품 이미지 */}
                      <div className="flex-shrink-0">
                        <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden">
                          {item.image_url ? (
                            <img 
                              src={item.image_url} 
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                              </svg>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 상품 정보 */}
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {item.name}
                        </h3>
                        {item.category && (
                          <p className="text-sm text-gray-500 mb-2">
                            {item.category}
                          </p>
                        )}
                        <p className="text-lg font-bold text-golden-rabbit-orange">
                          {formatPrice(item.price)}원
                        </p>
                      </div>

                      {/* 수량 및 삭제 */}
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-500">수량:</span>
                          <span className="bg-gray-100 px-3 py-1 rounded-lg text-sm font-medium">
                            {item.quantity}
                          </span>
                        </div>
                        
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 주문 요약 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                주문 요약
              </h2>
              
              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">상품 금액</span>
                  <span>{formatPrice(getCartPrice())}원</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">배송비</span>
                  <span>무료</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between font-semibold">
                    <span>총 결제 금액</span>
                    <span className="text-golden-rabbit-orange">
                      {formatPrice(getCartPrice())}원
                    </span>
                  </div>
                </div>
              </div>

              <button className="w-full bg-golden-rabbit-orange text-white py-3 rounded-lg font-semibold hover:bg-orange-600 transition-colors mb-3">
                주문하기
              </button>
              
              <Link
                to="/rabbit-store"
                className="block w-full text-center bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                쇼핑 계속하기
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}