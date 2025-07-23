'use server'

import { revalidatePath } from 'next/cache'
import { 
  ArticleCreateSchema, 
  ArticleUpdateSchema, 
  ArticleStatusSchema,
  IdSchema 
} from './schemas'
import { 
  createServerSupabaseClient,
  checkAdminPermission,
  createSuccessResponse,
  createErrorResponse,
  sanitizeFormData,
  logError
} from './utils'
import { ActionResult, Article } from './types'

// 아티클 생성
export async function createArticle(formData: FormData): Promise<ActionResult<Article>> {
  try {
    // 관리자 권한 확인
    const isAdmin = await checkAdminPermission()
    if (!isAdmin) {
      return createErrorResponse('관리자 권한이 필요합니다')
    }

    // FormData를 객체로 변환
    const rawData = Object.fromEntries(formData.entries())
    
    // 태그가 문자열로 전달된 경우 배열로 변환
    let tags: string[] = []
    if (rawData.tags && typeof rawData.tags === 'string') {
      tags = rawData.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
    }
    
    // 필드 타입 변환
    const processedData = {
      ...rawData,
      tags,
      is_published: rawData.is_published === 'true',
      is_featured: rawData.is_featured === 'true'
    }

    // 데이터 검증
    const validatedData = ArticleCreateSchema.parse(processedData)
    
    // 데이터 정리
    const cleanData = sanitizeFormData(validatedData)

    // Supabase에 데이터 저장
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('articles')
      .insert([cleanData])
      .select()
      .single()

    if (error) {
      logError('createArticle', error)
      return createErrorResponse('아티클 생성에 실패했습니다', error.message)
    }

    // 관련 페이지 재검증
    revalidatePath('/admin/articles')
    revalidatePath('/articles')
    revalidatePath('/')

    return createSuccessResponse(data as Article, '아티클이 성공적으로 생성되었습니다')

  } catch (error) {
    logError('createArticle', error)
    if (error instanceof Error && error.name === 'ZodError') {
      return createErrorResponse('입력 데이터가 올바르지 않습니다', error.message)
    }
    return createErrorResponse('아티클 생성 중 오류가 발생했습니다')
  }
}

// 아티클 수정
export async function updateArticle(formData: FormData): Promise<ActionResult<Article>> {
  try {
    // 관리자 권한 확인
    const isAdmin = await checkAdminPermission()
    if (!isAdmin) {
      return createErrorResponse('관리자 권한이 필요합니다')
    }

    // FormData를 객체로 변환
    const rawData = Object.fromEntries(formData.entries())
    
    // 태그가 문자열로 전달된 경우 배열로 변환
    let tags: string[] | undefined = undefined
    if (rawData.tags && typeof rawData.tags === 'string') {
      tags = rawData.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
    }
    
    // 필드 타입 변환
    const processedData = {
      ...rawData,
      tags,
      is_published: rawData.is_published === 'true',
      is_featured: rawData.is_featured === 'true'
    }

    // 데이터 검증
    const validatedData = ArticleUpdateSchema.parse(processedData)
    const { id, ...updateData } = validatedData
    
    // 데이터 정리
    const cleanData = sanitizeFormData(updateData)

    // Supabase에서 데이터 업데이트
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('articles')
      .update(cleanData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      logError('updateArticle', error)
      return createErrorResponse('아티클 수정에 실패했습니다', error.message)
    }

    // 관련 페이지 재검증
    revalidatePath('/admin/articles')
    revalidatePath('/articles')
    revalidatePath(`/articles/${id}`)
    revalidatePath('/')

    return createSuccessResponse(data as Article, '아티클이 성공적으로 수정되었습니다')

  } catch (error) {
    logError('updateArticle', error)
    if (error instanceof Error && error.name === 'ZodError') {
      return createErrorResponse('입력 데이터가 올바르지 않습니다', error.message)
    }
    return createErrorResponse('아티클 수정 중 오류가 발생했습니다')
  }
}

// 아티클 삭제
export async function deleteArticle(articleId: string): Promise<ActionResult<void>> {
  try {
    // 관리자 권한 확인
    const isAdmin = await checkAdminPermission()
    if (!isAdmin) {
      return createErrorResponse('관리자 권한이 필요합니다')
    }

    // 데이터 검증
    const validatedData = IdSchema.parse({ id: articleId })

    // Supabase에서 데이터 삭제
    const supabase = await createServerSupabaseClient()
    const { error } = await supabase
      .from('articles')
      .delete()
      .eq('id', validatedData.id)

    if (error) {
      logError('deleteArticle', error)
      return createErrorResponse('아티클 삭제에 실패했습니다', error.message)
    }

    // 관련 페이지 재검증
    revalidatePath('/admin/articles')
    revalidatePath('/articles')
    revalidatePath('/')

    return createSuccessResponse(undefined, '아티클이 성공적으로 삭제되었습니다')

  } catch (error) {
    logError('deleteArticle', error)
    return createErrorResponse('아티클 삭제 중 오류가 발생했습니다')
  }
}

// 아티클 발행/비발행 상태 변경
export async function toggleArticleStatus(articleId: string, isPublished: boolean): Promise<ActionResult<Article>> {
  try {
    // 관리자 권한 확인
    const isAdmin = await checkAdminPermission()
    if (!isAdmin) {
      return createErrorResponse('관리자 권한이 필요합니다')
    }

    // 데이터 검증
    const validatedData = ArticleStatusSchema.parse({ id: articleId, is_published: isPublished })

    // Supabase에서 상태 업데이트
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('articles')
      .update({ is_published: validatedData.is_published })
      .eq('id', validatedData.id)
      .select()
      .single()

    if (error) {
      logError('toggleArticleStatus', error)
      return createErrorResponse('아티클 상태 변경에 실패했습니다', error.message)
    }

    // 관련 페이지 재검증
    revalidatePath('/admin/articles')
    revalidatePath('/articles')
    revalidatePath(`/articles/${articleId}`)
    revalidatePath('/')

    const statusText = isPublished ? '발행' : '비발행'
    return createSuccessResponse(data as Article, `아티클이 성공적으로 ${statusText}되었습니다`)

  } catch (error) {
    logError('toggleArticleStatus', error)
    return createErrorResponse('아티클 상태 변경 중 오류가 발생했습니다')
  }
}

// 아티클 조회수 증가
export async function incrementArticleViewCount(articleId: string): Promise<ActionResult<void>> {
  try {
    const validatedData = IdSchema.parse({ id: articleId })

    const supabase = await createServerSupabaseClient()
    
    // 현재 조회수 가져오기
    const { data: currentData, error: fetchError } = await supabase
      .from('articles')
      .select('view_count')
      .eq('id', validatedData.id)
      .single()

    if (fetchError) {
      logError('incrementArticleViewCount - fetch', fetchError)
      return createErrorResponse('조회수 증가에 실패했습니다')
    }

    // 조회수 증가
    const newViewCount = (currentData?.view_count || 0) + 1
    const { error: updateError } = await supabase
      .from('articles')
      .update({ view_count: newViewCount })
      .eq('id', validatedData.id)

    if (updateError) {
      logError('incrementArticleViewCount - update', updateError)
      return createErrorResponse('조회수 증가에 실패했습니다')
    }

    return createSuccessResponse(undefined)

  } catch (error) {
    logError('incrementArticleViewCount', error)
    return createErrorResponse('조회수 증가 중 오류가 발생했습니다')
  }
}

// 아티클 목록 조회 (관리자용)
export async function getAdminArticles(page: number = 1, limit: number = 10, search?: string) {
  try {
    // 관리자 권한 확인
    const isAdmin = await checkAdminPermission()
    if (!isAdmin) {
      return createErrorResponse('관리자 권한이 필요합니다')
    }

    const supabase = await createServerSupabaseClient()
    const offset = (page - 1) * limit

    let query = supabase
      .from('articles')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // 검색 조건 추가
    if (search && search.trim()) {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%,author.ilike.%${search}%`)
    }

    const { data, error, count } = await query

    if (error) {
      logError('getAdminArticles', error)
      return createErrorResponse('아티클 목록 조회에 실패했습니다', error.message)
    }

    return createSuccessResponse({
      articles: data as Article[],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    })

  } catch (error) {
    logError('getAdminArticles', error)
    return createErrorResponse('아티클 목록 조회 중 오류가 발생했습니다')
  }
}

// 단일 아티클 조회
export async function getArticle(articleId: string): Promise<ActionResult<Article>> {
  try {
    const validatedData = IdSchema.parse({ id: articleId })

    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('id', validatedData.id)
      .eq('is_published', true)
      .single()

    if (error) {
      logError('getArticle', error)
      return createErrorResponse('아티클 조회에 실패했습니다', error.message)
    }

    if (!data) {
      return createErrorResponse('해당 아티클을 찾을 수 없습니다')
    }

    return createSuccessResponse(data as Article)

  } catch (error) {
    logError('getArticle', error)
    return createErrorResponse('아티클 조회 중 오류가 발생했습니다')
  }
}

// 공개된 아티클 목록 조회 (카테고리별)
export async function getPublishedArticles(
  category?: string, 
  page: number = 1, 
  limit: number = 10,
  search?: string
) {
  try {
    const supabase = await createServerSupabaseClient()
    const offset = (page - 1) * limit

    let query = supabase
      .from('articles')
      .select('*', { count: 'exact' })
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // 카테고리 필터 추가
    if (category && category !== 'all') {
      query = query.eq('category', category)
    }

    // 검색 조건 추가
    if (search && search.trim()) {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%,excerpt.ilike.%${search}%`)
    }

    const { data, error, count } = await query

    if (error) {
      logError('getPublishedArticles', error)
      return createErrorResponse('아티클 목록 조회에 실패했습니다', error.message)
    }

    return createSuccessResponse({
      articles: data as Article[],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    })

  } catch (error) {
    logError('getPublishedArticles', error)
    return createErrorResponse('아티클 목록 조회 중 오류가 발생했습니다')
  }
}