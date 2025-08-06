'use client'

import React, { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'

// useSearchParams를 사용하는 컴포넌트를 분리
function PaymentSuccessContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(true)
  const [orderInfo, setOrderInfo] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const processPayment = async () => {
      try {
        const paymentKey = searchParams.get('paymentKey')
        const orderId = searchParams.get('orderId')
        const amount = searchParams.get('amount')

        if (!paymentKey || !orderId || !amount) {
          throw new Error('필수 결제 정보가 누락되었습니다.')
        }

        // Server Action 직접 호출
        const { confirmPayment } = await import('../../../lib/actions/payment-actions')
        
        // FormData 생성
        const formData = new FormData()
        formData.append('paymentKey', paymentKey)
        formData.append('orderId', orderId)
        formData.append('amount', amount)
        
        const result = await confirmPayment(formData)

        if (!result.success) {
          throw new Error(result.error || '결제 승인에 실패했습니다.')
        }

        setOrderInfo(result.data || result)
        setIsProcessing(false)
      } catch (error: any) {
        console.error('결제 승인 처리 실패:', error)
        setError(error.message)
        setIsProcessing(false)
      }
    }

    processPayment()
  }, [searchParams])

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="text-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">결제를 처리하고 있습니다</h2>
          <p className="text-gray-600">잠시만 기다려주세요...</p>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="text-center p-8 max-w-md">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">결제 처리 실패</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <Button onClick={() => router.back()}>다시 시도</Button>
            <Link href="/rabbit-store">
              <Button variant="outline" className="w-full">쇼핑 계속하기</Button>
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-gold shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="text-center">
            <h1 className="text-2xl sm:text-4xl font-bold mb-3 sm:mb-4 text-white">결제 완료</h1>
            <p className="text-base sm:text-lg max-w-2xl mx-auto text-white opacity-90 px-2">
              결제가 성공적으로 완료되었습니다
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card className="text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-4">결제가 완료되었습니다!</h2>
          
          {orderInfo && (
            <div className="space-y-4 mb-8">
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">주문번호</p>
                    <p className="font-semibold">{orderInfo.orderId}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">결제금액</p>
                    <p className="font-semibold text-primary-500">
                      {orderInfo.totalAmount?.toLocaleString()}원
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">결제방법</p>
                    <p className="font-semibold">{orderInfo.method}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">결제일시</p>
                    <p className="font-semibold">
                      {new Date(orderInfo.approvedAt).toLocaleString('ko-KR')}
                    </p>
                  </div>
                </div>
              </div>

              {orderInfo.receipt?.url && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-blue-800 mb-2">📧 결제 영수증</p>
                  <a 
                    href={orderInfo.receipt.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline text-sm"
                  >
                    영수증 보기
                  </a>
                </div>
              )}
            </div>
          )}

          <div className="space-y-4 text-gray-600 mb-8">
            <p>주문 내역이 입력하신 이메일로 발송되었습니다.</p>
            <p className="text-sm">배송은 주문 후 1-3일 내에 시작됩니다.</p>
          </div>

          <div className="space-y-3">
            <Link href="/rabbit-store">
              <Button size="lg" className="w-full sm:w-auto">
                쇼핑 계속하기
              </Button>
            </Link>
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
        <p className="mt-2 text-gray-600">결제 정보를 불러오는 중...</p>
      </div>
    </div>
  )
}

// 메인 페이지 컴포넌트 (Suspense로 감쌈)
export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <PaymentSuccessContent />
    </Suspense>
  )
}