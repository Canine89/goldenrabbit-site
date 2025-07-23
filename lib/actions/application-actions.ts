'use server'

import { revalidatePath } from 'next/cache'
import { 
  ProfessorApplicationSchema,
  AuthorApplicationSchema,
  IdSchema 
} from './schemas'
import { 
  createServerSupabaseClient,
  checkAdminPermission,
  checkAuthentication,
  createSuccessResponse,
  createErrorResponse,
  sanitizeFormData,
  logError
} from './utils'
import { ActionResult, ProfessorApplication, AuthorApplication } from './types'

// 교수 신청서 제출
export async function submitProfessorApplication(formData: FormData): Promise<ActionResult<ProfessorApplication>> {
  try {
    // FormData를 객체로 변환
    const rawData = Object.fromEntries(formData.entries())

    // 데이터 검증
    const validatedData = ProfessorApplicationSchema.parse(rawData)
    
    // 데이터 정리
    const cleanData = sanitizeFormData({
      ...validatedData,
      status: 'pending'
    })

    // Supabase에 데이터 저장
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('professor_applications')
      .insert([cleanData])
      .select()
      .single()

    if (error) {
      logError('submitProfessorApplication', error)
      return createErrorResponse('교수 신청서 제출에 실패했습니다', error.message)
    }

    // 관련 페이지 재검증
    revalidatePath('/professor')
    revalidatePath('/admin/applications')

    return createSuccessResponse(data as ProfessorApplication, '교수 신청서가 성공적으로 제출되었습니다')

  } catch (error) {
    logError('submitProfessorApplication', error)
    if (error instanceof Error && error.name === 'ZodError') {
      return createErrorResponse('입력 데이터가 올바르지 않습니다', error.message)
    }
    return createErrorResponse('교수 신청서 제출 중 오류가 발생했습니다')
  }
}

// 저자 신청서 제출
export async function submitAuthorApplication(formData: FormData): Promise<ActionResult<AuthorApplication>> {
  try {
    // FormData를 객체로 변환
    const rawData = Object.fromEntries(formData.entries())

    // 데이터 검증
    const validatedData = AuthorApplicationSchema.parse(rawData)
    
    // 데이터 정리
    const cleanData = sanitizeFormData({
      ...validatedData,
      status: 'pending'
    })

    // Supabase에 데이터 저장
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('author_applications')
      .insert([cleanData])
      .select()
      .single()

    if (error) {
      logError('submitAuthorApplication', error)
      return createErrorResponse('저자 신청서 제출에 실패했습니다', error.message)
    }

    // 관련 페이지 재검증
    revalidatePath('/author-apply')
    revalidatePath('/admin/applications')

    return createSuccessResponse(data as AuthorApplication, '저자 신청서가 성공적으로 제출되었습니다')

  } catch (error) {
    logError('submitAuthorApplication', error)
    if (error instanceof Error && error.name === 'ZodError') {
      return createErrorResponse('입력 데이터가 올바르지 않습니다', error.message)
    }
    return createErrorResponse('저자 신청서 제출 중 오류가 발생했습니다')
  }
}

// 교수 신청서 승인
export async function approveProfessorApplication(applicationId: string): Promise<ActionResult<ProfessorApplication>> {
  try {
    // 관리자 권한 확인
    const isAdmin = await checkAdminPermission()
    if (!isAdmin) {
      return createErrorResponse('관리자 권한이 필요합니다')
    }

    // 데이터 검증
    const validatedData = IdSchema.parse({ id: applicationId })

    const supabase = await createServerSupabaseClient()
    
    // 현재 시간
    const now = new Date().toISOString()
    
    // 신청서 승인 처리
    const { data, error } = await supabase
      .from('professor_applications')
      .update({ 
        status: 'approved',
        is_approved: true,
        approved_at: now
      })
      .eq('id', validatedData.id)
      .select()
      .single()

    if (error) {
      logError('approveProfessorApplication', error)
      return createErrorResponse('교수 신청서 승인에 실패했습니다', error.message)
    }

    // 해당 사용자의 역할을 교수로 변경 (user_id가 있는 경우)
    if (data.user_id) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ role: 'professor' })
        .eq('id', data.user_id)

      if (profileError) {
        logError('approveProfessorApplication - profile update', profileError)
        // 프로필 업데이트 실패해도 승인은 성공으로 처리
      }
    }

    // 관련 페이지 재검증
    revalidatePath('/admin/applications')
    revalidatePath('/admin/users')

    return createSuccessResponse(data as ProfessorApplication, '교수 신청서가 성공적으로 승인되었습니다')

  } catch (error) {
    logError('approveProfessorApplication', error)
    return createErrorResponse('교수 신청서 승인 중 오류가 발생했습니다')
  }
}

// 교수 신청서 거부
export async function rejectProfessorApplication(applicationId: string): Promise<ActionResult<ProfessorApplication>> {
  try {
    // 관리자 권한 확인
    const isAdmin = await checkAdminPermission()
    if (!isAdmin) {
      return createErrorResponse('관리자 권한이 필요합니다')
    }

    // 데이터 검증
    const validatedData = IdSchema.parse({ id: applicationId })

    const supabase = await createServerSupabaseClient()
    
    // 신청서 거부 처리
    const { data, error } = await supabase
      .from('professor_applications')
      .update({ 
        status: 'rejected',
        is_approved: false
      })
      .eq('id', validatedData.id)
      .select()
      .single()

    if (error) {
      logError('rejectProfessorApplication', error)
      return createErrorResponse('교수 신청서 거부에 실패했습니다', error.message)
    }

    // 관련 페이지 재검증
    revalidatePath('/admin/applications')

    return createSuccessResponse(data as ProfessorApplication, '교수 신청서가 거부되었습니다')

  } catch (error) {
    logError('rejectProfessorApplication', error)
    return createErrorResponse('교수 신청서 거부 중 오류가 발생했습니다')
  }
}

// 저자 신청서 상태 업데이트
export async function updateAuthorApplicationStatus(
  applicationId: string, 
  status: 'pending' | 'reviewing' | 'approved' | 'rejected'
): Promise<ActionResult<AuthorApplication>> {
  try {
    // 관리자 권한 확인
    const isAdmin = await checkAdminPermission()
    if (!isAdmin) {
      return createErrorResponse('관리자 권한이 필요합니다')
    }

    // 데이터 검증
    const validatedData = IdSchema.parse({ id: applicationId })

    const supabase = await createServerSupabaseClient()
    
    // 신청서 상태 업데이트
    const { data, error } = await supabase
      .from('author_applications')
      .update({ status })
      .eq('id', validatedData.id)
      .select()
      .single()

    if (error) {
      logError('updateAuthorApplicationStatus', error)
      return createErrorResponse('저자 신청서 상태 업데이트에 실패했습니다', error.message)
    }

    // 관련 페이지 재검증
    revalidatePath('/admin/applications')

    const statusNames = {
      pending: '대기중',
      reviewing: '검토중',
      approved: '승인됨',
      rejected: '거부됨'
    }

    return createSuccessResponse(data as AuthorApplication, `저자 신청서 상태가 ${statusNames[status]}로 변경되었습니다`)

  } catch (error) {
    logError('updateAuthorApplicationStatus', error)
    return createErrorResponse('저자 신청서 상태 업데이트 중 오류가 발생했습니다')
  }
}

// 교수 신청서 목록 조회 (관리자용)
export async function getAdminProfessorApplications(
  page: number = 1, 
  limit: number = 10, 
  search?: string,
  status?: string
) {
  try {
    // 관리자 권한 확인
    const isAdmin = await checkAdminPermission()
    if (!isAdmin) {
      return createErrorResponse('관리자 권한이 필요합니다')
    }

    const supabase = await createServerSupabaseClient()
    const offset = (page - 1) * limit

    let query = supabase
      .from('professor_applications')
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

    // 상태 필터 추가
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    // 검색 조건 추가
    if (search && search.trim()) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,university.ilike.%${search}%`)
    }

    const { data, error, count } = await query

    if (error) {
      logError('getAdminProfessorApplications', error)
      return createErrorResponse('교수 신청서 목록 조회에 실패했습니다', error.message)
    }

    return createSuccessResponse({
      applications: data as ProfessorApplication[],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    })

  } catch (error) {
    logError('getAdminProfessorApplications', error)
    return createErrorResponse('교수 신청서 목록 조회 중 오류가 발생했습니다')
  }
}

// 저자 신청서 목록 조회 (관리자용)
export async function getAdminAuthorApplications(
  page: number = 1, 
  limit: number = 10, 
  search?: string,
  status?: string
) {
  try {
    // 관리자 권한 확인
    const isAdmin = await checkAdminPermission()
    if (!isAdmin) {
      return createErrorResponse('관리자 권한이 필요합니다')
    }

    const supabase = await createServerSupabaseClient()
    const offset = (page - 1) * limit

    let query = supabase
      .from('author_applications')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // 상태 필터 추가
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    // 검색 조건 추가
    if (search && search.trim()) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,book_title.ilike.%${search}%`)
    }

    const { data, error, count } = await query

    if (error) {
      logError('getAdminAuthorApplications', error)
      return createErrorResponse('저자 신청서 목록 조회에 실패했습니다', error.message)
    }

    return createSuccessResponse({
      applications: data as AuthorApplication[],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    })

  } catch (error) {
    logError('getAdminAuthorApplications', error)
    return createErrorResponse('저자 신청서 목록 조회 중 오류가 발생했습니다')
  }
}

// 단일 교수 신청서 조회
export async function getProfessorApplication(applicationId: string): Promise<ActionResult<ProfessorApplication>> {
  try {
    const validatedData = IdSchema.parse({ id: applicationId })

    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('professor_applications')
      .select(`
        *,
        books:book_id (
          id,
          title,
          author
        )
      `)
      .eq('id', validatedData.id)
      .single()

    if (error) {
      logError('getProfessorApplication', error)
      return createErrorResponse('교수 신청서 조회에 실패했습니다', error.message)
    }

    if (!data) {
      return createErrorResponse('해당 교수 신청서를 찾을 수 없습니다')
    }

    return createSuccessResponse(data as ProfessorApplication)

  } catch (error) {
    logError('getProfessorApplication', error)
    return createErrorResponse('교수 신청서 조회 중 오류가 발생했습니다')
  }
}

// 단일 저자 신청서 조회
export async function getAuthorApplication(applicationId: string): Promise<ActionResult<AuthorApplication>> {
  try {
    const validatedData = IdSchema.parse({ id: applicationId })

    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('author_applications')
      .select('*')
      .eq('id', validatedData.id)
      .single()

    if (error) {
      logError('getAuthorApplication', error)
      return createErrorResponse('저자 신청서 조회에 실패했습니다', error.message)
    }

    if (!data) {
      return createErrorResponse('해당 저자 신청서를 찾을 수 없습니다')
    }

    return createSuccessResponse(data as AuthorApplication)

  } catch (error) {
    logError('getAuthorApplication', error)
    return createErrorResponse('저자 신청서 조회 중 오류가 발생했습니다')
  }
}