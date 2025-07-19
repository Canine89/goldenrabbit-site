import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import SmartImage from '../components/common/SmartImage'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Section from '../components/ui/Section'
import Container from '../components/ui/Container'

export default function Home() {
  const [featuredBooks, setFeaturedBooks] = useState([])
  const [latestArticles, setLatestArticles] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFeaturedBooks()
    fetchLatestArticles()
  }, [])

  const fetchFeaturedBooks = async () => {
    try {
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .eq('is_active', true)
        .eq('is_featured', true)
        .order('created_at', { ascending: false })
        .limit(4)

      if (error) throw error
      setFeaturedBooks(data || [])
    } catch (error) {
      console.error('추천 도서 조회 실패:', error)
    } finally {
      setLoading(false)
    }
  }

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
    }
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('ko-KR').format(price)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }

  // 글 내용에서 첫 번째 이미지 URL 추출
  const extractFirstImage = (content) => {
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

  // 카테고리 바로가기
  const categories = [
    { name: '경제경영', href: '/books/economy', icon: '📈', variant: 'info', description: '비즈니스 성공 전략' },
    { name: 'IT전문서', href: '/books/it-professional', icon: '💻', variant: 'success', description: '개발자 전문서적' },
    { name: 'IT활용서', href: '/books/it-practical', icon: '🔧', variant: 'primary', description: '실무 활용 가이드' },
    { name: '학습만화', href: '/books/comic', icon: '📚', variant: 'warning', description: '쉽고 재미있게' },
    { name: '좋은여름', href: '/books/good-summer', icon: '🌞', variant: 'secondary', description: '여름 특별 기획' },
    { name: '수상작품', href: '/books/award', icon: '🏆', variant: 'danger', description: '검증된 우수작' },
  ]

  return (
    <div className="bg-neutral-50">
      {/* 히어로 섹션 */}
      <Section background="gradient" padding="xl" className="relative overflow-hidden">
        {/* 배경 그라디언트 */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600/10 to-transparent"></div>
        
        {/* 메인 콘텐츠 */}
        <div className="text-center animate-fade-in relative z-10">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 text-white drop-shadow-lg">
            골든래빗
          </h1>
          <p className="text-xl md:text-2xl lg:text-3xl mb-8 opacity-90 max-w-4xl mx-auto leading-relaxed">
            IT 전문서와 실용서로 더 나은 세상을 만들어가는 출판사
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-md mx-auto">
            <Button 
              as={Link} 
              to="/books" 
              variant="secondary" 
              size="lg"
              className="w-full sm:w-auto shadow-lg hover:shadow-xl"
            >
              도서 둘러보기
            </Button>
            <Button 
              as={Link} 
              to="/rabbit-store" 
              variant="outline" 
              size="lg"
              className="w-full sm:w-auto border-2 border-white text-white hover:bg-white hover:text-primary-600 shadow-lg font-semibold"
            >
              토끼상점 방문하기
            </Button>
          </div>
        </div>
      </Section>

      {/* 카테고리 바로가기 */}
      <Section background="white" padding="default">
        <Section.Header 
          title="카테고리별 도서"
          description="다양한 분야의 전문서와 실용서를 만나보세요"
        />
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <Card 
              key={category.name}
              variant="default"
              hover={true}
              className="text-center group cursor-pointer border-0 shadow-sm hover:shadow-md"
              as={Link}
              to={category.href}
            >
              <div className="text-5xl mb-4 group-hover:scale-105 transition-transform duration-200">
                {category.icon}
              </div>
              <Card.Title className="mb-2 group-hover:text-primary-500 transition-colors">
                {category.name}
              </Card.Title>
              <Card.Description className="mb-4 text-sm">
                {category.description}
              </Card.Description>
              <Badge variant={category.variant} size="md">
                둘러보기
              </Badge>
            </Card>
          ))}
        </div>
      </Section>

      {/* 추천 도서 섹션 */}
      <Section background="neutral" padding="default">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-12 gap-4">
          <div>
            <h2 className="text-3xl lg:text-4xl font-bold text-neutral-900 mb-4">
              추천 도서
            </h2>
            <p className="text-lg text-neutral-600">
              골든래빗에서 엄선한 베스트셀러와 신간들
            </p>
          </div>
          <Button
            as={Link}
            to="/books"
            variant="ghost"
            size="lg"
            className="shrink-0"
          >
            전체보기
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {loading ? (
            // 로딩 스켈레톤
            Array.from({ length: 4 }, (_, i) => (
              <Card key={i} padding="none" className="overflow-visible animate-pulse-subtle">
                <div className="p-4 pb-0">
                  <div className="aspect-[3/4] bg-neutral-200 animate-pulse rounded-lg"></div>
                </div>
                <Card.Content className="space-y-3">
                  <div className="h-4 bg-neutral-200 rounded animate-pulse"></div>
                  <div className="h-3 bg-neutral-200 rounded w-3/4 animate-pulse"></div>
                  <div className="h-4 bg-neutral-200 rounded w-1/2 animate-pulse"></div>
                </Card.Content>
              </Card>
            ))
          ) : featuredBooks.length > 0 ? (
            // 실제 추천 도서들
            featuredBooks.map((book) => (
              <Card
                key={book.id}
                as={Link}
                to={`/books/detail/${book.id}`}
                hover={true}
                padding="none"
                className="overflow-visible group"
              >
                <div className="p-4 pb-0">
                  <div className="aspect-[3/4] bg-neutral-100 relative overflow-hidden rounded-lg shadow-sm group-hover:shadow-md transition-all duration-300">
                    <SmartImage
                      src={book.cover_image_url}
                      alt={book.title}
                      className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                      fallback={
                        <div className="w-full h-full bg-neutral-100 flex items-center justify-center p-8">
                          <svg className="w-12 h-12 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                        </div>
                      }
                    />
                    {book.is_featured && (
                      <Badge 
                        variant="secondary" 
                        className="absolute top-3 right-3 shadow-sm"
                      >
                        추천
                      </Badge>
                    )}
                  </div>
                </div>
                <Card.Content>
                  <Card.Title className="mb-2 line-clamp-2 group-hover:text-primary-500 transition-colors">
                    {book.title}
                  </Card.Title>
                  <Card.Description className="text-sm mb-2">
                    {book.author}
                  </Card.Description>
                  <p className="text-primary-500 font-bold text-lg">
                    {formatPrice(book.price)}원
                  </p>
                </Card.Content>
              </Card>
            ))
          ) : (
            // 추천 도서가 없을 때 임시 카드들
            Array.from({ length: 4 }, (_, i) => (
              <Card key={i} padding="none" className="overflow-visible">
                <div className="p-4 pb-0">
                  <div className="aspect-[3/4] bg-neutral-100 rounded-lg flex items-center justify-center">
                    <span className="text-neutral-500">준비 중</span>
                  </div>
                </div>
                <Card.Content>
                  <Card.Title className="mb-2">준비 중인 도서</Card.Title>
                  <Card.Description className="text-sm mb-2">곧 만나요!</Card.Description>
                  <p className="text-primary-500 font-bold text-lg">-</p>
                </Card.Content>
              </Card>
            ))
          )}
        </div>
      </Section>

      {/* 최신 아티클 섹션 */}
      <Section background="white" padding="default">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-12 gap-4">
          <div>
            <h2 className="text-3xl lg:text-4xl font-bold text-neutral-900 mb-4">
              최신 Tech 아티클
            </h2>
            <p className="text-lg text-neutral-600">
              IT 트렌드와 기술 인사이트를 담은 최신 글들
            </p>
          </div>
          <Button
            as={Link}
            to="/articles"
            variant="ghost"
            size="lg"
            className="shrink-0"
          >
            전체보기
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {latestArticles.length > 0 ? (
            latestArticles.map((article) => {
              const firstImage = extractFirstImage(article.content)
              const imageUrl = firstImage || article.featured_image_url
              
              return (
                <Card 
                  key={article.id} 
                  as={Link} 
                  to={`/articles/${article.id}`}
                  hover={true} 
                  padding="none" 
                  className="overflow-hidden group"
                >
                  <div className="aspect-video bg-neutral-200 overflow-hidden">
                    {imageUrl ? (
                      <SmartImage
                        src={imageUrl}
                        alt={article.title}
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
                  <Card.Content>
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="primary" size="sm">Tech</Badge>
                      <span className="text-sm text-neutral-500">{formatDate(article.created_at)}</span>
                      {article.is_featured && (
                        <Badge variant="secondary" size="sm">추천</Badge>
                      )}
                    </div>
                    <Card.Title className="mb-3 line-clamp-2 group-hover:text-primary-500 transition-colors">
                      {article.title}
                    </Card.Title>
                    <Card.Description className="line-clamp-3">
                      {article.excerpt || 
                       (article.content ? article.content.replace(/<[^>]*>/g, '').substring(0, 120) + '...' : '아티클 내용 미리보기가 준비 중입니다.')}
                    </Card.Description>
                  </Card.Content>
                </Card>
              )
            })
          ) : (
            // 아티클이 없을 때 더미 카드들
            [1, 2, 3].map((i) => (
              <Card key={i} hover={false} padding="none" className="overflow-hidden">
                <div className="aspect-video bg-neutral-100 flex items-center justify-center">
                  <div className="text-center">
                    <svg className="w-12 h-12 mx-auto text-neutral-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="text-neutral-500 text-sm">아티클 준비 중</span>
                  </div>
                </div>
                <Card.Content>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="neutral" size="sm">준비중</Badge>
                    <span className="text-sm text-neutral-400">-</span>
                  </div>
                  <Card.Title className="mb-3 text-neutral-400">
                    곧 흥미로운 아티클을 만나보실 수 있습니다
                  </Card.Title>
                  <Card.Description className="text-neutral-400">
                    최신 IT 트렌드와 기술 인사이트를 담은 글들이 준비 중입니다.
                  </Card.Description>
                </Card.Content>
              </Card>
            ))
          )}
        </div>
      </Section>

      {/* CTA 섹션 */}
      <Section background="primary" padding="default">
        <div className="text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-6">
            골든래빗과 함께 성장하세요
          </h2>
          <p className="text-xl lg:text-2xl mb-8 opacity-90 max-w-3xl mx-auto">
            저자 신청부터 교수회원까지, 다양한 방법으로 참여할 수 있습니다
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-md mx-auto">
            <Button
              as={Link}
              to="/author-apply"
              variant="secondary"
              size="lg"
              className="w-full sm:w-auto shadow-lg hover:shadow-xl"
            >
              저자 신청하기
            </Button>
            <Button
              as={Link}
              to="/professor"
              variant="outline"
              size="lg"
              className="w-full sm:w-auto border-2 border-white text-white hover:bg-white hover:text-primary-600 shadow-lg font-semibold"
            >
              교수회원 가입
            </Button>
          </div>
        </div>
      </Section>
    </div>
  )
}