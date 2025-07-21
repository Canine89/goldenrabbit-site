'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeSanitize from 'rehype-sanitize'
import { createSupabaseClient } from '../../lib/supabase-client'
import SmartImage from '../../components/SmartImage'
import Loading from '../../components/ui/Loading'

interface Article {
  id: string
  title: string
  content?: string
  excerpt?: string
  featured_image_url?: string
  category: string
  tags?: string[]
  is_featured: boolean
  is_published: boolean
  created_at: string
  updated_at: string
}

export default function ArticleDetailPage() {
  const params = useParams()
  const [article, setArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createSupabaseClient()

  useEffect(() => {
    if (params.id) {
      fetchArticle(params.id as string)
    }
  }, [params.id])

  const fetchArticle = async (articleId: string) => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('id', articleId)
        .eq('is_published', true)
        .single()

      if (error) throw error
      setArticle(data)
    } catch (error) {
      console.error('아티클 조회 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    })
  }

  // 마크다운 텍스트에서 줄바꿈을 처리하는 함수
  const preprocessMarkdownForLineBreaks = (content: string) => {
    // 1. 먼저 2개 이상의 연속 줄바꿈을 1개로 정규화
    // 2. 그 다음 모든 줄바꿈을 마크다운 hard break로 변환
    return content
      .replace(/\n{2,}/g, '\n')  // 2개 이상 연속 줄바꿈을 1개로
      .replace(/\n/g, '  \n')    // 모든 줄바꿈을 hard break로
  }

  // Enter로 입력된 줄바꿈을 JSX로 처리하는 함수 (fallback용)
  const formatTextWithBreaks = (text: string) => {
    if (!text) return text
    return text.split('\n').map((line, index, array) => (
      <React.Fragment key={index}>
        {line}
        {index < array.length - 1 && <br />}
      </React.Fragment>
    ))
  }

  // 마크다운과 일반 텍스트를 모두 처리하는 함수
  const renderContent = (content: string, isMarkdown: boolean = true) => {
    if (!content) return null
    
    if (isMarkdown) {
      // 마크다운 전처리: 단일 줄바꿈을 hard break로 변환
      const processedContent = preprocessMarkdownForLineBreaks(content)
      
      return (
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeSanitize]}
          components={{
            p: ({ children }) => <p className="mb-4 leading-relaxed text-gray-700">{children}</p>,
            h1: ({ children }) => (
              <h1 className="text-3xl font-bold mb-6 mt-8 text-gray-900 border-b-2 border-primary-200 pb-2">
                {children}
              </h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-2xl font-bold mb-4 mt-7 text-gray-900 border-b border-gray-200 pb-1">
                {children}
              </h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-xl font-semibold mb-3 mt-6 text-gray-800">
                {children}
              </h3>
            ),
            h4: ({ children }) => (
              <h4 className="text-lg font-semibold mb-2 mt-4 text-gray-800">
                {children}
              </h4>
            ),
            ul: ({ children }) => (
              <ul className="list-disc ml-8 mb-6 space-y-2 pl-4">
                {children}
              </ul>
            ),
            ol: ({ children }) => (
              <ol className="list-decimal ml-8 mb-6 space-y-2 pl-4">
                {children}
              </ol>
            ),
            li: ({ children }) => (
              <li className="leading-relaxed text-gray-700 ml-4">
                {children}
              </li>
            ),
            blockquote: ({ children }) => (
              <blockquote className="border-l-4 border-yellow-400 bg-yellow-50 pl-6 pr-4 py-3 italic my-6 rounded-r-lg">
                <div className="text-yellow-800">
                  {children}
                </div>
              </blockquote>
            ),
            code: ({ children }) => (
              <code className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm font-mono border">
                {children}
              </code>
            ),
            pre: ({ children }) => (
              <pre className="bg-gray-900 text-gray-100 p-6 rounded-lg overflow-x-auto mb-6 border shadow-lg">
                <code className="text-sm font-mono leading-relaxed">
                  {children}
                </code>
              </pre>
            ),
            strong: ({ children }) => (
              <strong className="font-bold text-gray-900">
                {children}
              </strong>
            ),
            em: ({ children }) => (
              <em className="italic text-gray-700">
                {children}
              </em>
            ),
            br: () => <br className="block" />,
            table: ({ children }) => (
              <div className="overflow-x-auto my-6">
                <table className="min-w-full border-collapse border border-gray-300 bg-white rounded-lg shadow-sm">
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
              <td className="border border-gray-300 px-4 py-2 text-sm text-gray-700">
                {children}
              </td>
            ),
            th: ({ children }) => (
              <th className="border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-900 bg-gray-100">
                {children}
              </th>
            ),
          }}
        >
          {processedContent}
        </ReactMarkdown>
      )
    } else {
      // 일반 텍스트의 경우 줄바꿈 처리
      return (
        <div className="leading-relaxed">
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

  const imageUrl = article.featured_image_url

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 상단 네비게이션 */}
        <div className="mb-6">
          <Link href="/articles" className="inline-flex items-center text-blue-600 hover:text-blue-700">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            아티클 목록으로 돌아가기
          </Link>
        </div>

        {/* 아티클 헤더 */}
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

          <div className="p-8">
            {/* 메타 정보 */}
            <div className="flex items-center gap-3 mb-6">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                {article.category === 'tech' ? '기술' :
                 article.category === 'news' ? '뉴스' :
                 article.category === 'event' ? '이벤트' :
                 article.category === 'notice' ? '공지사항' : 'Tech'}
              </span>
              <span className="text-gray-500">{formatDate(article.created_at)}</span>
              {article.is_featured && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  추천 아티클
                </span>
              )}
            </div>

            {/* 제목 */}
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6 leading-tight">
              {article.title}
            </h1>

            {/* 요약 */}
            {article.excerpt && (
              <div className="bg-gray-50 rounded-lg p-6 mb-8">
                <div className="text-lg text-gray-700 leading-relaxed">
                  {renderContent(article.excerpt)}
                </div>
              </div>
            )}

            {/* 본문 */}
            <div className="prose prose-lg max-w-none">
              {article.content ? (
                renderContent(article.content)
              ) : (
                <p className="text-gray-500 text-center py-8">
                  아티클 내용이 준비 중입니다.
                </p>
              )}
            </div>

            {/* 태그 */}
            {article.tags && article.tags.length > 0 && (
              <div className="mt-8 pt-8 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-900 mb-3">태그</h3>
                <div className="flex flex-wrap gap-2">
                  {article.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 공유하기 */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-900 mb-3">공유하기</h3>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: article.title,
                        text: article.excerpt || '골든래빗의 Tech 아티클',
                        url: window.location.href,
                      })
                    } else {
                      navigator.clipboard.writeText(window.location.href)
                      alert('링크가 클립보드에 복사되었습니다!')
                    }
                  }}
                  className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                  </svg>
                  공유하기
                </button>
              </div>
            </div>
          </div>
        </article>
      </div>
    </div>
  )
}