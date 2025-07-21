'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createSupabaseClient } from '../lib/supabase-client'
import SmartImage from './SmartImage'
import Card from './ui/Card'
import Loading from './ui/Loading'

interface Article {
  id: string
  title: string
  content?: string
  excerpt?: string
  featured_image_url?: string
  is_featured: boolean
  is_published: boolean
  created_at: string
}

export default function LatestArticles() {
  const [latestArticles, setLatestArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createSupabaseClient()

  useEffect(() => {
    fetchLatestArticles()
  }, [])

  const fetchLatestArticles = async () => {
    try {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(3)

      if (error) throw error
      setLatestArticles(data || [])
    } catch (error) {
      console.error('최신 아티클 조회 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }

  // 글 내용에서 첫 번째 이미지 URL 추출
  const extractFirstImage = (content?: string) => {
    if (!content) return null
    
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
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-12 gap-4">
          <div>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              최신 Tech 아티클
            </h2>
            <p className="text-lg text-gray-600">
              IT 트렌드와 기술 인사이트를 담은 최신 글들
            </p>
          </div>
          <Link
            href="/articles"
            className="inline-flex items-center px-6 py-3 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors shadow-lg hover:shadow-xl"
          >
            전체보기
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {loading ? (
            // 로딩 상태
            Array.from({ length: 3 }, (_, i) => (
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
            ))
          ) : latestArticles.length > 0 ? (
            latestArticles.map((article) => {
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
                    <div className="aspect-video bg-gray-200 overflow-hidden">
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
                          <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="p-6">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Tech
                        </span>
                        <span className="text-sm text-gray-500">{formatDate(article.created_at)}</span>
                        {article.is_featured && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            추천
                          </span>
                        )}
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors">
                        {article.title}
                      </h3>
                      <p className="text-gray-600 line-clamp-3">
                        {article.excerpt || 
                         (article.content ? article.content.replace(/<[^>]*>/g, '').substring(0, 120) + '...' : '아티클 내용 미리보기가 준비 중입니다.')}
                      </p>
                    </div>
                  </Link>
                </Card>
              )
            })
          ) : (
            // 아티클이 없을 때 더미 카드들
            [1, 2, 3].map((i) => (
              <Card key={i} hover={false} padding="none" className="overflow-hidden">
                <div className="aspect-video bg-gray-100 flex items-center justify-center">
                  <div className="text-center">
                    <svg className="w-12 h-12 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="text-gray-500 text-sm">아티클 준비 중</span>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                      준비중
                    </span>
                    <span className="text-sm text-gray-400">-</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-400 mb-3">
                    곧 흥미로운 아티클을 만나보실 수 있습니다
                  </h3>
                  <p className="text-gray-400">
                    최신 IT 트렌드와 기술 인사이트를 담은 글들이 준비 중입니다.
                  </p>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </section>
  )
}