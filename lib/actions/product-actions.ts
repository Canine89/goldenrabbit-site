'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { 
  createServerSupabaseClient,
  checkAdminPermission,
  createSuccessResponse,
  createErrorResponse,
  sanitizeFormData,
  logError
} from './utils'
import { ActionResult } from './types'

// 상품 인터페이스
export interface Product {
  id: string
  name: string
  description?: string
  price: number
  image_url?: string
  category: string
  stock_quantity: number
  is_active: boolean
  is_featured?: boolean
  created_at: string
  updated_at?: string
}

// 상품 생성 스키마
const ProductCreateSchema = z.object({
  name: z.string().min(1, '상품명은 필수입니다').max(200, '상품명은 200자 이하여야 합니다'),
  description: z.string().optional().or(z.literal('')),
  price: z.number().int().min(100, '가격은 100원 이상이어야 합니다').max(10000000, '가격은 1,000만원 이하여야 합니다'),
  image_url: z.string().optional().or(z.literal('')),
  category: z.enum(['굿즈', '생활용품', '문구', '의류', '기타'], {
    message: '올바른 카테고리를 선택해주세요'
  }),
  stock_quantity: z.number().int().min(0, '재고는 0개 이상이어야 합니다').max(999999, '재고는 999,999개 이하여야 합니다'),
  is_active: z.boolean(),
  is_featured: z.boolean()
})

// 상품 수정 스키마
const ProductUpdateSchema = ProductCreateSchema.extend({
  id: z.string().uuid('올바른 ID 형식이 아닙니다')
})

// 상품 상태 변경 스키마
const ProductStatusSchema = z.object({
  id: z.string().uuid('올바른 ID 형식이 아닙니다'),
  is_active: z.boolean()
})

// 재고 수정 스키마
const StockUpdateSchema = z.object({
  id: z.string().uuid('올바른 ID 형식이 아닙니다'),
  stock_quantity: z.number().int().min(0, '재고는 0개 이상이어야 합니다').max(999999, '재고는 999,999개 이하여야 합니다')
})

// ID 검증 스키마
const IdSchema = z.object({
  id: z.string().uuid('올바른 ID 형식이 아닙니다')
})

export type ProductCreateData = z.infer<typeof ProductCreateSchema>
export type ProductUpdateData = z.infer<typeof ProductUpdateSchema>

/**
 * 상품 생성
 */
export async function createProduct(formData: FormData): Promise<ActionResult<Product>> {
  try {
    // 관리자 권한 확인
    const isAdmin = await checkAdminPermission()
    if (!isAdmin) {
      return createErrorResponse('관리자 권한이 필요합니다')
    }

    // FormData를 객체로 변환
    const rawData = Object.fromEntries(formData.entries())
    
    // 숫자 및 불린 필드 변환
    const processedData = {
      ...rawData,
      price: rawData.price ? parseInt(rawData.price as string) : 0,
      stock_quantity: rawData.stock_quantity ? parseInt(rawData.stock_quantity as string) : 0,
      is_active: rawData.is_active === 'true',
      is_featured: rawData.is_featured === 'true'
    }

    // 데이터 검증
    const validatedData = ProductCreateSchema.parse(processedData)
    
    // 데이터 정리
    const cleanData = sanitizeFormData(validatedData)

    // Supabase에 데이터 저장
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('rabbit_store_products')
      .insert([{
        ...cleanData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single()

    if (error) {
      logError('createProduct', error)
      return createErrorResponse('상품 생성에 실패했습니다', error.message)
    }

    // 관련 페이지 재검증
    revalidatePath('/admin/products')
    revalidatePath('/rabbit-store')

    return createSuccessResponse(data as Product, '상품이 성공적으로 생성되었습니다')

  } catch (error) {
    logError('createProduct', error)
    if (error instanceof Error && error.name === 'ZodError') {
      return createErrorResponse('입력 데이터가 올바르지 않습니다', error.message)
    }
    return createErrorResponse('상품 생성 중 오류가 발생했습니다')
  }
}

/**
 * 상품 수정
 */
export async function updateProduct(formData: FormData): Promise<ActionResult<Product>> {
  try {
    // 관리자 권한 확인
    const isAdmin = await checkAdminPermission()
    if (!isAdmin) {
      return createErrorResponse('관리자 권한이 필요합니다')
    }

    // FormData를 객체로 변환
    const rawData = Object.fromEntries(formData.entries())
    
    // 숫자 및 불린 필드 변환
    const processedData = {
      ...rawData,
      price: rawData.price ? parseInt(rawData.price as string) : undefined,
      stock_quantity: rawData.stock_quantity ? parseInt(rawData.stock_quantity as string) : undefined,
      is_active: rawData.is_active === 'true',
      is_featured: rawData.is_featured === 'true'
    }

    // 데이터 검증
    const validatedData = ProductUpdateSchema.parse(processedData)
    const { id, ...updateData } = validatedData
    
    // 데이터 정리
    const cleanData = sanitizeFormData(updateData)

    // Supabase에서 데이터 업데이트
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('rabbit_store_products')
      .update({
        ...cleanData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      logError('updateProduct', error)
      return createErrorResponse('상품 수정에 실패했습니다', error.message)
    }

    // 관련 페이지 재검증
    revalidatePath('/admin/products')
    revalidatePath('/rabbit-store')
    revalidatePath(`/rabbit-store/${id}`)

    return createSuccessResponse(data as Product, '상품이 성공적으로 수정되었습니다')

  } catch (error) {
    logError('updateProduct', error)
    if (error instanceof Error && error.name === 'ZodError') {
      return createErrorResponse('입력 데이터가 올바르지 않습니다', error.message)
    }
    return createErrorResponse('상품 수정 중 오류가 발생했습니다')
  }
}

/**
 * 상품 삭제
 */
export async function deleteProduct(productId: string): Promise<ActionResult<void>> {
  try {
    // 관리자 권한 확인
    const isAdmin = await checkAdminPermission()
    if (!isAdmin) {
      return createErrorResponse('관리자 권한이 필요합니다')
    }

    // 데이터 검증
    const validatedData = IdSchema.parse({ id: productId })

    // Supabase에서 데이터 삭제
    const supabase = await createServerSupabaseClient()
    const { error } = await supabase
      .from('rabbit_store_products')
      .delete()
      .eq('id', validatedData.id)

    if (error) {
      logError('deleteProduct', error)
      return createErrorResponse('상품 삭제에 실패했습니다', error.message)
    }

    // 관련 페이지 재검증
    revalidatePath('/admin/products')
    revalidatePath('/rabbit-store')

    return createSuccessResponse(undefined, '상품이 성공적으로 삭제되었습니다')

  } catch (error) {
    logError('deleteProduct', error)
    return createErrorResponse('상품 삭제 중 오류가 발생했습니다')
  }
}

/**
 * 상품 활성화/비활성화 상태 변경
 */
export async function toggleProductStatus(productId: string, isActive: boolean): Promise<ActionResult<Product>> {
  try {
    // 관리자 권한 확인
    const isAdmin = await checkAdminPermission()
    if (!isAdmin) {
      return createErrorResponse('관리자 권한이 필요합니다')
    }

    // 데이터 검증
    const validatedData = ProductStatusSchema.parse({ id: productId, is_active: isActive })

    // Supabase에서 상태 업데이트
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('rabbit_store_products')
      .update({ 
        is_active: validatedData.is_active,
        updated_at: new Date().toISOString()
      })
      .eq('id', validatedData.id)
      .select()
      .single()

    if (error) {
      logError('toggleProductStatus', error)
      return createErrorResponse('상품 상태 변경에 실패했습니다', error.message)
    }

    // 관련 페이지 재검증
    revalidatePath('/admin/products')
    revalidatePath('/rabbit-store')
    revalidatePath(`/rabbit-store/${productId}`)

    const statusText = isActive ? '활성화' : '비활성화'
    return createSuccessResponse(data as Product, `상품이 성공적으로 ${statusText}되었습니다`)

  } catch (error) {
    logError('toggleProductStatus', error)
    return createErrorResponse('상품 상태 변경 중 오류가 발생했습니다')
  }
}

/**
 * 재고 수량 업데이트
 */
export async function updateStock(productId: string, stockQuantity: number): Promise<ActionResult<Product>> {
  try {
    // 관리자 권한 확인
    const isAdmin = await checkAdminPermission()
    if (!isAdmin) {
      return createErrorResponse('관리자 권한이 필요합니다')
    }

    // 데이터 검증
    const validatedData = StockUpdateSchema.parse({ id: productId, stock_quantity: stockQuantity })

    // Supabase에서 재고 업데이트
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('rabbit_store_products')
      .update({ 
        stock_quantity: validatedData.stock_quantity,
        updated_at: new Date().toISOString()
      })
      .eq('id', validatedData.id)
      .select()
      .single()

    if (error) {
      logError('updateStock', error)
      return createErrorResponse('재고 수정에 실패했습니다', error.message)
    }

    // 관련 페이지 재검증
    revalidatePath('/admin/products')
    revalidatePath('/rabbit-store')

    return createSuccessResponse(data as Product, '재고가 성공적으로 수정되었습니다')

  } catch (error) {
    logError('updateStock', error)
    return createErrorResponse('재고 수정 중 오류가 발생했습니다')
  }
}

/**
 * 상품 목록 조회 (관리자용)
 */
export async function getAdminProducts(page: number = 1, limit: number = 20, search?: string, category?: string) {
  try {
    // 관리자 권한 확인
    const isAdmin = await checkAdminPermission()
    if (!isAdmin) {
      return createErrorResponse('관리자 권한이 필요합니다')
    }

    const supabase = await createServerSupabaseClient()
    const offset = (page - 1) * limit

    let query = supabase
      .from('rabbit_store_products')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // 검색 조건 추가
    if (search && search.trim()) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
    }

    // 카테고리 필터 추가
    if (category && category !== 'all') {
      query = query.eq('category', category)
    }

    const { data, error, count } = await query

    if (error) {
      logError('getAdminProducts', error)
      return createErrorResponse('상품 목록 조회에 실패했습니다', error.message)
    }

    return createSuccessResponse({
      products: data as Product[],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    })

  } catch (error) {
    logError('getAdminProducts', error)
    return createErrorResponse('상품 목록 조회 중 오류가 발생했습니다')
  }
}

/**
 * 단일 상품 조회
 */
export async function getProduct(productId: string): Promise<ActionResult<Product>> {
  try {
    const validatedData = IdSchema.parse({ id: productId })

    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('rabbit_store_products')
      .select('*')
      .eq('id', validatedData.id)
      .single()

    if (error) {
      logError('getProduct', error)
      return createErrorResponse('상품 조회에 실패했습니다', error.message)
    }

    if (!data) {
      return createErrorResponse('해당 상품을 찾을 수 없습니다')
    }

    return createSuccessResponse(data as Product)

  } catch (error) {
    logError('getProduct', error)
    return createErrorResponse('상품 조회 중 오류가 발생했습니다')
  }
}

/**
 * 추천 상품 토글
 */
export async function toggleFeaturedProduct(productId: string, isFeatured: boolean): Promise<ActionResult<Product>> {
  try {
    // 관리자 권한 확인
    const isAdmin = await checkAdminPermission()
    if (!isAdmin) {
      return createErrorResponse('관리자 권한이 필요합니다')
    }

    // 데이터 검증
    const validatedData = IdSchema.parse({ id: productId })

    // Supabase에서 추천 상태 업데이트
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('rabbit_store_products')
      .update({ 
        is_featured: isFeatured,
        updated_at: new Date().toISOString()
      })
      .eq('id', validatedData.id)
      .select()
      .single()

    if (error) {
      logError('toggleFeaturedProduct', error)
      return createErrorResponse('추천 상품 설정에 실패했습니다', error.message)
    }

    // 관련 페이지 재검증
    revalidatePath('/admin/products')
    revalidatePath('/rabbit-store')

    const statusText = isFeatured ? '추천 상품으로 설정' : '추천 상품에서 해제'
    return createSuccessResponse(data as Product, `${statusText}되었습니다`)

  } catch (error) {
    logError('toggleFeaturedProduct', error)
    return createErrorResponse('추천 상품 설정 중 오류가 발생했습니다')
  }
}