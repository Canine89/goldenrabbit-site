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

// 주문 생성 스키마
const CreateOrderSchema = z.object({
  orderId: z.string().min(1, '주문 ID가 필요합니다'),
  orderNumber: z.string().min(1, '주문번호가 필요합니다'),
  totalAmount: z.number().positive('총 금액은 양수여야 합니다'),
  customerName: z.string().min(1, '고객명이 필요합니다'),
  customerPhone: z.string().min(1, '연락처가 필요합니다'),
  customerEmail: z.string().email('올바른 이메일 형식이 아닙니다'),
  shippingAddress: z.string().min(1, '배송 주소가 필요합니다'),
  shippingPostcode: z.string().min(1, '우편번호가 필요합니다'),
  shippingNote: z.string().optional(),
  cartItems: z.array(z.object({
    id: z.string(),
    name: z.string(),
    price: z.number(),
    quantity: z.number(),
    image_url: z.string().optional(),
    category: z.string().optional(),
  })).min(1, '주문할 상품이 없습니다'),
})

export type CreateOrderData = z.infer<typeof CreateOrderSchema>

/**
 * 결제 전 주문 정보 저장
 */
export async function createPendingOrder(data: CreateOrderData): Promise<ActionResult<{ orderId: string }>> {
  try {
    const validatedData = CreateOrderSchema.parse(data)
    const supabase = await createServerSupabaseClient()

    // 사용자 정보 확인 (게스트 주문도 지원)
    const { data: { user } } = await supabase.auth.getUser()
    
    // 로그를 위한 사용자 정보 출력
    console.log('Current user:', user?.id || 'anonymous')

    // 주문 생성
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: user?.id || null,
        order_number: validatedData.orderNumber,
        total_amount: validatedData.totalAmount,
        status: 'pending', // 결제 대기 상태
        customer_name: validatedData.customerName,
        customer_phone: validatedData.customerPhone,
        customer_email: validatedData.customerEmail,
        shipping_address: validatedData.shippingAddress,
        shipping_postcode: validatedData.shippingPostcode,
        shipping_note: validatedData.shippingNote || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (orderError) {
      logError('createPendingOrder - 주문 생성 실패', orderError)
      return createErrorResponse('주문 생성에 실패했습니다')
    }

    // 주문 상품 저장
    const orderItems = validatedData.cartItems.map(item => ({
      order_id: orderData.id,
      product_id: item.id,
      quantity: item.quantity,
      price: item.price
    }))

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)

    if (itemsError) {
      logError('createPendingOrder - 주문 상품 저장 실패', itemsError)
      console.error('Order items error details:', {
        error: itemsError,
        orderData: orderData,
        orderItems: orderItems,
        userId: user?.id
      })
      // 주문 롤백
      await supabase.from('orders').delete().eq('id', orderData.id)
      return createErrorResponse(`주문 상품 저장에 실패했습니다: ${itemsError.message}`)
    }

    return createSuccessResponse(
      { orderId: orderData.id },
      '주문 정보가 저장되었습니다'
    )

  } catch (error: any) {
    if (error instanceof Error && error.name === 'ZodError') {
      return createErrorResponse(error.message)
    }
    
    logError('createPendingOrder', error)
    return createErrorResponse('주문 생성 중 오류가 발생했습니다')
  }
}

/**
 * 주문 상태 업데이트
 */
export async function updateOrderStatus(
  orderNumber: string, 
  status: string, 
  paymentData?: any
): Promise<ActionResult<void>> {
  try {
    const supabase = await createServerSupabaseClient()

    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    }

    if (paymentData) {
      updateData.payment_key = paymentData.paymentKey
      updateData.payment_method = paymentData.method
      updateData.payment_approved_at = paymentData.approvedAt
    }

    const { error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('order_number', orderNumber)

    if (error) {
      logError('updateOrderStatus', error)
      return createErrorResponse('주문 상태 업데이트에 실패했습니다')
    }

    revalidatePath('/admin/orders')
    return createSuccessResponse(undefined, '주문 상태가 업데이트되었습니다')

  } catch (error: any) {
    logError('updateOrderStatus', error)
    return createErrorResponse('주문 상태 업데이트 중 오류가 발생했습니다')
  }
}