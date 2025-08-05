'use server'

import { 
  createServerSupabaseClient,
  checkAdminPermission,
  createSuccessResponse,
  createErrorResponse,
  logError
} from './utils'
import { ActionResult } from './types'

// URL에서 아티클 콘텐츠 추출 결과 타입
export interface ExtractedArticle {
  title: string
  content: string
  excerpt: string
  featured_image_url?: string
  category: string
  tags: string[]
  author?: string
  publish_date?: string
}

// 골든래빗 사이트에서 아티클 콘텐츠를 추출하는 함수
export async function extractArticleFromUrl(url: string): Promise<ActionResult<ExtractedArticle>> {
  try {
    // 관리자 권한 확인
    const isAdmin = await checkAdminPermission()
    if (!isAdmin) {
      return createErrorResponse('관리자 권한이 필요합니다')
    }

    // URL 유효성 검사
    if (!url || !url.includes('goldenrabbit.co.kr')) {
      return createErrorResponse('유효한 골든래빗 사이트 URL을 입력해주세요')
    }

    // 간단한 웹 스크래핑으로 콘텐츠 추출 (실제로는 WebFetch 도구를 사용해야 함)
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const html = await response.text()
    
    // 기본적인 HTML 파싱으로 콘텐츠 추출
    const extractedData = parseHtmlContent(html, url)
    
    // 응답 데이터 검증 및 정리
    const cleanedData: ExtractedArticle = {
      title: extractedData.title || '제목 없음',
      content: extractedData.content || '',
      excerpt: extractedData.excerpt || extractedData.content?.substring(0, 200) + '...' || '',
      featured_image_url: extractedData.featured_image_url || '',
      category: validateCategory(extractedData.category) || 'tech',
      tags: Array.isArray(extractedData.tags) ? extractedData.tags : [],
      author: extractedData.author || '골든래빗',
      publish_date: extractedData.publish_date
    }

    // 이미지 URL 처리 (골든래빗 이미지는 프록시 사용)
    if (cleanedData.featured_image_url && cleanedData.featured_image_url.includes('goldenrabbit.co.kr')) {
      cleanedData.featured_image_url = `https://images.weserv.nl/?url=${encodeURIComponent(cleanedData.featured_image_url)}`
    }

    // 본문에서 골든래빗 이미지 URL들도 프록시로 변경
    if (cleanedData.content) {
      cleanedData.content = cleanedData.content.replace(
        /src="([^"]*goldenrabbit\.co\.kr[^"]*)"/g,
        (match, url) => `src="https://images.weserv.nl/?url=${encodeURIComponent(url)}"`
      )
    }

    return createSuccessResponse(cleanedData, '아티클 콘텐츠를 성공적으로 추출했습니다')

  } catch (error: any) {
    logError('extractArticleFromUrl', error)
    return createErrorResponse(`콘텐츠 추출 중 오류가 발생했습니다: ${error.message}`)
  }
}

// HTML 파싱 함수
function parseHtmlContent(html: string, url: string): any {
  // 기본적인 제목 추출
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  const title = titleMatch ? titleMatch[1].replace(/\s*-\s*골든래빗.*$/i, '').trim() : '제목 없음'
  
  // 메타 디스크립션 추출
  const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i)
  const excerpt = descMatch ? descMatch[1] : ''
  
  // 기본적인 콘텐츠 추출 (article 태그나 main 태그 내용)
  let rawContent = ''
  const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i) ||
                      html.match(/<main[^>]*>([\s\S]*?)<\/main>/i) ||
                      html.match(/<div[^>]*class="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>/i) ||
                      html.match(/<div[^>]*class="[^"]*post[^"]*"[^>]*>([\s\S]*?)<\/div>/i)
  
  if (articleMatch) {
    rawContent = articleMatch[1]
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // 스크립트 제거
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '') // 스타일 제거
      .replace(/<!--[\s\S]*?-->/g, '') // 주석 제거
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '') // 네비게이션 제거
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '') // 푸터 제거
      .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, '') // 사이드바 제거
      .trim()
  }
  
  // HTML을 마크다운으로 변환
  const content = convertHtmlToMarkdown(rawContent)
  
  // 첫 번째 이미지 추출
  const imgMatch = rawContent.match(/<img[^>]*src=["']([^"']+)["']/i)
  const featured_image_url = imgMatch ? imgMatch[1] : ''
  
  // 카테고리 추정 (URL 기반)
  let category = 'tech'
  if (url.includes('/news') || url.includes('/소식')) category = 'news'
  else if (url.includes('/event') || url.includes('/이벤트')) category = 'event'
  else if (url.includes('/notice') || url.includes('/공지')) category = 'notice'
  
  // 텍스트만 추출해서 excerpt 생성
  const plainText = content.replace(/[#*\[\]()_`~]/g, '').replace(/\n+/g, ' ').trim()
  const finalExcerpt = excerpt || (plainText.length > 200 ? plainText.substring(0, 200) + '...' : plainText)
  
  return {
    title,
    content,
    excerpt: finalExcerpt,
    featured_image_url,
    category,
    tags: [],
    author: '골든래빗'
  }
}

// HTML을 마크다운으로 변환하는 함수
function convertHtmlToMarkdown(html: string): string {
  if (!html) return ''
  
  let markdown = html
  
  // 헤딩 변환 (h1-h6)
  markdown = markdown.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, '\n# $1\n')
  markdown = markdown.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, '\n## $1\n')
  markdown = markdown.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, '\n### $1\n')
  markdown = markdown.replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, '\n#### $1\n')
  markdown = markdown.replace(/<h5[^>]*>([\s\S]*?)<\/h5>/gi, '\n##### $1\n')
  markdown = markdown.replace(/<h6[^>]*>([\s\S]*?)<\/h6>/gi, '\n###### $1\n')
  
  // 굵은 글씨 변환
  markdown = markdown.replace(/<(?:strong|b)[^>]*>([\s\S]*?)<\/(?:strong|b)>/gi, '**$1**')
  
  // 기울임 글씨 변환
  markdown = markdown.replace(/<(?:em|i)[^>]*>([\s\S]*?)<\/(?:em|i)>/gi, '*$1*')
  
  // 코드 변환
  markdown = markdown.replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, '`$1`')
  markdown = markdown.replace(/<pre[^>]*>([\s\S]*?)<\/pre>/gi, '\n```\n$1\n```\n')
  
  // 링크 변환
  markdown = markdown.replace(/<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, '[$2]($1)')
  
  // 이미지 변환
  markdown = markdown.replace(/<img[^>]*src=["']([^"']+)["'][^>]*alt=["']([^"']*)["'][^>]*\/?>/gi, '![$2]($1)')
  markdown = markdown.replace(/<img[^>]*alt=["']([^"']*)["'][^>]*src=["']([^"']+)["'][^>]*\/?>/gi, '![$1]($2)')
  markdown = markdown.replace(/<img[^>]*src=["']([^"']+)["'][^>]*\/?>/gi, '![]($1)')
  
  // 리스트 변환
  markdown = markdown.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, (match, content) => {
    const items = content.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '- $1\n')
    return '\n' + items + '\n'
  })
  
  markdown = markdown.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (match, content) => {
    let counter = 1
    const items = content.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, () => {
      const item = `${counter}. ${RegExp.$1}\n`
      counter++
      return item
    })
    return '\n' + items + '\n'
  })
  
  // 인용구 변환
  markdown = markdown.replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, '\n> $1\n')
  
  // 줄바꿈 변환
  markdown = markdown.replace(/<br\s*\/?>/gi, '\n')
  
  // 단락 변환
  markdown = markdown.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, '\n$1\n')
  
  // div 태그 변환 (단순히 내용만 유지)
  markdown = markdown.replace(/<div[^>]*>([\s\S]*?)<\/div>/gi, '$1')
  
  // 테이블 변환 (기본적인 형태)
  markdown = markdown.replace(/<table[^>]*>([\s\S]*?)<\/table>/gi, (match, content) => {
    // 간단한 테이블 변환 (완전하지 않음)
    let tableMarkdown = '\n'
    const rows = content.match(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)
    if (rows) {
      rows.forEach((row: string, index: number) => {
        const cells = row.match(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi)
        if (cells) {
          const cellTexts = cells.map((cell: string) => cell.replace(/<[^>]*>/g, '').trim())
          tableMarkdown += '| ' + cellTexts.join(' | ') + ' |\n'
          
          // 헤더 구분선 추가 (첫 번째 행 후)
          if (index === 0) {
            tableMarkdown += '|' + cellTexts.map(() => ' --- ').join('|') + '|\n'
          }
        }
      })
    }
    return tableMarkdown + '\n'
  })
  
  // 남은 HTML 태그 제거
  markdown = markdown.replace(/<[^>]*>/g, '')
  
  // HTML 엔티티 디코딩
  markdown = markdown
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&nbsp;/g, ' ')
  
  // 과도한 줄바꿈 정리
  markdown = markdown
    .replace(/\n{3,}/g, '\n\n') // 3개 이상의 연속 줄바꿈을 2개로
    .replace(/^\n+/, '') // 시작 부분의 줄바꿈 제거
    .replace(/\n+$/, '') // 끝 부분의 줄바꿈 제거
    .trim()
  
  return markdown
}

// 카테고리 유효성 검사
function validateCategory(category: string): string {
  const validCategories = ['tech', 'news', 'event', 'notice']
  const lowerCategory = category?.toLowerCase()
  
  if (validCategories.includes(lowerCategory)) {
    return lowerCategory
  }

  // 키워드 기반 카테고리 추정
  if (lowerCategory?.includes('기술') || lowerCategory?.includes('tech') || lowerCategory?.includes('개발')) {
    return 'tech'
  }
  if (lowerCategory?.includes('뉴스') || lowerCategory?.includes('news') || lowerCategory?.includes('소식')) {
    return 'news'
  }
  if (lowerCategory?.includes('이벤트') || lowerCategory?.includes('event')) {
    return 'event'
  }
  if (lowerCategory?.includes('공지') || lowerCategory?.includes('notice')) {
    return 'notice'
  }

  return 'tech' // 기본값
}

// 중복 아티클 체크
export async function checkDuplicateArticle(title: string): Promise<ActionResult<boolean>> {
  try {
    const isAdmin = await checkAdminPermission()
    if (!isAdmin) {
      return createErrorResponse('관리자 권한이 필요합니다')
    }

    const supabase = await createServerSupabaseClient()
    
    const { data, error } = await supabase
      .from('articles')
      .select('id, title')
      .ilike('title', `%${title}%`)
      .limit(1)

    if (error) {
      logError('checkDuplicateArticle', error)
      return createErrorResponse('중복 확인 중 오류가 발생했습니다')
    }

    const isDuplicate = data && data.length > 0
    return createSuccessResponse(isDuplicate, isDuplicate ? '유사한 제목의 아티클이 존재합니다' : '중복되지 않습니다')

  } catch (error: any) {
    logError('checkDuplicateArticle', error)
    return createErrorResponse(`중복 확인 중 오류가 발생했습니다: ${error.message}`)
  }
}

// 배치 마이그레이션 (여러 URL 처리)
export async function migrateBatchArticles(urls: string[]): Promise<ActionResult<any>> {
  try {
    const isAdmin = await checkAdminPermission()
    if (!isAdmin) {
      return createErrorResponse('관리자 권한이 필요합니다')
    }

    const results = {
      success: [] as Array<{ url: string; data: any }>,
      failed: [] as Array<{ url: string; error: string }>,
      duplicates: [] as Array<{ url: string; title: string }>
    }

    for (const url of urls) {
      try {
        // 콘텐츠 추출
        const extractResult = await extractArticleFromUrl(url)
        if (!extractResult.success) {
          results.failed.push({ url, error: extractResult.error })
          continue
        }

        // 중복 체크
        const duplicateCheck = await checkDuplicateArticle(extractResult.data!.title)
        if (duplicateCheck.success && duplicateCheck.data) {
          results.duplicates.push({ url, title: extractResult.data!.title })
          continue
        }

        // 성공 목록에 추가 (실제 등록은 클라이언트에서 수행)
        results.success.push({ url, data: extractResult.data })

      } catch (error: any) {
        results.failed.push({ url, error: error.message })
      }
    }

    const message = `처리 완료 - 성공: ${results.success.length}, 실패: ${results.failed.length}, 중복: ${results.duplicates.length}`
    return createSuccessResponse(results, message)

  } catch (error: any) {
    logError('migrateBatchArticles', error)
    return createErrorResponse(`배치 마이그레이션 중 오류가 발생했습니다: ${error.message}`)
  }
}