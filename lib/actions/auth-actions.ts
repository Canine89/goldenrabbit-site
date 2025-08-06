'use server'

import { 
  createServerSupabaseClient,
  createSuccessResponse,
  createErrorResponse,
  logError
} from './utils'
import { ActionResult } from './types'

// 골든래빗 도메인 체크 함수 (Server Action이므로 async 필수)
export async function checkGoldenRabbitDomain(email: string): Promise<boolean> {
  if (!email) return false
  return email.toLowerCase().endsWith('@goldenrabbit.co.kr')
}

// 사용자 역할 업데이트 함수
export async function updateUserRole(
  userId: string, 
  email: string, 
  newRole: 'admin' | 'professor' | 'customer'
): Promise<ActionResult<any>> {
  try {
    // 입력 값 검증
    if (!userId || !email || !newRole) {
      return createErrorResponse('필수 정보가 누락되었습니다')
    }

    // UUID 형식 검증
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(userId)) {
      return createErrorResponse('잘못된 사용자 ID 형식입니다')
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return createErrorResponse('잘못된 이메일 형식입니다')
    }

    // 역할 유효성 검증
    const validRoles = ['admin', 'professor', 'customer']
    if (!validRoles.includes(newRole)) {
      return createErrorResponse('유효하지 않은 역할입니다')
    }

    const supabase = await createServerSupabaseClient()

    // 사용자 프로필 존재 확인
    const { data: existingProfile, error: checkError } = await supabase
      .from('profiles')
      .select('id, email, role')
      .eq('id', userId)
      .single()

    if (checkError) {
      // 프로필이 존재하지 않으면 생성
      if (checkError.code === 'PGRST116') {
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert([
            {
              id: userId,
              email: email,
              role: newRole,
              is_active: true
            }
          ])
          .select()
          .single()

        if (createError) {
          logError('updateUserRole - create profile', createError)
          return createErrorResponse('사용자 프로필 생성에 실패했습니다', createError.message)
        }

        return createSuccessResponse(newProfile, `사용자 프로필을 생성하고 ${newRole} 역할을 부여했습니다`)
      }

      logError('updateUserRole - check profile', checkError)
      return createErrorResponse('사용자 프로필 조회에 실패했습니다', checkError.message)
    }

    // 이미 같은 역할이면 업데이트 불필요
    if (existingProfile.role === newRole) {
      return createSuccessResponse(existingProfile, '이미 해당 역할로 설정되어 있습니다')
    }

    // 역할 업데이트
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({ 
        role: newRole,
        email: email, // 이메일도 업데이트 (혹시 변경된 경우)
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single()

    if (updateError) {
      logError('updateUserRole - update profile', updateError)
      return createErrorResponse('사용자 역할 업데이트에 실패했습니다', updateError.message)
    }

    const roleNames = {
      admin: '관리자',
      professor: '교수',
      customer: '일반 사용자'
    }

    return createSuccessResponse(updatedProfile, `사용자 역할이 ${roleNames[newRole]}로 변경되었습니다`)

  } catch (error: any) {
    logError('updateUserRole', error)
    return createErrorResponse(`사용자 역할 업데이트 중 오류가 발생했습니다: ${error.message}`)
  }
}

// 골든래빗 도메인 사용자 자동 관리자 권한 부여
export async function grantAdminRoleForGoldenRabbitDomain(
  userId: string, 
  email: string
): Promise<ActionResult<any>> {
  try {
    // 골든래빗 도메인인지 확인
    if (!(await checkGoldenRabbitDomain(email))) {
      return createErrorResponse('골든래빗 도메인이 아닙니다')
    }

    // 자동으로 관리자 역할 부여
    const result = await updateUserRole(userId, email, 'admin')
    
    if (result.success) {
      console.log(`골든래빗 직원 자동 관리자 권한 부여: ${email}`)
    }

    return result

  } catch (error: any) {
    logError('grantAdminRoleForGoldenRabbitDomain', error)
    return createErrorResponse(`골든래빗 도메인 관리자 권한 부여 중 오류가 발생했습니다: ${error.message}`)
  }
}

// 사용자 프로필 조회 (권한 체크용)
export async function getUserProfile(userId: string): Promise<ActionResult<any>> {
  try {
    if (!userId) {
      return createErrorResponse('사용자 ID가 필요합니다')
    }

    const supabase = await createServerSupabaseClient()
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return createErrorResponse('사용자 프로필을 찾을 수 없습니다')
      }
      logError('getUserProfile', error)
      return createErrorResponse('사용자 프로필 조회에 실패했습니다', error.message)
    }

    return createSuccessResponse(profile)

  } catch (error: any) {
    logError('getUserProfile', error)
    return createErrorResponse(`사용자 프로필 조회 중 오류가 발생했습니다: ${error.message}`)
  }
}