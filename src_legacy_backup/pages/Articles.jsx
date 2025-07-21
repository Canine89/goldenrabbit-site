import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Container from '../components/ui/Container'
import Section from '../components/ui/Section'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Loading from '../components/ui/Loading'

export default function Articles() {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchArticles()
  }, [])

  const fetchArticles = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false })
      
      if (error) {
        throw error
      }
      
      setArticles(data || [])
    } catch (error) {
      console.error('Articles fetch error:', error)
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
    const readingTime = Math.ceil(words / 200) // 분당 200단어 기준
    return `${readingTime}분`
  }

  // 글 내용에서 첫 번째 이미지 URL 추출
  const extractFirstImage = (content) => {
    if (!content) return null
    
    // img 태그에서 src 속성을 찾는 정규식
    const imgRegex = /<img[^>]+src="([^"]+)"[^>]*>/i
    const match = content.match(imgRegex)
    
    if (match && match[1]) {
      let imageSrc = match[1]
      
      // 구글 드라이브 이미지인 경우 그대로 사용
      if (imageSrc.includes('googleusercontent.com') || imageSrc.includes('drive.google.com')) {
        return imageSrc
      }
      // goldenrabbit.co.kr 이미지는 프록시 사용
      else if (imageSrc.includes('goldenrabbit.co.kr')) {
        return `https://images.weserv.nl/?url=${encodeURIComponent(imageSrc)}`
      }
      // 기타 일반 이미지
      else {
        return imageSrc
      }
    }
    
    return null
  }

  if (loading) {
    return <Loading />
  }

  return (
    <div className="bg-neutral-50 min-h-screen">
      {/* 헤더 섹션 */}
      <Section background="white" padding="xl">
        <Container>
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-neutral-900">
              읽을거리
            </h1>
            <p className="text-xl md:text-2xl text-neutral-600 max-w-3xl mx-auto leading-relaxed">
              IT와 개발에 대한 인사이트와 경험을 공유합니다
            </p>
          </div>
        </Container>
      </Section>

      {/* 아티클 목록 */}
      <Section background="neutral" padding="default">
        <Container>
          {error ? (
            <div className="text-center py-16">
              <div className="text-red-500 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-neutral-900 mb-2">{error}</h3>
              <button 
                onClick={fetchArticles}
                className="text-blue-600 hover:text-blue-800 transition-colors"
              >
                다시 시도
              </button>
            </div>
          ) : articles.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-neutral-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-neutral-900 mb-2">
                아직 공개된 아티클이 없습니다
              </h3>
              <p className="text-neutral-500">
                곧 흥미로운 글들을 만나보실 수 있습니다
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {articles.map((article) => (
                <Card 
                  key={article.id}
                  as={Link}
                  to={`/articles/${article.id}`}
                  hover={true}
                  className="group h-full flex flex-col"
                >
                  {/* 대표 이미지 */}
                  {(() => {
                    const firstImage = extractFirstImage(article.content)
                    const imageUrl = firstImage || article.featured_image_url
                    
                    return imageUrl ? (
                      <div className="aspect-video bg-neutral-200 rounded-t-lg overflow-hidden">
                        <img 
                          src={imageUrl}
                          alt={article.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          crossOrigin={imageUrl.includes('googleusercontent.com') || imageUrl.includes('images.weserv.nl') ? 'anonymous' : undefined}
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    ) : (
                      <div className="aspect-video bg-gradient-to-br from-primary-100 to-primary-200 rounded-t-lg flex items-center justify-center">
                        <svg className="w-12 h-12 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                    )
                  })()}

                  <div className="p-5 flex flex-col flex-grow">
                    {/* 메타 정보 */}
                    <div className="flex items-center text-xs text-neutral-500 mb-3">
                      <time>{formatDate(article.created_at)}</time>
                      <span className="mx-1">·</span>
                      <span>{getReadingTime(article.content)}</span>
                      {article.is_featured && (
                        <>
                          <span className="mx-1">·</span>
                          <Badge variant="primary" size="sm">추천</Badge>
                        </>
                      )}
                    </div>

                    {/* 제목 */}
                    <h2 className="text-lg font-bold text-neutral-900 mb-3 group-hover:text-primary-600 transition-colors leading-tight line-clamp-2">
                      {article.title}
                    </h2>

                    {/* 요약 또는 내용 미리보기 */}
                    <div className="text-sm text-neutral-600 mb-4 flex-grow">
                      <p className="line-clamp-3 leading-relaxed">
                        {article.excerpt || 
                         (article.content ? article.content.replace(/<[^>]*>/g, '').substring(0, 120) + '...' : '')}
                      </p>
                    </div>

                    {/* 태그 */}
                    {article.tags && Array.isArray(article.tags) && article.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {article.tags.slice(0, 3).map((tag, index) => (
                          <Badge key={index} variant="neutral" size="sm" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {article.tags.length > 3 && (
                          <span className="text-xs text-neutral-400">+{article.tags.length - 3}</span>
                        )}
                      </div>
                    )}

                    {/* 읽기 더보기 */}
                    <div className="flex items-center text-primary-600 group-hover:text-primary-700 transition-colors text-sm font-medium mt-auto">
                      <span>읽어보기</span>
                      <svg className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Container>
      </Section>
    </div>
  )
}