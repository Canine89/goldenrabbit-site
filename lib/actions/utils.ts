import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { ActionResult } from './types'
import { User } from '@supabase/supabase-js'

// 서버 사이드 Supabase 클라이언트 생성
export const createServerSupabaseClient = async () => {
  const cookieStore = await cookies()
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // SSR에서 쿠키 설정이 실패할 수 있음
          }
        },
      },
    }
  )
}

// 현재 사용자 정보 가져오기
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      console.error('사용자 정보 조회 실패:', error)
      return null
    }
    
    return user
  } catch (error) {
    console.error('getCurrentUser 오류:', error)
    return null
  }
}

// 사용자 프로필 정보 가져오기
export const getUserProfile = async (userId: string) => {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (error) {
      console.error('프로필 조회 실패:', error)
      return null
    }
    
    return profile
  } catch (error) {
    console.error('getUserProfile 오류:', error)
    return null
  }
}

// 관리자 권한 확인
export const checkAdminPermission = async (): Promise<boolean> => {
  try {
    const user = await getCurrentUser()
    if (!user) return false
    
    const profile = await getUserProfile(user.id)
    return profile?.role === 'admin'
  } catch (error) {
    console.error('관리자 권한 확인 실패:', error)
    return false
  }
}

// 교수 권한 확인
export const checkProfessorPermission = async (): Promise<boolean> => {
  try {
    const user = await getCurrentUser()
    if (!user) return false
    
    const profile = await getUserProfile(user.id)
    return profile?.role === 'professor' || profile?.role === 'admin'
  } catch (error) {
    console.error('교수 권한 확인 실패:', error)
    return false
  }
}

// 사용자 인증 확인
export const checkAuthentication = async (): Promise<User | null> => {
  const user = await getCurrentUser()
  return user
}

// 성공 응답 생성
export const createSuccessResponse = <T>(data: T, message?: string): ActionResult<T> => ({
  success: true,
  data,
  message
})

// 에러 응답 생성
export const createErrorResponse = (error: string, details?: string): ActionResult<never> => ({
  success: false,
  error,
  details
})

// 입력 데이터 정리 (빈 문자열을 null로 변환)
export const sanitizeFormData = (data: Record<string, any>): Record<string, any> => {
  const sanitized: Record<string, any> = {}
  
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string' && value.trim() === '') {
      sanitized[key] = null
    } else if (typeof value === 'string') {
      sanitized[key] = value.trim()
    } else {
      sanitized[key] = value
    }
  }
  
  return sanitized
}

// 날짜 형식 검증
export const isValidDate = (dateString: string): boolean => {
  const date = new Date(dateString)
  return !isNaN(date.getTime())
}

// ISBN 형식 검증
export const isValidISBN = (isbn: string): boolean => {
  const cleanISBN = isbn.replace(/[-\s]/g, '')
  return /^\d{13}$/.test(cleanISBN) && (cleanISBN.startsWith('978') || cleanISBN.startsWith('979'))
}

// 에러 로깅
export const logError = (action: string, error: any, userId?: string) => {
  console.error(`[${action}] 오류 발생:`, {
    error: error instanceof Error ? error.message : error,
    userId,
    timestamp: new Date().toISOString()
  })
}