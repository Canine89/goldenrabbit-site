'use server'

import { revalidatePath } from 'next/cache'
import { 
  BookCreateSchema, 
  BookUpdateSchema, 
  BookStatusSchema,
  IdSchema 
} from './schemas'
import { 
  createServerSupabaseClient,
  checkAdminPermission,
  createSuccessResponse,
  createErrorResponse,
  sanitizeFormData,
  logError
} from './utils'
import { ActionResult, Book } from './types'

// 도서 생성
export async function createBook(formData: FormData): Promise<ActionResult<Book>> {
  try {
    // 관리자 권한 확인
    const isAdmin = await checkAdminPermission()
    if (!isAdmin) {
      return createErrorResponse('관리자 권한이 필요합니다')
    }

    // FormData를 객체로 변환
    const rawData = Object.fromEntries(formData.entries())
    
    // 숫자 필드 변환
    const processedData = {
      ...rawData,
      price: rawData.price ? parseInt(rawData.price as string) : 0,
      page_count: rawData.page_count ? parseInt(rawData.page_count as string) : 0,
      is_featured: rawData.is_featured === 'true',
      is_active: rawData.is_active === 'true'
    }

    // 데이터 검증
    const validatedData = BookCreateSchema.parse(processedData)
    
    // 데이터 정리
    const cleanData = sanitizeFormData(validatedData)

    // Supabase에 데이터 저장
    const supabase = await await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('books')
      .insert([cleanData])
      .select()
      .single()

    if (error) {
      logError('createBook', error)
      return createErrorResponse('도서 생성에 실패했습니다', error.message)
    }

    // 관련 페이지 재검증
    revalidatePath('/admin/books')
    revalidatePath('/books')
    revalidatePath('/')

    return createSuccessResponse(data as Book, '도서가 성공적으로 생성되었습니다')

  } catch (error) {
    logError('createBook', error)
    if (error instanceof Error && error.name === 'ZodError') {
      return createErrorResponse('입력 데이터가 올바르지 않습니다', error.message)
    }
    return createErrorResponse('도서 생성 중 오류가 발생했습니다')
  }
}

// 도서 수정
export async function updateBook(formData: FormData): Promise<ActionResult<Book>> {
  try {
    // 관리자 권한 확인
    const isAdmin = await checkAdminPermission()
    if (!isAdmin) {
      return createErrorResponse('관리자 권한이 필요합니다')
    }

    // FormData를 객체로 변환
    const rawData = Object.fromEntries(formData.entries())
    
    // 숫자 필드 변환
    const processedData = {
      ...rawData,
      price: rawData.price ? parseInt(rawData.price as string) : undefined,
      page_count: rawData.page_count ? parseInt(rawData.page_count as string) : undefined,
      is_featured: rawData.is_featured === 'true',
      is_active: rawData.is_active === 'true'
    }

    // 데이터 검증
    const validatedData = BookUpdateSchema.parse(processedData)
    const { id, ...updateData } = validatedData
    
    // 데이터 정리
    const cleanData = sanitizeFormData(updateData)

    // Supabase에서 데이터 업데이트
    const supabase = await await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('books')
      .update(cleanData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      logError('updateBook', error)
      return createErrorResponse('도서 수정에 실패했습니다', error.message)
    }

    // 관련 페이지 재검증
    revalidatePath('/admin/books')
    revalidatePath('/books')
    revalidatePath(`/books/${id}`)
    revalidatePath('/')

    return createSuccessResponse(data as Book, '도서가 성공적으로 수정되었습니다')

  } catch (error) {
    logError('updateBook', error)
    if (error instanceof Error && error.name === 'ZodError') {
      return createErrorResponse('입력 데이터가 올바르지 않습니다', error.message)
    }
    return createErrorResponse('도서 수정 중 오류가 발생했습니다')
  }
}

// 도서 삭제
export async function deleteBook(bookId: string): Promise<ActionResult<void>> {
  try {
    // 관리자 권한 확인
    const isAdmin = await checkAdminPermission()
    if (!isAdmin) {
      return createErrorResponse('관리자 권한이 필요합니다')
    }

    // 데이터 검증
    const validatedData = IdSchema.parse({ id: bookId })

    // Supabase에서 데이터 삭제
    const supabase = await createServerSupabaseClient()
    const { error } = await supabase
      .from('books')
      .delete()
      .eq('id', validatedData.id)

    if (error) {
      logError('deleteBook', error)
      return createErrorResponse('도서 삭제에 실패했습니다', error.message)
    }

    // 관련 페이지 재검증
    revalidatePath('/admin/books')
    revalidatePath('/books')
    revalidatePath('/')

    return createSuccessResponse(undefined, '도서가 성공적으로 삭제되었습니다')

  } catch (error) {
    logError('deleteBook', error)
    return createErrorResponse('도서 삭제 중 오류가 발생했습니다')
  }
}

// 도서 활성화/비활성화 상태 변경
export async function toggleBookStatus(bookId: string, isActive: boolean): Promise<ActionResult<Book>> {
  try {
    // 관리자 권한 확인
    const isAdmin = await checkAdminPermission()
    if (!isAdmin) {
      return createErrorResponse('관리자 권한이 필요합니다')
    }

    // 데이터 검증
    const validatedData = BookStatusSchema.parse({ id: bookId, is_active: isActive })

    // Supabase에서 상태 업데이트
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('books')
      .update({ is_active: validatedData.is_active })
      .eq('id', validatedData.id)
      .select()
      .single()

    if (error) {
      logError('toggleBookStatus', error)
      return createErrorResponse('도서 상태 변경에 실패했습니다', error.message)
    }

    // 관련 페이지 재검증
    revalidatePath('/admin/books')
    revalidatePath('/books')
    revalidatePath(`/books/${bookId}`)
    revalidatePath('/')

    const statusText = isActive ? '활성화' : '비활성화'
    return createSuccessResponse(data as Book, `도서가 성공적으로 ${statusText}되었습니다`)

  } catch (error) {
    logError('toggleBookStatus', error)
    return createErrorResponse('도서 상태 변경 중 오류가 발생했습니다')
  }
}

// 도서 목록 조회 (관리자용)
export async function getAdminBooks(page: number = 1, limit: number = 10, search?: string) {
  try {
    // 관리자 권한 확인
    const isAdmin = await checkAdminPermission()
    if (!isAdmin) {
      return createErrorResponse('관리자 권한이 필요합니다')
    }

    const supabase = await createServerSupabaseClient()
    const offset = (page - 1) * limit

    let query = supabase
      .from('books')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // 검색 조건 추가
    if (search && search.trim()) {
      query = query.or(`title.ilike.%${search}%,author.ilike.%${search}%`)
    }

    const { data, error, count } = await query

    if (error) {
      logError('getAdminBooks', error)
      return createErrorResponse('도서 목록 조회에 실패했습니다', error.message)
    }

    return createSuccessResponse({
      books: data as Book[],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    })

  } catch (error) {
    logError('getAdminBooks', error)
    return createErrorResponse('도서 목록 조회 중 오류가 발생했습니다')
  }
}

// 단일 도서 조회
export async function getBook(bookId: string): Promise<ActionResult<Book>> {
  try {
    const validatedData = IdSchema.parse({ id: bookId })

    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .eq('id', validatedData.id)
      .eq('is_active', true)
      .single()

    if (error) {
      logError('getBook', error)
      return createErrorResponse('도서 조회에 실패했습니다', error.message)
    }

    if (!data) {
      return createErrorResponse('해당 도서를 찾을 수 없습니다')
    }

    return createSuccessResponse(data as Book)

  } catch (error) {
    logError('getBook', error)
    return createErrorResponse('도서 조회 중 오류가 발생했습니다')
  }
}