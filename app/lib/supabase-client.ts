import { createBrowserClient } from '@supabase/ssr'

// 환경변수 검증 함수
function validateSupabaseEnv() {
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

// 클라이언트 사이드 Supabase 클라이언트
export function createSupabaseClient() {
  try {
    const { supabaseUrl, supabaseKey } = validateSupabaseEnv()
    
    return createBrowserClient(supabaseUrl, supabaseKey)
  } catch (error) {
    console.error('Supabase 클라이언트 생성 실패:', error)
    
    // 개발 환경에서는 에러를 던지고, 프로덕션에서는 기본 클라이언트 반환
    if (process.env.NODE_ENV === 'development') {
      throw error
    }
    
    // 프로덕션에서는 에러 로깅 후 fallback 처리
    console.warn('프로덕션 환경에서 Supabase 연결 실패, fallback 처리됩니다.')
    
    // 최소한의 mock 클라이언트 반환 (실제 데이터베이스 작업은 실패하지만 앱 크래시 방지)
    return {
      from: () => ({
        select: () => ({ data: [], error: new Error('Supabase 연결 실패') }),
        insert: () => ({ data: null, error: new Error('Supabase 연결 실패') }),
        update: () => ({ data: null, error: new Error('Supabase 연결 실패') }),
        delete: () => ({ data: null, error: new Error('Supabase 연결 실패') }),
        upsert: () => ({ data: null, error: new Error('Supabase 연결 실패') })
      }),
      auth: {
        getUser: () => Promise.resolve({ data: { user: null }, error: new Error('Supabase 연결 실패') }),
        signInWithOAuth: () => Promise.resolve({ data: null, error: new Error('Supabase 연결 실패') }),
        signOut: () => Promise.resolve({ error: new Error('Supabase 연결 실패') })
      }
    } as any
  }
}

// 타입 정의
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          username: string | null
          role: 'admin' | 'customer'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          username?: string | null
          role?: 'admin' | 'customer'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          username?: string | null
          role?: 'admin' | 'customer'
          created_at?: string
          updated_at?: string
        }
      }
      books: {
        Row: {
          id: string
          title: string
          author: string | null
          description: string | null
          price: number | null
          cover_image_url: string | null
          category: string | null
          is_active: boolean
          is_featured: boolean
          created_at: string
        }
      }
      articles: {
        Row: {
          id: string
          title: string
          content: string | null
          excerpt: string | null
          featured_image_url: string | null
          is_published: boolean
          is_featured: boolean
          created_at: string
        }
      }
    }
  }
}