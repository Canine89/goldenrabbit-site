'use client'

import Link from 'next/link'
import Button from '../components/ui/Button'

export default function CartPage() {
  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 상단 네비게이션 */}
        <div className="mb-6">
          <Link href="/rabbit-store" className="inline-flex items-center text-primary-500 hover:text-black">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            토끼상점으로 돌아가기
          </Link>
        </div>
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-primary-500">장바구니</h1>
          <p className="text-primary-500">선택하신 상품들을 확인하고 주문하세요</p>
        </div>
        {/* 빈 장바구니 상태 */}
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <div className="text-6xl mb-6">🛒</div>
          <h2 className="text-2xl font-bold mb-4 text-primary-500">장바구니가 비어있습니다</h2>
          <p className="text-primary-500 mb-8">토끼상점에서 다양한 상품들을 둘러보세요!</p>
          <div className="space-y-4">
            <Link href="/rabbit-store">
              <Button size="lg" className="w-full sm:w-auto bg-primary-500 text-white hover:bg-white hover:text-primary-500">
                토끼상점 둘러보기
              </Button>
            </Link>
            <div className="text-sm text-primary-500 mt-4">
              <p>💡 <strong>팁:</strong> 장바구니 기능은 현재 개발 중입니다</p>
              <p>상품 구매 문의는 고객센터로 연락해주세요</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}