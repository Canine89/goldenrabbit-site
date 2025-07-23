import { z } from 'zod'

// 공통 스키마
const nonEmptyString = z.string().min(1, '필수 입력 항목입니다').trim()
const optionalString = z.string().trim().optional().or(z.literal(''))
const positiveNumber = z.number().positive('양수여야 합니다')
const booleanField = z.boolean()

// Google Docs 스키마
export const GoogleDocsUrlSchema = z.object({
  url: nonEmptyString.refine((val) => {
    const googleDocsPattern = /https:\/\/docs\.google\.com\/document\/d\/([a-zA-Z0-9-_]+)/
    return googleDocsPattern.test(val)
  }, '올바른 구글 문서 URL이 아닙니다. (예: https://docs.google.com/document/d/...)')
})

// Book 스키마
export const BookCreateSchema = z.object({
  title: nonEmptyString.max(200, '제목은 200자 이하여야 합니다'),
  author: nonEmptyString.max(100, '저자명은 100자 이하여야 합니다'),
  category: z.enum(['경제경영', 'IT전문서', 'IT활용서', '학습만화', '좋은여름', '수상작품'], {
    message: '올바른 카테고리를 선택해주세요'
  }),
  price: z.number().int().min(1000, '가격은 1,000원 이상이어야 합니다').max(500000, '가격은 500,000원 이하여야 합니다'),
  description: optionalString,
  publisher_review: optionalString,
  testimonials: optionalString,
  cover_image_url: optionalString,
  isbn: optionalString.refine((val) => {
    if (!val) return true
    const cleanISBN = val.replace(/[-\s]/g, '')
    return /^\d{13}$/.test(cleanISBN) && (cleanISBN.startsWith('978') || cleanISBN.startsWith('979'))
  }, '올바른 ISBN 형식이 아닙니다 (13자리 숫자)'),
  page_count: z.number().int().min(1).max(5000).optional().or(z.literal(0)),
  publication_date: z.string().optional().refine((val) => {
    if (!val) return true
    return !isNaN(Date.parse(val))
  }, '올바른 날짜 형식이 아닙니다'),
  table_of_contents: optionalString,
  author_bio: optionalString,
  is_featured: booleanField.default(false),
  is_active: booleanField.default(true),
  size: optionalString,
  yes24_link: optionalString.refine((val) => {
    if (!val) return true
    try {
      new URL(val)
      return true
    } catch {
      return false
    }
  }, '올바른 URL 형식이 아닙니다'),
  kyobo_link: optionalString.refine((val) => {
    if (!val) return true
    try {
      new URL(val)
      return true
    } catch {
      return false
    }
  }, '올바른 URL 형식이 아닙니다'),
  aladin_link: optionalString.refine((val) => {
    if (!val) return true
    try {
      new URL(val)
      return true
    } catch {
      return false
    }
  }, '올바른 URL 형식이 아닙니다'),
  ridibooks_link: optionalString.refine((val) => {
    if (!val) return true
    try {
      new URL(val)
      return true
    } catch {
      return false
    }
  }, '올바른 URL 형식이 아닙니다'),
  errata_link: optionalString.refine((val) => {
    if (!val) return true
    try {
      new URL(val)
      return true
    } catch {
      return false
    }
  }, '올바른 URL 형식이 아닙니다'),
  error_report_link: optionalString.refine((val) => {
    if (!val) return true
    try {
      new URL(val)
      return true
    } catch {
      return false
    }
  }, '올바른 URL 형식이 아닙니다')
})

export const BookUpdateSchema = BookCreateSchema.partial().extend({
  id: nonEmptyString
})

export const BookStatusSchema = z.object({
  id: nonEmptyString,
  is_active: booleanField
})

// Article 스키마
export const ArticleCreateSchema = z.object({
  title: nonEmptyString.max(200, '제목은 200자 이하여야 합니다'),
  content: optionalString,
  summary: optionalString,
  author: z.string().max(100, '저자명은 100자 이하여야 합니다').default('admin'),
  category: z.enum(['tech', 'news', 'event', 'notice'], {
    message: '올바른 카테고리를 선택해주세요'
  }).default('tech'),
  featured_image_url: optionalString,
  is_published: booleanField.default(false),
  excerpt: optionalString,
  tags: z.array(z.string()).optional(),
  is_featured: booleanField.default(false)
})

export const ArticleUpdateSchema = ArticleCreateSchema.partial().extend({
  id: nonEmptyString
})

export const ArticleStatusSchema = z.object({
  id: nonEmptyString,
  is_published: booleanField
})

// User 스키마
export const UserRoleUpdateSchema = z.object({
  id: nonEmptyString,
  role: z.enum(['customer', 'professor', 'admin'], {
    message: '올바른 역할을 선택해주세요'
  })
})

export const UserStatusUpdateSchema = z.object({
  id: nonEmptyString,
  is_active: booleanField
})

// Professor Resource 스키마
export const ProfessorResourceCreateSchema = z.object({
  book_id: nonEmptyString,
  resource_type: z.enum(['lecture_slides', 'source_code', 'book_info', 'copyright'], {
    message: '올바른 자료 유형을 선택해주세요'
  }),
  title: nonEmptyString.max(200, '제목은 200자 이하여야 합니다'),
  description: optionalString,
  file_url: optionalString,
  is_active: booleanField.default(true)
})

export const ProfessorResourceUpdateSchema = ProfessorResourceCreateSchema.partial().extend({
  id: nonEmptyString
})

export const ProfessorResourceStatusSchema = z.object({
  id: nonEmptyString,
  is_active: booleanField
})

// Application 스키마
export const ProfessorApplicationSchema = z.object({
  name: nonEmptyString.max(50, '이름은 50자 이하여야 합니다'),
  email: z.string().email('올바른 이메일 형식이 아닙니다'),
  phone: nonEmptyString.regex(/^[\d-+\s()]+$/, '올바른 전화번호 형식이 아닙니다'),
  university: nonEmptyString.max(100, '대학명은 100자 이하여야 합니다'),
  department: nonEmptyString.max(100, '학과명은 100자 이하여야 합니다'),
  position: nonEmptyString.max(50, '직책은 50자 이하여야 합니다'),
  course: nonEmptyString.max(100, '강의명은 100자 이하여야 합니다'),
  book_id: nonEmptyString,
  message: z.string().max(1000, '메시지는 1000자 이하여야 합니다').optional().or(z.literal(''))
})

export const AuthorApplicationSchema = z.object({
  name: nonEmptyString.max(50, '이름은 50자 이하여야 합니다'),
  email: z.string().email('올바른 이메일 형식이 아닙니다'),
  phone: nonEmptyString.regex(/^[\d-+\s()]+$/, '올바른 전화번호 형식이 아닙니다'),
  book_title: nonEmptyString.max(200, '도서 제목은 200자 이하여야 합니다'),
  book_description: nonEmptyString.max(2000, '도서 설명은 2000자 이하여야 합니다'),
  author_bio: z.string().max(1000, '저자 소개는 1000자 이하여야 합니다').optional().or(z.literal(''))
})

// Google Docs 스키마
export const GoogleDocsSchema = z.object({
  url: z.string().url('올바른 URL 형식이 아닙니다').refine((url) => {
    return url.includes('docs.google.com/document/d/')
  }, '구글 문서 URL이 아닙니다')
})

// 리소스 다운로드 스키마
export const ResourceDownloadSchema = z.object({
  id: nonEmptyString
})

// ID 스키마 (삭제용)
export const IdSchema = z.object({
  id: nonEmptyString
})