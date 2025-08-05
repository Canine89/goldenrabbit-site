'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import rehypeSanitize from 'rehype-sanitize'
import { createSupabaseClient } from '../../lib/supabase-client'
import SmartImage from '../../components/SmartImage'
import Loading from '../../components/ui/Loading'
import type { Article } from '../../../lib/actions/types'

export default function ArticleDetailPage() {
  const params = useParams()
  const [article, setArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createSupabaseClient()

  useEffect(() => {
    if (params?.id) {
      fetchArticle(params.id as string)
    }
  }, [params?.id])

  const fetchArticle = async (articleId: string) => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('id', articleId)
        .eq('is_published', true)
        .single()

      if (error) {
        console.error('아티클 조회 오류:', error)
        return
      }

      if (data) {
        setArticle(data)
        
        // 조회수 증가
        const { error: updateError } = await supabase
          .from('articles')
          .update({ view_count: (data.view_count || 0) + 1 })
          .eq('id', articleId)

        if (updateError) {
          console.error('조회수 업데이트 오류:', updateError)
        }
      }
    } catch (error) {
      console.error('아티클 가져오기 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch {
      return '날짜 정보 없음'
    }
  }

  const extractFirstImage = (content: string) => {
    if (!content) return null
    const imgMatch = content.match(/<img[^>]*src=["']([^"']+)["'][^>]*>/i)
    if (imgMatch) {
      return imgMatch[1]
    }
    
    // 마크다운 이미지 형식도 확인
    const markdownImgMatch = content.match(/!\[.*?\]\(([^)]+)\)/)
    if (markdownImgMatch) {
      return markdownImgMatch[1]
    }
    
    return null
  }

  // 마크다운 콘텐츠가 유효한지 확인하는 함수
  const isValidMarkdown = (content: string) => {
    if (!content) return false
    
    // 마크다운 문법 요소들이 있는지 확인
    const markdownPatterns = [
      /^#{1,6}\s+/m,     // 헤딩
      /\*\*.*?\*\*/,     // 굵은 글씨
      /\*.*?\*/,         // 기울임
      /^[-*+]\s+/m,      // 리스트
      /^\d+\.\s+/m,      // 번호 리스트
      /```[\s\S]*?```/,  // 코드 블록
      /`[^`]+`/,         // 인라인 코드
      /^>/m,             // 인용구
      /\[.*?\]\(.*?\)/,  // 링크
      /!\[.*?\]\(.*?\)/, // 이미지
      /\|.*?\|/,         // 테이블
    ]
    
    return markdownPatterns.some(pattern => pattern.test(content))
  }

  // Enter로 입력된 줄바꿈을 JSX로 처리하는 함수
  const formatTextWithBreaks = (text: string) => {
    if (!text) return text
    return text.split('\n').map((line, index, array) => (
      <React.Fragment key={index}>
        {line}
        {index < array.length - 1 && <br />}
      </React.Fragment>
    ))
  }

  // 마크다운 전처리 함수 - 이미지를 단락에서 분리
  const preprocessMarkdown = (content: string) => {
    if (!content) return content
    
    // 이미지가 단락 내에 있을 경우 별도 줄로 분리
    return content
      .replace(/(.+)\s*!\[([^\]]*)\]\(([^)]+)\)\s*(.*)/, (match, before, alt, src, after) => {
        const trimmedBefore = before?.trim()
        const trimmedAfter = after?.trim()
        
        let result = ''
        if (trimmedBefore) result += trimmedBefore + '\n\n'
        result += `![${alt}](${src})`
        if (trimmedAfter) result += '\n\n' + trimmedAfter
        
        return result
      })
  }

  // 마크다운과 일반 텍스트를 모두 처리하는 함수
  const renderContent = (content: string) => {
    if (!content) return null
    
    const shouldRenderMarkdown = isValidMarkdown(content)
    
    if (shouldRenderMarkdown) {
      const processedContent = preprocessMarkdown(content)
      
      return (
        <div className="markdown-content">
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkBreaks]}
            rehypePlugins={[rehypeSanitize]}
            components={{
              // 문단
              p: ({ children }) => (
                <p className="mb-6 leading-relaxed text-gray-700 text-base lg:text-lg">
                  {children}
                </p>
              ),
              
              // 헤딩들
              h1: ({ children }) => (
                <h1 className="text-3xl lg:text-4xl font-bold mb-8 mt-12 text-gray-900 relative border-b-2 border-primary-500 pb-4">
                  {children}
                </h1>
              ),
              h2: ({ children }) => (
                <h2 className="text-2xl lg:text-3xl font-bold mb-6 mt-10 text-gray-800">
                  <span className="text-primary-500 mr-3">#</span>
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-xl lg:text-2xl font-semibold mb-4 mt-8 text-gray-800 border-l-4 border-primary-500 pl-4">
                  {children}
                </h3>
              ),
              h4: ({ children }) => (
                <h4 className="text-lg lg:text-xl font-semibold mb-3 mt-6 text-gray-700">
                  {children}
                </h4>
              ),
              h5: ({ children }) => (
                <h5 className="text-base lg:text-lg font-semibold mb-2 mt-4 text-gray-700">
                  {children}
                </h5>
              ),
              h6: ({ children }) => (
                <h6 className="text-sm lg:text-base font-semibold mb-2 mt-4 text-gray-600">
                  {children}
                </h6>
              ),

              // 리스트
              ul: ({ children }) => (
                <ul className="mb-6 space-y-2 ml-6 list-disc marker:text-primary-500">
                  {children}
                </ul>
              ),
              ol: ({ children }) => (
                <ol className="mb-6 space-y-2 ml-6 list-decimal marker:text-primary-500">
                  {children}
                </ol>
              ),
              li: ({ children }) => (
                <li className="leading-relaxed text-gray-700 text-base lg:text-lg">
                  {children}
                </li>
              ),

              // 인용구
              blockquote: ({ children }) => (
                <blockquote className="relative my-8 p-6 bg-gradient-to-r from-primary-50 to-transparent border-l-4 border-primary-500 rounded-r-lg">
                  <div className="text-gray-700 italic text-base lg:text-lg leading-relaxed">
                    {children}
                  </div>
                </blockquote>
              ),

              // 코드
              code: ({ children, className, ...props }) => {
                const isInline = !className
                if (isInline) {
                  return (
                    <code className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm font-mono border">
                      {children}
                    </code>
                  )
                }
                return (
                  <code className="block bg-gray-900 text-gray-100 p-4 rounded-lg text-sm font-mono overflow-auto leading-relaxed" {...props}>
                    {children}
                  </code>
                )
              },
              pre: ({ children }) => (
                <div className="my-6">
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm font-mono overflow-auto leading-relaxed">
                    {children}
                  </pre>
                </div>
              ),

              // 강조
              strong: ({ children }) => (
                <strong className="font-bold text-gray-900">{children}</strong>
              ),
              em: ({ children }) => (
                <em className="italic text-gray-700">{children}</em>
              ),

              // 이미지
              img: ({ src, alt }) => {
                if (!src) return null
                
                return (
                  <span className="block my-8 text-center">
                    <img
                      src={src}
                      alt={alt || ''}
                      className="max-w-full h-auto mx-auto rounded-lg shadow-md"
                      loading="lazy"
                      crossOrigin="anonymous"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        // 이미지 로드 실패 시 플레이스홀더로 교체
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                        const placeholder = document.createElement('span')
                        placeholder.className = 'inline-flex items-center justify-center bg-gray-100 text-gray-400 text-sm p-8 rounded-lg'
                        placeholder.innerHTML = `
                          <svg class="w-8 h-8 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          이미지를 불러올 수 없습니다
                        `
                        target.parentNode?.insertBefore(placeholder, target)
                      }}
                    />
                    {alt && (
                      <span className="block text-sm text-gray-500 mt-2 italic">{alt}</span>
                    )}
                  </span>
                )
              },

              // 테이블
              table: ({ children }) => (
                <div className="overflow-x-auto my-8">
                  <table className="min-w-full border border-gray-300 rounded-lg overflow-hidden">
                    {children}
                  </table>
                </div>
              ),
              thead: ({ children }) => (
                <thead className="bg-gray-50">
                  {children}
                </thead>
              ),
              tbody: ({ children }) => (
                <tbody className="divide-y divide-gray-200">
                  {children}
                </tbody>
              ),
              tr: ({ children }) => (
                <tr className="hover:bg-gray-50 transition-colors">
                  {children}
                </tr>
              ),
              td: ({ children }) => (
                <td className="px-4 py-3 text-sm leading-relaxed text-gray-700">
                  {children}
                </td>
              ),
              th: ({ children }) => (
                <th className="px-4 py-3 text-sm font-semibold text-left text-gray-900 bg-gray-100">
                  {children}
                </th>
              ),

              // 링크
              a: ({ children, href }) => (
                <a 
                  href={href} 
                  className="text-primary-600 font-medium hover:text-primary-700 underline hover:no-underline transition-all"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {children}
                </a>
              ),

              // 구분선
              hr: () => (
                <hr className="my-12 border-t-2 border-gray-200" />
              ),
            }}
          >
            {processedContent}
          </ReactMarkdown>
        </div>
      )
    } else {
      // 일반 텍스트의 경우 줄바꿈 처리
      return (
        <div className="leading-relaxed text-gray-700 text-base lg:text-lg">
          {formatTextWithBreaks(content)}
        </div>
      )
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loading size="lg" text="아티클 로딩 중..." />
      </div>
    )
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">아티클을 찾을 수 없습니다</h1>
          <p className="text-gray-600 mb-6">요청하신 아티클이 존재하지 않거나 삭제되었습니다.</p>
          <Link href="/articles" className="inline-flex items-center px-6 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors">
            아티클 목록으로 돌아가기
          </Link>
        </div>
      </div>
    )
  }

  const firstImage = extractFirstImage(article.content || '')
  const imageUrl = firstImage || article.featured_image_url

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 상단 헤더 */}
      <div className="bg-gradient-gold shadow-lg">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="text-center">
            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white/20 text-white mb-4">
              <span>📖</span>
              <span className="ml-2">기술 아티클</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-bold mb-4 text-white leading-tight">
              골든래빗 기술 아티클
            </h1>
            <p className="text-base sm:text-lg max-w-2xl mx-auto text-white opacity-90 px-2">
              최신 기술 트렌드와 개발 인사이트를 전해드립니다
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <article className="bg-white rounded-lg shadow-sm overflow-hidden">
          {/* 피처드 이미지 */}
          {imageUrl && (
            <div className="aspect-video bg-gray-200 overflow-hidden">
              <SmartImage
                src={imageUrl}
                alt={article.title}
                width={768}
                height={432}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="p-4 sm:p-8">
            {/* 메타 정보 */}
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6 flex-wrap">
              <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-blue-100 text-blue-800">
                {article.category === 'tech' ? '기술' :
                 article.category === 'news' ? '뉴스' :
                 article.category === 'event' ? '이벤트' :
                 article.category === 'notice' ? '공지사항' : 'Tech'}
              </span>
              <span className="text-xs sm:text-base text-gray-500">{formatDate(article.created_at)}</span>
              {article.is_featured && (
                <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-green-100 text-green-800">
                  추천 아티클
                </span>
              )}
            </div>

            {/* 제목 */}
            <h1 className="text-xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight">
              {article.title}
            </h1>

            {/* 요약 */}
            {article.excerpt && (
              <div className="bg-gray-50 rounded-lg p-4 sm:p-6 mb-6 sm:mb-8">
                <div className="text-sm sm:text-lg text-gray-700 leading-relaxed">
                  {renderContent(article.excerpt)}
                </div>
              </div>
            )}

            {/* 본문 */}
            <div className="prose prose-sm sm:prose-lg max-w-none">
              {article.content ? (
                renderContent(article.content)
              ) : (
                <p className="text-gray-500 italic">본문 내용이 없습니다.</p>
              )}
            </div>

            {/* 통계 */}
            <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-gray-200">
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>조회수: {(article.view_count || 0).toLocaleString()}회</span>
                <span>작성일: {formatDate(article.created_at)}</span>
              </div>
            </div>

            {/* 태그 */}
            {article.tags && article.tags.length > 0 && (
              <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-900 mb-3">태그</h3>
                <div className="flex flex-wrap gap-2">
                  {article.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm bg-gray-100 text-gray-700"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </article>

        {/* 하단 네비게이션 */}
        <div className="mt-8 flex justify-center">
          <Link 
            href="/articles" 
            className="inline-flex items-center px-6 py-3 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            아티클 목록으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  )
}