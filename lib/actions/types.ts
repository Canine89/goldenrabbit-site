// Server Actions 공통 타입 정의

export type ActionResult<T = void> = {
  success: true
  data: T
  message?: string
} | {
  success: false
  error: string
  details?: string
}

// 데이터베이스 공통 타입들
export interface BaseEntity {
  id: string
  created_at: string
  updated_at?: string
}

// Book 관련 타입
export interface Book extends BaseEntity {
  title: string
  author: string
  category: string
  price: number
  description?: string
  publisher_review?: string
  testimonials?: string
  cover_image_url?: string
  isbn?: string
  page_count?: number
  publication_date?: string
  table_of_contents?: string
  author_bio?: string
  is_featured: boolean
  is_active: boolean
  size?: string
  yes24_link?: string
  kyobo_link?: string
  aladin_link?: string
  ridibooks_link?: string
  errata_link?: string
  error_report_link?: string
}

// Article 관련 타입
export interface Article extends BaseEntity {
  title: string
  content?: string
  summary?: string
  author?: string
  category: string
  featured_image_url?: string
  is_published: boolean
  view_count?: number
  excerpt?: string
  tags?: string[]
  is_featured: boolean
}

// User/Profile 관련 타입
export interface UserProfile extends BaseEntity {
  username?: string
  email?: string
  role: 'customer' | 'professor' | 'admin'
  is_active: boolean
  phone?: string
  university?: string
  department?: string
  course?: string
  professor_book_id?: string
  professor_message?: string
  professor_application_date?: string
  full_name?: string
}

// Professor Resource 관련 타입
export interface ProfessorResource extends BaseEntity {
  book_id: string
  resource_type: 'lecture_slides' | 'source_code' | 'book_info' | 'copyright'
  title: string
  description?: string
  file_url?: string
  download_count?: number
  is_active: boolean
}

// Application 관련 타입
export interface ProfessorApplication extends BaseEntity {
  name: string
  email: string
  phone: string
  university: string
  department: string
  position: string
  course: string
  book_id: string
  message?: string
  status: 'pending' | 'reviewing' | 'approved' | 'rejected'
  is_approved?: boolean
  approved_at?: string
  approved_by?: string
  user_id?: string
}

export interface AuthorApplication extends BaseEntity {
  name: string
  email: string
  phone: string
  book_title: string
  book_description: string
  author_bio?: string
  status: 'pending' | 'reviewing' | 'approved' | 'rejected'
}