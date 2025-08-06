import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

// 환경변수 검증 함수 (서버용)
function validateSupabaseEnvServer() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL 환경변수가 설정되지 않았습니다. ' +
      'Vercel 환경변수에서 확인해주세요.'
    )
  }

  if (!supabaseKey) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_ANON_KEY 환경변수가 설정되지 않았습니다. ' +
      'Vercel 환경변수에서 확인해주세요.'
    )
  }

  if (!supabaseUrl.startsWith('https://') || !supabaseUrl.includes('supabase.co')) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL 형식이 올바르지 않습니다. ' +
      'https://your-project-ref.supabase.co 형태여야 합니다.'
    )
  }

  return { supabaseUrl, supabaseKey }
}

// 서버 사이드 Supabase 클라이언트 (Server Components용)
export async function createSupabaseServerClient() {
  try {
    const { supabaseUrl, supabaseKey } = validateSupabaseEnvServer()
    const cookieStore = await cookies()

    return createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    })
  } catch (error) {
    console.error('서버 Supabase 클라이언트 생성 실패:', error)
    
    // 서버 환경에서는 에러를 다시 던져서 적절한 에러 페이지 표시
    throw new Error(
      '데이터베이스 연결에 실패했습니다. 관리자에게 문의해주세요.\n' +
      '원인: ' + (error instanceof Error ? error.message : '알 수 없는 오류')
    )
  }
}

// 서버 액션용 Supabase 클라이언트
export async function createSupabaseServerAction() {
  try {
    const { supabaseUrl, supabaseKey } = validateSupabaseEnvServer()
    const cookieStore = await cookies()

    return createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    })
  } catch (error) {
    console.error('서버 액션 Supabase 클라이언트 생성 실패:', error)
    
    // 서버 액션에서는 에러를 다시 던져서 클라이언트에 전달
    throw new Error(
      '데이터베이스 연결에 실패했습니다. 환경변수 설정을 확인해주세요.\n' +
      '원인: ' + (error instanceof Error ? error.message : '알 수 없는 오류')
    )
  }
}