'use server'

import { revalidatePath } from 'next/cache'
import { 
  ProfessorResourceCreateSchema, 
  ProfessorResourceUpdateSchema, 
  ProfessorResourceStatusSchema,
  ResourceDownloadSchema,
  IdSchema 
} from './schemas'
import { 
  createServerSupabaseClient,
  checkAdminPermission,
  checkProfessorPermission,
  createSuccessResponse,
  createErrorResponse,
  sanitizeFormData,
  logError
} from './utils'
import { ActionResult, ProfessorResource } from './types'

// 교수 자료 생성
export async function createProfessorResource(formData: FormData): Promise<ActionResult<ProfessorResource>> {
  try {
    // 관리자 권한 확인
    const isAdmin = await checkAdminPermission()
    if (!isAdmin) {
      return createErrorResponse('관리자 권한이 필요합니다')
    }

    // FormData를 객체로 변환
    const rawData = Object.fromEntries(formData.entries())
    
    // 필드 타입 변환
    const processedData = {
      ...rawData,
      is_active: rawData.is_active === 'true'
    }

    // 데이터 검증
    const validatedData = ProfessorResourceCreateSchema.parse(processedData)
    
    // 데이터 정리
    const cleanData = sanitizeFormData(validatedData)

    // Supabase에 데이터 저장
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('professor_resources')
      .insert([cleanData])
      .select()
      .single()

    if (error) {
      logError('createProfessorResource', error)
      return createErrorResponse('교수 자료 생성에 실패했습니다', error.message)
    }

    // 관련 페이지 재검증
    revalidatePath('/admin/professor-resources')
    revalidatePath('/professor/resources')

    return createSuccessResponse(data as ProfessorResource, '교수 자료가 성공적으로 생성되었습니다')

  } catch (error) {
    logError('createProfessorResource', error)
    if (error instanceof Error && error.name === 'ZodError') {
      return createErrorResponse('입력 데이터가 올바르지 않습니다', error.message)
    }
    return createErrorResponse('교수 자료 생성 중 오류가 발생했습니다')
  }
}

// 교수 자료 수정
export async function updateProfessorResource(formData: FormData): Promise<ActionResult<ProfessorResource>> {
  try {
    // 관리자 권한 확인
    const isAdmin = await checkAdminPermission()
    if (!isAdmin) {
      return createErrorResponse('관리자 권한이 필요합니다')
    }

    // FormData를 객체로 변환
    const rawData = Object.fromEntries(formData.entries())
    
    // 필드 타입 변환
    const processedData = {
      ...rawData,
      is_active: rawData.is_active === 'true'
    }

    // 데이터 검증
    const validatedData = ProfessorResourceUpdateSchema.parse(processedData)
    const { id, ...updateData } = validatedData
    
    // 데이터 정리
    const cleanData = sanitizeFormData(updateData)

    // Supabase에서 데이터 업데이트
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('professor_resources')
      .update(cleanData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      logError('updateProfessorResource', error)
      return createErrorResponse('교수 자료 수정에 실패했습니다', error.message)
    }

    // 관련 페이지 재검증
    revalidatePath('/admin/professor-resources')
    revalidatePath('/professor/resources')

    return createSuccessResponse(data as ProfessorResource, '교수 자료가 성공적으로 수정되었습니다')

  } catch (error) {
    logError('updateProfessorResource', error)
    if (error instanceof Error && error.name === 'ZodError') {
      return createErrorResponse('입력 데이터가 올바르지 않습니다', error.message)
    }
    return createErrorResponse('교수 자료 수정 중 오류가 발생했습니다')
  }
}

// 교수 자료 삭제
export async function deleteProfessorResource(resourceId: string): Promise<ActionResult<void>> {
  try {
    // 관리자 권한 확인
    const isAdmin = await checkAdminPermission()
    if (!isAdmin) {
      return createErrorResponse('관리자 권한이 필요합니다')
    }

    // 데이터 검증
    const validatedData = IdSchema.parse({ id: resourceId })

    // Supabase에서 데이터 삭제
    const supabase = await createServerSupabaseClient()
    const { error } = await supabase
      .from('professor_resources')
      .delete()
      .eq('id', validatedData.id)

    if (error) {
      logError('deleteProfessorResource', error)
      return createErrorResponse('교수 자료 삭제에 실패했습니다', error.message)
    }

    // 관련 페이지 재검증
    revalidatePath('/admin/professor-resources')
    revalidatePath('/professor/resources')

    return createSuccessResponse(undefined, '교수 자료가 성공적으로 삭제되었습니다')

  } catch (error) {
    logError('deleteProfessorResource', error)
    return createErrorResponse('교수 자료 삭제 중 오류가 발생했습니다')
  }
}

// 교수 자료 활성화/비활성화 상태 변경
export async function toggleResourceStatus(resourceId: string, isActive: boolean): Promise<ActionResult<ProfessorResource>> {
  try {
    // 관리자 권한 확인
    const isAdmin = await checkAdminPermission()
    if (!isAdmin) {
      return createErrorResponse('관리자 권한이 필요합니다')
    }

    // 데이터 검증
    const validatedData = ProfessorResourceStatusSchema.parse({ id: resourceId, is_active: isActive })

    // Supabase에서 상태 업데이트
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('professor_resources')
      .update({ is_active: validatedData.is_active })
      .eq('id', validatedData.id)
      .select()
      .single()

    if (error) {
      logError('toggleResourceStatus', error)
      return createErrorResponse('교수 자료 상태 변경에 실패했습니다', error.message)
    }

    // 관련 페이지 재검증
    revalidatePath('/admin/professor-resources')
    revalidatePath('/professor/resources')

    const statusText = isActive ? '활성화' : '비활성화'
    return createSuccessResponse(data as ProfessorResource, `교수 자료가 성공적으로 ${statusText}되었습니다`)

  } catch (error) {
    logError('toggleResourceStatus', error)
    return createErrorResponse('교수 자료 상태 변경 중 오류가 발생했습니다')
  }
}

// 교수 자료 다운로드 수 증가
export async function incrementResourceDownloadCount(resourceId: string): Promise<ActionResult<void>> {
  try {
    // 교수 또는 관리자 권한 확인
    const hasProfessorPermission = await checkProfessorPermission()
    if (!hasProfessorPermission) {
      return createErrorResponse('교수 권한이 필요합니다')
    }

    // 데이터 검증
    const validatedData = ResourceDownloadSchema.parse({ id: resourceId })

    const supabase = await createServerSupabaseClient()
    
    // 현재 다운로드 수 가져오기
    const { data: currentData, error: fetchError } = await supabase
      .from('professor_resources')
      .select('download_count')
      .eq('id', validatedData.id)
      .single()

    if (fetchError) {
      logError('incrementResourceDownloadCount - fetch', fetchError)
      return createErrorResponse('다운로드 수 증가에 실패했습니다')
    }

    // 다운로드 수 증가
    const newDownloadCount = (currentData?.download_count || 0) + 1
    const { error: updateError } = await supabase
      .from('professor_resources')
      .update({ download_count: newDownloadCount })
      .eq('id', validatedData.id)

    if (updateError) {
      logError('incrementResourceDownloadCount - update', updateError)
      return createErrorResponse('다운로드 수 증가에 실패했습니다')
    }

    return createSuccessResponse(undefined)

  } catch (error) {
    logError('incrementResourceDownloadCount', error)
    return createErrorResponse('다운로드 수 증가 중 오류가 발생했습니다')
  }
}

// 교수 자료 목록 조회 (관리자용)
export async function getAdminResources(page: number = 1, limit: number = 10, search?: string, bookId?: string) {
  try {
    // 관리자 권한 확인
    const isAdmin = await checkAdminPermission()
    if (!isAdmin) {
      return createErrorResponse('관리자 권한이 필요합니다')
    }

    const supabase = await createServerSupabaseClient()
    const offset = (page - 1) * limit

    let query = supabase
      .from('professor_resources')
      .select(`
        *,
        books:book_id (
          id,
          title,
          author
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // 도서 필터 추가
    if (bookId) {
      query = query.eq('book_id', bookId)
    }

    // 검색 조건 추가
    if (search && search.trim()) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
    }

    const { data, error, count } = await query

    if (error) {
      logError('getAdminResources', error)
      return createErrorResponse('교수 자료 목록 조회에 실패했습니다', error.message)
    }

    return createSuccessResponse({
      resources: data as ProfessorResource[],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    })

  } catch (error) {
    logError('getAdminResources', error)
    return createErrorResponse('교수 자료 목록 조회 중 오류가 발생했습니다')
  }
}

// 교수 자료 목록 조회 (교수용)
export async function getProfessorResources(bookId?: string, resourceType?: string) {
  try {
    // 교수 또는 관리자 권한 확인
    const hasProfessorPermission = await checkProfessorPermission()
    if (!hasProfessorPermission) {
      return createErrorResponse('교수 권한이 필요합니다')
    }

    const supabase = await createServerSupabaseClient()

    let query = supabase
      .from('professor_resources')
      .select(`
        *,
        books:book_id (
          id,
          title,
          author
        )
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    // 도서 필터 추가
    if (bookId) {
      query = query.eq('book_id', bookId)
    }

    // 자료 유형 필터 추가
    if (resourceType) {
      query = query.eq('resource_type', resourceType)
    }

    const { data, error } = await query

    if (error) {
      logError('getProfessorResources', error)
      return createErrorResponse('교수 자료 목록 조회에 실패했습니다', error.message)
    }

    return createSuccessResponse(data as ProfessorResource[])

  } catch (error) {
    logError('getProfessorResources', error)
    return createErrorResponse('교수 자료 목록 조회 중 오류가 발생했습니다')
  }
}

// 단일 교수 자료 조회
export async function getProfessorResource(resourceId: string): Promise<ActionResult<ProfessorResource>> {
  try {
    const validatedData = IdSchema.parse({ id: resourceId })

    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('professor_resources')
      .select(`
        *,
        books:book_id (
          id,
          title,
          author
        )
      `)
      .eq('id', validatedData.id)
      .eq('is_active', true)
      .single()

    if (error) {
      logError('getProfessorResource', error)
      return createErrorResponse('교수 자료 조회에 실패했습니다', error.message)
    }

    if (!data) {
      return createErrorResponse('해당 교수 자료를 찾을 수 없습니다')
    }

    return createSuccessResponse(data as ProfessorResource)

  } catch (error) {
    logError('getProfessorResource', error)
    return createErrorResponse('교수 자료 조회 중 오류가 발생했습니다')
  }
}