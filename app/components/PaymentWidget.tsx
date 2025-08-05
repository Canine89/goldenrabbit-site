'use client'

import React, { useEffect, useRef, useState } from 'react'
import { loadTossPayments } from '@tosspayments/tosspayments-sdk'
import Button from './ui/Button'

interface PaymentWidgetProps {
  amount: number
  orderId: string
  orderName: string
  customerName?: string
  customerEmail?: string
  customerMobilePhone?: string
  shippingAddress?: string
  shippingPostcode?: string
  shippingNote?: string
  cartItems?: any[]
  onPaymentSuccess: (data: any) => void
  onPaymentFail: (error: any) => void
}

const PaymentWidget: React.FC<PaymentWidgetProps> = ({
  amount,
  orderId,
  orderName,
  customerName,
  customerEmail,
  customerMobilePhone,
  shippingAddress,
  shippingPostcode,
  shippingNote,
  cartItems,
  onPaymentSuccess,
  onPaymentFail
}) => {
  const [tossPayments, setTossPayments] = useState<any>(null)
  const [widgets, setWidgets] = useState<any>(null)
  const [paymentMethodsWidget, setPaymentMethodsWidget] = useState<any>(null)
  const [agreementWidget, setAgreementWidget] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [agreementStatus, setAgreementStatus] = useState({ agreedRequiredTerms: false })
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<any>({})

  const paymentMethodsRef = useRef<HTMLDivElement>(null)
  const agreementRef = useRef<HTMLDivElement>(null)

  // 고유한 customerKey 생성 (회원이면 사용자 ID, 비회원이면 임시 키)
  const generateCustomerKey = () => {
    // 세션 기반 고유 키 생성 (이메일 기반)
    if (customerEmail) {
      const emailHash = btoa(customerEmail).replace(/[^a-zA-Z0-9]/g, '').substring(0, 20)
      return `guest_${emailHash}_${Date.now().toString().substring(-6)}`
    }
    return `anonymous_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  }

  // 주문번호 생성 (토스페이먼츠용 - 하이픈 없이)
  const generateOrderNumber = () => {
    const date = new Date()
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
    const timeStr = Date.now().toString().slice(-6) // 마지막 6자리
    const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase()
    return `ORD${dateStr}${timeStr}${randomStr}`
  }

  useEffect(() => {
    const initializeTossPayments = async () => {
      try {
        console.log('🚀 토스페이먼츠 초기화 시작')
        
        const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY
        console.log('🔑 클라이언트 키 확인:', clientKey ? '존재함' : '없음')
        
        if (!clientKey) {
          throw new Error('토스페이먼츠 클라이언트 키가 설정되지 않았습니다.')
        }

        console.log('📦 토스페이먼츠 SDK 로딩 중...')
        const tossPaymentsInstance = await loadTossPayments(clientKey)
        setTossPayments(tossPaymentsInstance)

        const customerKey = generateCustomerKey()
        console.log('👤 고객키 생성:', customerKey)
        
        const widgetsInstance = tossPaymentsInstance.widgets({ customerKey })
        setWidgets(widgetsInstance)

        // 결제 금액 설정
        console.log('💰 결제 금액 설정:', amount)
        await widgetsInstance.setAmount({
          currency: 'KRW',
          value: amount,
        })

        setDebugInfo({
          clientKey: clientKey ? 'OK' : 'ERROR',
          customerKey,
          amount,
          timestamp: new Date().toISOString()
        })

        console.log('✅ 토스페이먼츠 초기화 완료')
        setIsLoading(false)
        setError(null)
      } catch (error: any) {
        console.error('❌ 토스페이먼츠 초기화 실패:', error)
        setError(error.message || '토스페이먼츠 초기화에 실패했습니다.')
        setDebugInfo({
          error: error.message,
          timestamp: new Date().toISOString()
        })
        setIsLoading(false)
      }
    }

    initializeTossPayments()
  }, [amount])

  useEffect(() => {
    const renderWidgets = async () => {
      if (!widgets || isLoading) {
        console.log('🔄 위젯 렌더링 대기 중 - widgets:', !!widgets, 'loading:', isLoading)
        return
      }

      try {
        console.log('🎨 위젯 렌더링 시작')
        
        // 결제 방법 위젯 렌더링
        if (paymentMethodsRef.current) {
          console.log('💳 결제 방법 위젯 렌더링 중...')
          const paymentMethods = await widgets.renderPaymentMethods(
            {
              selector: '#payment-methods',
              variantKey: 'DEFAULT'
            }
          )
          setPaymentMethodsWidget(paymentMethods)
          console.log('✅ 결제 방법 위젯 렌더링 완료')
        }

        // 약관 위젯 렌더링
        if (agreementRef.current) {
          console.log('📄 약관 위젯 렌더링 중...')
          const agreement = await widgets.renderAgreement(
            {
              selector: '#agreement',
              variantKey: 'AGREEMENT'
            }
          )
          
          // 약관 동의 상태 변경 이벤트 구독
          agreement.on('agreementStatusChange', (status: any) => {
            console.log('📋 약관 동의 상태 변경:', status)
            setAgreementStatus(status)
          })
          
          setAgreementWidget(agreement)
          console.log('✅ 약관 위젯 렌더링 완료')
        }
        
        console.log('🎉 모든 위젯 렌더링 완료')
      } catch (error: any) {
        console.error('❌ 위젯 렌더링 실패:', error)
        setError('결제 위젯 렌더링에 실패했습니다: ' + error.message)
      }
    }

    renderWidgets()

    // 컴포넌트 언마운트 시 위젯 정리
    return () => {
      if (paymentMethodsWidget) {
        console.log('🧹 결제 방법 위젯 정리')
        paymentMethodsWidget.destroy?.()
      }
      if (agreementWidget) {
        console.log('🧹 약관 위젯 정리')
        agreementWidget.destroy?.()
      }
    }
  }, [widgets, isLoading])

  const handlePayment = async () => {
    console.log('💳 결제 요청 시작')
    
    if (!widgets || !agreementStatus.agreedRequiredTerms) {
      const message = '필수 약관에 동의해주세요.'
      console.log('⚠️ 약관 동의 필요:', { widgets: !!widgets, agreedRequiredTerms: agreementStatus.agreedRequiredTerms })
      alert(message)
      return
    }

    if (!customerName || !customerEmail || !shippingAddress || !shippingPostcode || !cartItems || cartItems.length === 0) {
      const message = '주문 정보가 완전하지 않습니다.'
      console.log('⚠️ 주문 정보 부족:', {
        customerName: customerName,
        customerEmail: customerEmail,
        shippingAddress: shippingAddress,
        shippingPostcode: shippingPostcode,
        cartItems: cartItems?.length || 0,
        amount: amount,
        orderId: orderId,
        orderName: orderName
      })
      alert(message)
      return
    }

    setIsProcessing(true)

    try {
      // 먼저 주문 정보를 데이터베이스에 저장
      const orderNumber = generateOrderNumber()
      console.log('📝 주문번호 생성:', orderNumber)
      
      const orderData = {
        orderId,
        orderNumber,
        totalAmount: amount,
        customerName,
        customerPhone: customerMobilePhone || '',
        customerEmail,
        shippingAddress,
        shippingPostcode,
        shippingNote: shippingNote || '',
        cartItems
      }

      console.log('📤 주문 정보 전송:', orderData)

      // Server Action 직접 호출
      const { createPendingOrder } = await import('../../lib/actions/order-actions')
      const result = await createPendingOrder(orderData)

      console.log('📥 주문 생성 응답:', result.success ? '성공' : '실패')

      if (!result.success) {
        console.error('❌ 주문 생성 실패:', result.error)
        throw new Error(result.error || '주문 정보 저장에 실패했습니다')
      }

      console.log('✅ 주문 생성 성공:', result)

      // 토스페이먼츠 결제 요청
      const paymentData = {
        orderId: orderNumber, // 실제 주문번호 사용
        orderName,
        amount,
        successUrl: `${window.location.origin}/checkout/success`,
        failUrl: `${window.location.origin}/checkout/fail`,
        customerEmail,
        customerName,
        customerMobilePhone,
      }

      console.log('💰 토스페이먼츠 결제 요청:', paymentData)
      
      // 토스페이먼츠 위젯에 결제 요청
      const requestPaymentParams: any = {
        orderId: paymentData.orderId,
        orderName: paymentData.orderName,
        successUrl: paymentData.successUrl,
        failUrl: paymentData.failUrl,
      }
      
      // 고객 정보가 있는 경우에만 추가
      if (paymentData.customerEmail) {
        requestPaymentParams.customerEmail = paymentData.customerEmail
      }
      if (paymentData.customerName) {
        requestPaymentParams.customerName = paymentData.customerName
      }
      if (paymentData.customerMobilePhone) {
        requestPaymentParams.customerMobilePhone = paymentData.customerMobilePhone
      }
      
      console.log('📋 최종 결제 요청 파라미터:', requestPaymentParams)
      
      // 필수 필드 재검증
      if (!requestPaymentParams.orderId || !requestPaymentParams.orderName || 
          !requestPaymentParams.successUrl || !requestPaymentParams.failUrl) {
        throw new Error('필수 결제 정보가 누락되었습니다.')
      }
      
      await widgets.requestPayment(requestPaymentParams)
    } catch (error: any) {
      console.error('❌ 결제 요청 실패:', error)
      setError('결제 요청에 실패했습니다: ' + error.message)
      onPaymentFail(error)
      setIsProcessing(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        <span className="ml-2 text-gray-600">결제 시스템을 준비하고 있습니다...</span>
        {debugInfo.timestamp && (
          <div className="mt-4 text-xs text-gray-500 bg-gray-50 p-2 rounded">
            디버그: {JSON.stringify(debugInfo, null, 2)}
          </div>
        )}
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">결제 시스템 오류</h3>
        <p className="text-red-600 text-center mb-4">{error}</p>
        <button
          onClick={() => {
            setError(null)
            setIsLoading(true)
            // 페이지 새로고침으로 재시도
            window.location.reload()
          }}
          className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
        >
          다시 시도
        </button>
        {debugInfo && (
          <div className="mt-4 text-xs text-gray-500 bg-gray-50 p-2 rounded max-w-full overflow-auto">
            <strong>디버그 정보:</strong>
            <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 결제 방법 선택 */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">결제 방법</h3>
        <div 
          id="payment-methods" 
          ref={paymentMethodsRef}
          className="border border-gray-200 rounded-lg p-4"
        />
      </div>

      {/* 약관 동의 */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">약관 동의</h3>
        <div 
          id="agreement" 
          ref={agreementRef}
          className="border border-gray-200 rounded-lg p-4"
        />
      </div>

      {/* 결제 버튼 */}
      <div className="pt-4">
        <Button
          onClick={handlePayment}
          disabled={!agreementStatus.agreedRequiredTerms || isProcessing}
          size="lg"
          className="w-full"
        >
          {isProcessing ? '결제 처리 중...' : `${amount.toLocaleString()}원 결제하기`}
        </Button>
        
        {!agreementStatus.agreedRequiredTerms && (
          <p className="mt-2 text-sm text-red-600 text-center">
            필수 약관에 동의해주세요.
          </p>
        )}
      </div>
    </div>
  )
}

export default PaymentWidget