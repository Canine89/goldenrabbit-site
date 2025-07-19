import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Container from '../components/ui/Container'
import Section from '../components/ui/Section'
import Badge from '../components/ui/Badge'
import Loading from '../components/ui/Loading'
import DOMPurify from 'dompurify'

export default function ArticleDetail() {
  const { id } = useParams()
  const [article, setArticle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (id) {
      fetchArticle()
    }
  }, [id])

  const fetchArticle = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('id', id)
        .eq('is_published', true)
        .single()
      
      if (error) {
        throw error
      }
      
      setArticle(data)
    } catch (error) {
      console.error('Article fetch error:', error)
      setError('아티클을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getReadingTime = (content) => {
    if (!content) return '1분'
    const words = content.split(' ').length
    const readingTime = Math.ceil(words / 200)
    return `${readingTime}분`
  }

  const renderContent = (content) => {
    if (!content) return null
    
    // 이미지 URL에 따라 다른 처리
    const processedContent = content.replace(
      /<img([^>]*?)src="([^"]*?)"([^>]*?)>/g,
      (match, before, src, after) => {
        // 구글 드라이브 이미지인 경우
        if (src.includes('googleusercontent.com') || src.includes('drive.google.com')) {
          return `<img${before}src="${src}"${after} crossorigin="anonymous" referrerpolicy="no-referrer">`
        }
        // goldenrabbit.co.kr 이미지는 CORS 프록시 사용
        else if (src.includes('goldenrabbit.co.kr')) {
          const proxiedSrc = `https://images.weserv.nl/?url=${encodeURIComponent(src)}`
          return `<img${before}src="${proxiedSrc}"${after} crossorigin="anonymous" referrerpolicy="no-referrer">`
        }
        // 기타 일반 이미지
        else {
          return `<img${before}src="${src}"${after} referrerpolicy="no-referrer">`
        }
      }
    )
    
    // HTML을 안전하게 정화
    const sanitizedContent = DOMPurify.sanitize(processedContent, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 's', 'a', 'img', 'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'div', 'span'],
      ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'style', 'target', 'rel', 'crossorigin', 'referrerpolicy'],
      ALLOW_DATA_ATTR: false
    })
    
    // Notion 스타일의 HTML 콘텐츠 렌더링
    return (
      <div 
        className="notion-content max-w-none text-neutral-800 leading-relaxed"
        dangerouslySetInnerHTML={{ __html: sanitizedContent }}
        style={{
          fontSize: '16px',
          lineHeight: '1.7',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
        }}
      />
    )
  }

  if (loading) {
    return <Loading />
  }

  if (error || !article) {
    return (
      <div className="bg-neutral-50 min-h-screen">
        <Section background="white" padding="xl">
          <Container>
            <div className="text-center py-16">
              <div className="text-red-500 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-neutral-900 mb-2">
                {error || '아티클을 찾을 수 없습니다'}
              </h3>
              <Link 
                to="/articles"
                className="text-blue-600 hover:text-blue-800 transition-colors"
              >
                목록으로 돌아가기
              </Link>
            </div>
          </Container>
        </Section>
      </div>
    )
  }

  return (
    <div className="bg-white min-h-screen">
      {/* 상단 네비게이션 */}
      <div className="sticky top-0 bg-white/80 backdrop-blur-sm border-b border-neutral-100 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <Link 
            to="/articles"
            className="inline-flex items-center text-neutral-500 hover:text-neutral-700 transition-colors text-sm"
          >
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            읽을거리
          </Link>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* 제목 */}
        <h1 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-6 leading-tight tracking-tight">
          {article.title}
        </h1>

        {/* 메타 정보 */}
        <div className="flex items-center gap-4 text-sm text-neutral-500 mb-8 pb-8 border-b border-neutral-100">
          <time className="font-medium">{formatDate(article.created_at)}</time>
          <span>·</span>
          <span>{getReadingTime(article.content)} 읽기</span>
          {article.is_featured && (
            <>
              <span>·</span>
              <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-medium">
                추천
              </span>
            </>
          )}
        </div>

        {/* 요약 */}
        {article.excerpt && (
          <div className="text-lg text-neutral-600 mb-10 leading-relaxed p-6 bg-neutral-50 rounded-xl border-l-4 border-blue-200">
            {article.excerpt}
          </div>
        )}

        {/* 본문 */}
        <article className="mb-16">
          <style jsx>{`
            .notion-content h1 {
              font-size: 2rem;
              font-weight: 700;
              color: #111827;
              margin: 2rem 0 1.25rem 0;
              line-height: 1.3;
            }
            .notion-content h2 {
              font-size: 1.75rem;
              font-weight: 600;
              color: #111827;
              margin: 2rem 0 1rem 0;
              line-height: 1.3;
            }
            .notion-content h3 {
              font-size: 1.5rem;
              font-weight: 600;
              color: #111827;
              margin: 1.75rem 0 0.75rem 0;
              line-height: 1.3;
            }
            .notion-content p {
              margin: 1rem 0;
              color: #374151;
              line-height: 1.7;
            }
            .notion-content a {
              color: #2563eb;
              text-decoration: none;
              border-bottom: 1px solid transparent;
              transition: border-color 0.2s;
            }
            .notion-content a:hover {
              border-bottom-color: #2563eb;
            }
            .notion-content strong {
              font-weight: 600;
              color: #111827;
            }
            .notion-content em {
              font-style: italic;
              color: #6b7280;
            }
            .notion-content code {
              background: #f3f4f6;
              color: #e11d48;
              padding: 0.25rem 0.375rem;
              border-radius: 0.375rem;
              font-size: 0.875rem;
              font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
            }
            .notion-content pre {
              background: #1f2937;
              color: #f9fafb;
              padding: 1.5rem;
              border-radius: 0.75rem;
              overflow-x: auto;
              margin: 1.5rem 0;
            }
            .notion-content pre code {
              background: none;
              color: inherit;
              padding: 0;
              border-radius: 0;
            }
            .notion-content blockquote {
              border-left: 4px solid #e5e7eb;
              padding-left: 1.5rem;
              margin: 1.5rem 0;
              color: #6b7280;
              font-style: italic;
            }
            .notion-content ul, .notion-content ol {
              margin: 1rem 0;
              padding-left: 1.5rem;
            }
            .notion-content li {
              margin: 0.5rem 0;
              color: #374151;
            }
            .notion-content img {
              border-radius: 0.75rem;
              margin: 2rem 0;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
              max-width: 100%;
              height: auto;
            }
            .notion-content hr {
              border: none;
              border-top: 1px solid #e5e7eb;
              margin: 2rem 0;
            }
          `}</style>
          {renderContent(article.content)}
        </article>

        {/* 태그 */}
        {article.tags && Array.isArray(article.tags) && article.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-12 pt-8 border-t border-neutral-100">
            {article.tags.map((tag, index) => (
              <span 
                key={index} 
                className="px-3 py-1.5 bg-neutral-100 text-neutral-700 rounded-full text-sm font-medium hover:bg-neutral-200 transition-colors"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* 하단 네비게이션 */}
        <div className="text-center pt-8 border-t border-neutral-100">
          <Link 
            to="/articles"
            className="inline-flex items-center px-6 py-3 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            다른 글 읽기
          </Link>
        </div>
      </div>
    </div>
  )
}