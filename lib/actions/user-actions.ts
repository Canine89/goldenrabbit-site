'use server'

import { revalidatePath } from 'next/cache'
import { 
  UserRoleUpdateSchema, 
  UserStatusUpdateSchema,
  IdSchema 
} from './schemas'
import { 
  createServerSupabaseClient,
  checkAdminPermission,
  createSuccessResponse,
  createErrorResponse,
  logError
} from './utils'
import { ActionResult, UserProfile } from './types'

// 사용자 역할 변경
export async function updateUserRole(userId: string, newRole: 'customer' | 'professor' | 'admin'): Promise<ActionResult<UserProfile>> {
  try {
    // 관리자 권한 확인
    const isAdmin = await checkAdminPermission()
    if (!isAdmin) {
      return createErrorResponse('관리자 권한이 필요합니다')
    }

    // 데이터 검증
    const validatedData = UserRoleUpdateSchema.parse({ id: userId, role: newRole })

    // Supabase에서 역할 업데이트
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('profiles')
      .update({ role: validatedData.role })
      .eq('id', validatedData.id)
      .select()
      .single()

    if (error) {
      logError('updateUserRole', error, userId)
      return createErrorResponse('사용자 역할 변경에 실패했습니다', error.message)
    }

    // 관련 페이지 재검증
    revalidatePath('/admin/users')

    const roleNames = {
      customer: '일반 사용자',
      professor: '교수',
      admin: '관리자'
    }

    return createSuccessResponse(data as UserProfile, `사용자 역할이 ${roleNames[newRole]}로 변경되었습니다`)

  } catch (error) {
    logError('updateUserRole', error, userId)
    if (error instanceof Error && error.name === 'ZodError') {
      return createErrorResponse('입력 데이터가 올바르지 않습니다', error.message)
    }
    return createErrorResponse('사용자 역할 변경 중 오류가 발생했습니다')
  }
}

// 사용자 활성화/비활성화 상태 변경
export async function toggleUserStatus(userId: string, isActive: boolean): Promise<ActionResult<UserProfile>> {
  try {
    // 관리자 권한 확인
    const isAdmin = await checkAdminPermission()
    if (!isAdmin) {
      return createErrorResponse('관리자 권한이 필요합니다')
    }

    // 데이터 검증
    const validatedData = UserStatusUpdateSchema.parse({ id: userId, is_active: isActive })

    // Supabase에서 상태 업데이트
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('profiles')
      .update({ is_active: validatedData.is_active })
      .eq('id', validatedData.id)
      .select()
      .single()

    if (error) {
      logError('toggleUserStatus', error, userId)
      return createErrorResponse('사용자 상태 변경에 실패했습니다', error.message)
    }

    // 관련 페이지 재검증
    revalidatePath('/admin/users')

    const statusText = isActive ? '활성화' : '비활성화'
    return createSuccessResponse(data as UserProfile, `사용자가 성공적으로 ${statusText}되었습니다`)

  } catch (error) {
    logError('toggleUserStatus', error, userId)
    return createErrorResponse('사용자 상태 변경 중 오류가 발생했습니다')
  }
}

// 사용자 목록 조회 (관리자용)
export async function getAdminUsers(page: number = 1, limit: number = 10, search?: string, role?: string) {
  try {
    // 관리자 권한 확인
    const isAdmin = await checkAdminPermission()
    if (!isAdmin) {
      return createErrorResponse('관리자 권한이 필요합니다')
    }

    const supabase = await createServerSupabaseClient()
    const offset = (page - 1) * limit

    let query = supabase
      .from('profiles')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // 역할 필터 추가
    if (role && role !== 'all') {
      query = query.eq('role', role)
    }

    // 검색 조건 추가
    if (search && search.trim()) {
      query = query.or(`username.ilike.%${search}%,email.ilike.%${search}%,full_name.ilike.%${search}%`)
    }

    const { data, error, count } = await query

    if (error) {
      logError('getAdminUsers', error)
      return createErrorResponse('사용자 목록 조회에 실패했습니다', error.message)
    }

    return createSuccessResponse({
      users: data as UserProfile[],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    })

  } catch (error) {
    logError('getAdminUsers', error)
    return createErrorResponse('사용자 목록 조회 중 오류가 발생했습니다')
  }
}

// 단일 사용자 조회
export async function getUser(userId: string): Promise<ActionResult<UserProfile>> {
  try {
    const validatedData = IdSchema.parse({ id: userId })

    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', validatedData.id)
      .single()

    if (error) {
      logError('getUser', error)
      return createErrorResponse('사용자 조회에 실패했습니다', error.message)
    }

    if (!data) {
      return createErrorResponse('해당 사용자를 찾을 수 없습니다')
    }

    return createSuccessResponse(data as UserProfile)

  } catch (error) {
    logError('getUser', error)
    return createErrorResponse('사용자 조회 중 오류가 발생했습니다')
  }
}

// 사용자 통계 조회 (관리자용)
export async function getUserStats() {
  try {
    // 관리자 권한 확인
    const isAdmin = await checkAdminPermission()
    if (!isAdmin) {
      return createErrorResponse('관리자 권한이 필요합니다')
    }

    const supabase = await createServerSupabaseClient()

    // 전체 사용자 수
    const { count: totalUsers, error: totalError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })

    if (totalError) {
      logError('getUserStats - total', totalError)
      return createErrorResponse('사용자 통계 조회에 실패했습니다')
    }

    // 역할별 사용자 수
    const { data: roleStats, error: roleError } = await supabase
      .from('profiles')
      .select('role, count(*)')
      .not('role', 'is', null)

    if (roleError) {
      logError('getUserStats - roles', roleError)
      return createErrorResponse('사용자 통계 조회에 실패했습니다')
    }

    // 활성 사용자 수
    const { count: activeUsers, error: activeError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    if (activeError) {
      logError('getUserStats - active', activeError)
      return createErrorResponse('사용자 통계 조회에 실패했습니다')
    }

    // 최근 가입자 (30일 이내)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const { count: recentUsers, error: recentError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', thirtyDaysAgo.toISOString())

    if (recentError) {
      logError('getUserStats - recent', recentError)
      return createErrorResponse('사용자 통계 조회에 실패했습니다')
    }

    return createSuccessResponse({
      totalUsers: totalUsers || 0,
      activeUsers: activeUsers || 0,
      recentUsers: recentUsers || 0,
      roleStats: roleStats || [],
      inactiveUsers: (totalUsers || 0) - (activeUsers || 0)
    })

  } catch (error) {
    logError('getUserStats', error)
    return createErrorResponse('사용자 통계 조회 중 오류가 발생했습니다')
  }
}

// 교수 프로필 업데이트
export async function updateProfessorProfile(formData: FormData): Promise<ActionResult<UserProfile>> {
  try {
    // 현재 사용자가 교수 또는 관리자인지 확인
    const isProfessorOrAdmin = await checkAdminPermission()
    // TODO: 교수 권한도 확인하도록 개선 필요
    
    if (!isProfessorOrAdmin) {
      return createErrorResponse('권한이 없습니다')
    }

    // FormData를 객체로 변환
    const rawData = Object.fromEntries(formData.entries())
    
    const updateData = {
      university: rawData.university as string,
      department: rawData.department as string,
      course: rawData.course as string,
      phone: rawData.phone as string,
      professor_book_id: rawData.professor_book_id as string,
      professor_message: rawData.professor_message as string,
      full_name: rawData.full_name as string
    }

    // 빈 문자열을 null로 변환
    const cleanData = Object.fromEntries(
      Object.entries(updateData).map(([key, value]) => [
        key, 
        typeof value === 'string' && value.trim() === '' ? null : value?.toString().trim()
      ])
    )

    const userId = rawData.id as string
    if (!userId) {
      return createErrorResponse('사용자 ID가 필요합니다')
    }

    // Supabase에서 프로필 업데이트
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('profiles')
      .update(cleanData)
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      logError('updateProfessorProfile', error, userId)
      return createErrorResponse('프로필 업데이트에 실패했습니다', error.message)
    }

    // 관련 페이지 재검증
    revalidatePath('/professor')
    revalidatePath('/admin/users')

    return createSuccessResponse(data as UserProfile, '프로필이 성공적으로 업데이트되었습니다')

  } catch (error) {
    logError('updateProfessorProfile', error)
    return createErrorResponse('프로필 업데이트 중 오류가 발생했습니다')
  }
}