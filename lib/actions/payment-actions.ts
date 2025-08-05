'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { 
  createServerSupabaseClient,
  createSuccessResponse,
  createErrorResponse,
  logError
} from './utils'
import { ActionResult } from './types'

// 🔒 보안 유틸리티: 타임아웃 및 재시도가 적용된 fetch 함수
async function fetchWithRetry(
  url: string, 
  options: RequestInit, 
  maxRetries: number = 3,
  timeoutMs: number = 30000
): Promise<Response> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      // 성공적인 응답이면 바로 반환
      if (response.ok) {
        return response
      }
      
      // 4xx 오류는 재시도하지 않음 (클라이언트 오류)
      if (response.status >= 400 && response.status < 500) {
        return response
      }
      
      // 5xx 오류나 네트워크 오류는 재시도
      if (attempt === maxRetries) {
        return response
      }
      
      // Exponential backoff 적용
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000)
      await new Promise(resolve => setTimeout(resolve, delay))
      
    } catch (error: any) {
      // AbortError (타임아웃) 또는 네트워크 오류
      if (attempt === maxRetries) {
        throw new Error(`API 호출 실패 (${maxRetries}번 재시도): ${error.message}`)
      }
      
      // Exponential backoff 적용
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw new Error(`최대 재시도 횟수(${maxRetries})를 초과했습니다`)
}

// 결제 승인 요청 스키마
const PaymentConfirmSchema = z.object({
  paymentKey: z.string().min(1, '결제 키가 필요합니다'),
  orderId: z.string().min(1, '주문 ID가 필요합니다'),
  amount: z.number().positive('결제 금액은 양수여야 합니다'),
})

export type PaymentConfirmData = z.infer<typeof PaymentConfirmSchema>

interface TossPaymentsResponse {
  paymentKey: string
  orderId: string
  status: string
  totalAmount: number
  method: string
  orderName: string
  approvedAt: string
  receipt?: {
    url: string
  }
  card?: {
    company: string
    number: string
    installmentPlanMonths: number
    isInterestFree: boolean
    approveNo: string
  }
  virtualAccount?: {
    accountType: string
    accountNumber: string
    bankCode: string
    customerName: string
    dueDate: string
    refundStatus: string
    expired: boolean
    settlementStatus: string
  }
  transfer?: {
    bankCode: string
    settlementStatus: string
  }
  mobilePhone?: {
    customerMobilePhone: string
    settlementStatus: string
    receiptUrl: string
  }
  giftCertificate?: {
    approveNo: string
    settlementStatus: string
  }
  cashReceipt?: {
    type: string
    receiptKey: string
    issueNumber: string
    receiptUrl: string
    amount: number
    taxFreeAmount: number
  }
  discount?: {
    amount: number
  }
}

/**
 * 토스페이먼츠 결제 승인 처리
 */
export async function confirmPayment(formData: FormData): Promise<ActionResult<TossPaymentsResponse>> {
  try {
    // 데이터 변환 및 검증
    const rawData = {
      paymentKey: formData.get('paymentKey') as string,
      orderId: formData.get('orderId') as string,
      amount: parseInt(formData.get('amount') as string),
    }
    
    const validatedData = PaymentConfirmSchema.parse(rawData)
    
    const supabase = await createServerSupabaseClient()
    
    // 🔒 보안 검증 1: 주문 존재 및 금액 검증
    const { data: existingOrder, error: orderFetchError } = await supabase
      .from('orders')
      .select('id, total_amount, status, payment_key')
      .eq('order_number', validatedData.orderId)
      .single()
    
    if (orderFetchError || !existingOrder) {
      logError('confirmPayment - 주문 조회 실패', orderFetchError)
      return createErrorResponse('유효하지 않은 주문번호입니다')
    }
    
    // 🔒 보안 검증 2: 금액 무결성 확인
    if (existingOrder.total_amount !== validatedData.amount) {
      logError('confirmPayment - 금액 불일치', {
        orderAmount: existingOrder.total_amount,
        requestAmount: validatedData.amount,
        orderId: validatedData.orderId
      })
      return createErrorResponse('결제 금액이 주문 금액과 일치하지 않습니다')
    }
    
    // 🔒 보안 검증 3: 중복 결제 방지
    if (existingOrder.status === 'confirmed' && existingOrder.payment_key) {
      logError('confirmPayment - 중복 결제 시도', {
        orderId: validatedData.orderId,
        existingPaymentKey: existingOrder.payment_key,
        newPaymentKey: validatedData.paymentKey
      })
      return createErrorResponse('이미 승인된 주문입니다')
    }
    
    // 🔒 보안 검증 4: 주문 상태 확인
    if (existingOrder.status !== 'pending') {
      logError('confirmPayment - 잘못된 주문 상태', {
        orderId: validatedData.orderId,
        currentStatus: existingOrder.status
      })
      return createErrorResponse('결제 승인이 불가능한 주문 상태입니다')
    }

    // 토스페이먼츠 결제 승인 API 호출
    const secretKey = process.env.TOSS_SECRET_KEY
    if (!secretKey) {
      return createErrorResponse('토스페이먼츠 시크릿 키가 설정되지 않았습니다')
    }

    // 🔒 보안 강화: 타임아웃 및 재시도 로직이 적용된 API 호출
    const response = await fetchWithRetry('https://api.tosspayments.com/v1/payments/confirm', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(secretKey + ':').toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        paymentKey: validatedData.paymentKey,
        orderId: validatedData.orderId,
        amount: validatedData.amount,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      logError('confirmPayment - 토스페이먼츠 API 오류', errorData)
      return createErrorResponse(`결제 승인 실패: ${errorData.message || '알 수 없는 오류'}`)
    }

    const paymentData: TossPaymentsResponse = await response.json()
    
    // 🔒 보안 검증 5: 결제 상태 재검증
    if (paymentData.status !== 'DONE') {
      logError('confirmPayment - 잘못된 결제 상태', {
        paymentKey: validatedData.paymentKey,
        status: paymentData.status,
        orderId: validatedData.orderId
      })
      return createErrorResponse(`결제 상태가 올바르지 않습니다: ${paymentData.status}`)
    }
    
    // 🔒 보안 검증 6: 응답 데이터 무결성 확인
    if (paymentData.totalAmount !== validatedData.amount) {
      logError('confirmPayment - 응답 금액 불일치', {
        requestAmount: validatedData.amount,
        responseAmount: paymentData.totalAmount,
        orderId: validatedData.orderId
      })
      return createErrorResponse('결제 승인 응답의 금액이 일치하지 않습니다')
    }
    
    if (paymentData.orderId !== validatedData.orderId) {
      logError('confirmPayment - 응답 주문번호 불일치', {
        requestOrderId: validatedData.orderId,
        responseOrderId: paymentData.orderId
      })
      return createErrorResponse('결제 승인 응답의 주문번호가 일치하지 않습니다')
    }
    
    // 🔒 보안 강화: 원자적 트랜잭션으로 주문 상태 업데이트
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .update({
        status: 'confirmed',
        payment_key: paymentData.paymentKey,
        payment_method: paymentData.method,
        payment_approved_at: paymentData.approvedAt,
        updated_at: new Date().toISOString()
      })
      .eq('order_number', validatedData.orderId)
      .eq('status', 'pending')  // 🔒 추가 안전 장치: pending 상태일 때만 업데이트
      .select()
      .single()

    if (orderError) {
      logError('confirmPayment - 주문 상태 업데이트 실패', orderError)
      
      // 🚨 중요: 결제는 성공했지만 DB 업데이트 실패 시 복구 필요
      // 이 경우 수동 복구가 필요하므로 관리자에게 알림 필요
      return createErrorResponse(
        '결제는 완료되었으나 주문 처리에 실패했습니다. 고객센터로 문의해주세요.',
        `Payment Key: ${paymentData.paymentKey}`
      )
    }
    
    // 🔒 보안 검증 7: 업데이트된 주문 데이터 확인
    if (!orderData || orderData.id !== existingOrder.id) {
      logError('confirmPayment - 주문 업데이트 검증 실패', {
        existingOrderId: existingOrder.id,
        updatedOrderId: orderData?.id,
        orderId: validatedData.orderId
      })
      return createErrorResponse('주문 처리 검증에 실패했습니다')
    }

    // 🔒 보안 강화: 원자적 재고 차감 처리
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select('product_id, quantity')
      .eq('order_id', orderData.id)

    if (itemsError) {
      logError('confirmPayment - 주문 상품 조회 실패', itemsError)
      // 결제는 성공했으나 재고 처리 실패 - 관리자 알림 필요
    } else if (orderItems && orderItems.length > 0) {
      const stockUpdatePromises = orderItems.map(async (item) => {
        try {
          // 🔒 원자적 재고 차감 (race condition 방지)
          const { data: updatedProduct, error: stockError } = await supabase
            .rpc('decrement_stock', {
              product_id: item.product_id,
              quantity: item.quantity
            })
          
          if (stockError) {
            logError('confirmPayment - 재고 차감 실패', {
              productId: item.product_id,
              quantity: item.quantity,
              error: stockError
            })
          }
          
          return updatedProduct
        } catch (error) {
          logError('confirmPayment - 재고 처리 오류', {
            productId: item.product_id,
            error
          })
        }
      })
      
      // 모든 재고 업데이트 병렬 처리
      await Promise.allSettled(stockUpdatePromises)
    }

    // 캐시 재검증
    revalidatePath('/admin/products')
    revalidatePath('/rabbit-store')

    return createSuccessResponse(paymentData, '결제가 성공적으로 완료되었습니다')

  } catch (error: any) {
    if (error instanceof Error && error.name === 'ZodError') {
      return createErrorResponse(error.message)
    }
    
    logError('confirmPayment', error)
    return createErrorResponse('결제 승인 처리 중 오류가 발생했습니다')
  }
}

/**
 * 결제 정보 조회
 */
export async function getPaymentInfo(paymentKey: string): Promise<ActionResult<TossPaymentsResponse>> {
  try {
    const secretKey = process.env.TOSS_SECRET_KEY
    if (!secretKey) {
      return createErrorResponse('토스페이먼츠 시크릿 키가 설정되지 않았습니다')
    }

    const response = await fetchWithRetry(`https://api.tosspayments.com/v1/payments/${paymentKey}`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${Buffer.from(secretKey + ':').toString('base64')}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorData = await response.json()
      logError('getPaymentInfo - 토스페이먼츠 API 오류', errorData)
      return createErrorResponse(`결제 정보 조회 실패: ${errorData.message || '알 수 없는 오류'}`)
    }

    const paymentData: TossPaymentsResponse = await response.json()
    return createSuccessResponse(paymentData, '결제 정보를 성공적으로 조회했습니다')

  } catch (error: any) {
    logError('getPaymentInfo', error)
    return createErrorResponse('결제 정보 조회 중 오류가 발생했습니다')
  }
}

/**
 * 결제 취소
 */
export async function cancelPayment(
  paymentKey: string, 
  cancelReason: string, 
  cancelAmount?: number
): Promise<ActionResult<any>> {
  try {
    const secretKey = process.env.TOSS_SECRET_KEY
    if (!secretKey) {
      return createErrorResponse('토스페이먼츠 시크릿 키가 설정되지 않았습니다')
    }

    const requestBody: any = {
      cancelReason
    }
    
    if (cancelAmount) {
      requestBody.cancelAmount = cancelAmount
    }

    const response = await fetchWithRetry(`https://api.tosspayments.com/v1/payments/${paymentKey}/cancel`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(secretKey + ':').toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const errorData = await response.json()
      logError('cancelPayment - 토스페이먼츠 API 오류', errorData)
      return createErrorResponse(`결제 취소 실패: ${errorData.message || '알 수 없는 오류'}`)
    }

    const cancelData = await response.json()

    // 데이터베이스에서 주문 상태 업데이트
    const supabase = await createServerSupabaseClient()
    
    await supabase
      .from('orders')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('payment_key', paymentKey)

    // 캐시 재검증
    revalidatePath('/admin/products')
    
    return createSuccessResponse(cancelData, '결제가 성공적으로 취소되었습니다')

  } catch (error: any) {
    logError('cancelPayment', error)
    return createErrorResponse('결제 취소 처리 중 오류가 발생했습니다')
  }
}