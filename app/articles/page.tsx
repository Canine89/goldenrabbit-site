'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createSupabaseClient } from '../lib/supabase-client'
import SmartImage from '../components/SmartImage'
import Card from '../components/ui/Card'
import Loading from '../components/ui/Loading'
import Button from '../components/ui/Button'

interface Article {
  id: string
  title: string
  content?: string
  excerpt?: string
  featured_image_url?: string
  category: string
  is_featured: boolean
  is_published: boolean
  created_at: string
  updated_at: string
}

const categories = [
  { id: 'all', name: '전체' },
  { id: 'tech', name: '기술' },
  { id: 'news', name: '뉴스' },
  { id: 'event', name: '이벤트' },
  { id: 'notice', name: '공지사항' },
]

export default function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const supabase = createSupabaseClient()

  useEffect(() => {
    fetchArticles()
  }, [selectedCategory])

  const fetchArticles = async () => {
    try {
      setLoading(true)
      
      let query = supabase
        .from('articles')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false })

      if (selectedCategory !== 'all') {
        query = query.eq('category', selectedCategory)
      }

      const { data, error } = await query

      if (error) throw error
      
      // 아티클 데이터 로드 완료
      
      setArticles(data || [])
    } catch (error) {
      console.error('아티클 조회 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredArticles = articles.filter(article =>
    article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (article.excerpt && article.excerpt.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // 글 내용에서 첫 번째 이미지 URL 추출
  const extractFirstImage = (content?: string) => {
    if (!content) return null
    
    // 마크다운 이미지 패턴: ![alt](src) - 우선 체크
    const markdownImageMatch = content.match(/!\[[^\]]*\]\(([^)]+)\)/)
    if (markdownImageMatch) {
      return markdownImageMatch[1]
    }
    
    // HTML img 태그 패턴: <img src="...">
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

  return (
    <div className="min-h-screen bg-white">
      {/* 헤더 섹션 */}
      <div className="bg-gradient-accent text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="text-center">
            <h1 className="text-2xl sm:text-4xl font-bold mb-3 sm:mb-4 text-white">Tech 아티클</h1>
            <p className="text-base sm:text-lg max-w-2xl mx-auto text-white opacity-90 px-2">
              최신 IT 트렌드와 기술 인사이트를 담은 아티클들을 만나보세요
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* 검색 및 필터 */}
        <div className="mb-6 sm:mb-8 space-y-4 sm:space-y-6">
          {/* 검색바 */}
          <div className="relative max-w-full sm:max-w-lg mx-auto">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="아티클 제목이나 내용을 검색하세요..."
              className="block w-full pl-12 pr-12 py-3 sm:py-3 bg-white border border-gray-300 rounded-xl shadow-sm text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all duration-200 min-h-[48px] text-base"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors min-w-[44px] min-h-[44px] justify-center"
                aria-label="검색어 지우기"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* 카테고리 필터 */}
          <div className="overflow-x-auto">
            <div className="flex gap-2 sm:gap-3 justify-start sm:justify-center min-w-max px-4 sm:px-0">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex-shrink-0 px-4 sm:px-6 py-2 sm:py-2 rounded-full font-medium transition-colors min-h-[44px] flex items-center justify-center whitespace-nowrap text-sm sm:text-base ${
                    selectedCategory === category.id
                      ? 'bg-blue-500 text-white shadow-lg'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-blue-50 hover:text-blue-600'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 아티클 목록 */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {Array.from({ length: 6 }, (_, i) => (
              <Card key={i} padding="none" className="overflow-hidden animate-pulse">
                <Loading.Skeleton variant="image" />
                <div className="p-6 space-y-3">
                  <div className="flex items-center gap-2">
                    <Loading.Skeleton width="60px" height="24px" />
                    <Loading.Skeleton width="80px" height="20px" />
                  </div>
                  <Loading.Skeleton variant="title" />
                  <Loading.Skeleton variant="text" />
                  <Loading.Skeleton variant="text" width="75%" />
                </div>
              </Card>
            ))}
          </div>
        ) : filteredArticles.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {filteredArticles.map((article) => {
              const firstImage = extractFirstImage(article.content)
              const imageUrl = firstImage || article.featured_image_url
              
              return (
                <Card 
                  key={article.id} 
                  hover={true} 
                  padding="none" 
                  className="overflow-hidden group"
                >
                  <Link href={`/articles/${article.id}`} className="block">
                    <div className="aspect-video bg-neutral-200 overflow-hidden">
                      {imageUrl ? (
                        <SmartImage
                          src={imageUrl}
                          alt={article.title}
                          width={400}
                          height={225}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg className="w-12 h-12 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="p-3 sm:p-6">
                      <div className="flex items-center gap-1 sm:gap-2 mb-2 sm:mb-3 flex-wrap">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {categories.find(cat => cat.id === article.category)?.name || 'Tech'}
                        </span>
                        <span className="text-xs sm:text-sm text-gray-500">{formatDate(article.created_at)}</span>
                        {article.is_featured && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            추천
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors leading-tight">
                        {article.title}
                      </h3>
                      <p className="text-xs sm:text-base text-gray-600 line-clamp-2 sm:line-clamp-3">
                        {article.excerpt || 
                         (article.content ? article.content.replace(/<[^>]*>/g, '').substring(0, 120) + '...' : '아티클 내용 미리보기가 준비 중입니다.')}
                      </p>
                    </div>
                  </Link>
                </Card>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {searchQuery ? '검색 결과가 없습니다' : '등록된 아티클이 없습니다'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchQuery ? '다른 검색어로 시도해보세요' : '곧 새로운 아티클들이 추가될 예정입니다'}
            </p>
            {searchQuery && (
              <Button onClick={() => setSearchQuery('')} variant="outline">
                검색 초기화
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}