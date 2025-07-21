import { createBrowserClient } from '@supabase/ssr'

// 클라이언트 사이드 Supabase 클라이언트
export function createSupabaseClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
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