'use client'

import React, { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'

// useSearchParams를 사용하는 컴포넌트를 분리
function PaymentFailContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [errorInfo, setErrorInfo] = useState<{
    code: string
    message: string
    orderId?: string
  } | null>(null)

  useEffect(() => {
    const code = searchParams.get('code') || 'UNKNOWN_ERROR'
    const message = searchParams.get('message') || '알 수 없는 오류가 발생했습니다.'
    const orderId = searchParams.get('orderId') || undefined

    setErrorInfo({ code, message, orderId })
  }, [searchParams])

  const getErrorTitle = (code: string) => {
    switch (code) {
      case 'CANCELED_BY_USER':
        return '결제가 취소되었습니다'
      case 'INSUFFICIENT_FUNDS':
        return '잔액이 부족합니다'
      case 'INVALID_CARD':
        return '유효하지 않은 카드입니다'
      case 'EXPIRED_CARD':
        return '카드 유효기간이 만료되었습니다'
      case 'NETWORK_ERROR':
        return '네트워크 오류가 발생했습니다'
      default:
        return '결제에 실패했습니다'
    }
  }

  const getErrorDescription = (code: string) => {
    switch (code) {
      case 'CANCELED_BY_USER':
        return '결제를 취소하셨습니다. 다시 시도해주세요.'
      case 'INSUFFICIENT_FUNDS':
        return '카드 잔액 또는 한도를 확인하고 다시 시도해주세요.'
      case 'INVALID_CARD':
        return '카드 정보를 확인하고 다시 시도해주세요.'
      case 'EXPIRED_CARD':
        return '카드 유효기간을 확인하고 다른 카드로 시도해주세요.'
      case 'NETWORK_ERROR':
        return '잠시 후 다시 시도해주세요.'
      default:
        return '문제가 지속되면 고객센터로 문의해주세요.'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-red-500 to-red-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="text-center">
            <h1 className="text-2xl sm:text-4xl font-bold mb-3 sm:mb-4 text-white">결제 실패</h1>
            <p className="text-base sm:text-lg max-w-2xl mx-auto text-white opacity-90 px-2">
              결제 처리 중 문제가 발생했습니다
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card className="text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>

          {errorInfo && (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {getErrorTitle(errorInfo.code)}
              </h2>
              
              <p className="text-gray-600 mb-6">
                {getErrorDescription(errorInfo.code)}
              </p>

              <div className="bg-red-50 rounded-lg p-6 mb-8 text-left">
                <h3 className="font-medium text-red-900 mb-3">오류 정보</h3>
                <div className="space-y-2 text-sm text-red-800">
                  <div>
                    <span className="font-medium">오류 코드:</span> {errorInfo.code}
                  </div>
                  <div>
                    <span className="font-medium">오류 메시지:</span> {errorInfo.message}
                  </div>
                  {errorInfo.orderId && (
                    <div>
                      <span className="font-medium">주문번호:</span> {errorInfo.orderId}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          <div className="space-y-4 text-gray-600 mb-8">
            <p>다른 결제 방법을 시도하거나 잠시 후 다시 시도해주세요.</p>
            <p className="text-sm">
              문제가 지속될 경우 고객센터(1588-0000)로 문의하시거나 
              채팅 상담을 이용해주세요.
            </p>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={() => router.back()}
              size="lg" 
              className="w-full sm:w-auto"
            >
              다시 시도
            </Button>
            <Link href="/cart">
              <Button 
                variant="outline" 
                size="lg" 
                className="w-full sm:w-auto"
              >
                장바구니로 돌아가기
              </Button>
            </Link>
            <Link href="/rabbit-store">
              <Button 
                variant="outline" 
                size="lg" 
                className="w-full sm:w-auto"
              >
                쇼핑 계속하기
              </Button>
            </Link>
          </div>

          {/* 고객센터 정보 */}
          <div className="mt-8 pt-8 border-t border-gray-200 text-sm text-gray-500">
            <p className="mb-2">📞 고객센터: 1588-0000 (평일 09:00~18:00)</p>
            <p>💬 채팅상담: 24시간 운영</p>
          </div>
        </Card>
      </div>
    </div>
  )
}

// 로딩 fallback 컴포넌트
function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto"></div>
        <p className="mt-2 text-gray-600">오류 정보를 불러오는 중...</p>
      </div>
    </div>
  )
}

// 메인 페이지 컴포넌트 (Suspense로 감쌈)
export default function PaymentFailPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <PaymentFailContent />
    </Suspense>
  )
}