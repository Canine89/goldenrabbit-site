import Link from 'next/link'
import FeaturedBooks from './components/FeaturedBooks'
import LatestArticles from './components/LatestArticles'

export default function Home() {
  return (
    <div className="bg-white">
      {/* 히어로 섹션 */}
      <section className="relative overflow-hidden bg-gradient-gold text-white py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 text-white">골든래빗</h1>
            <p className="text-xl md:text-2xl lg:text-3xl mb-8 opacity-90 max-w-4xl mx-auto leading-relaxed text-white">
              IT 전문서와 실용서로 더 나은 세상을 만들어가는 출판사
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-md mx-auto">
              <Link 
                href="/books" 
                className="w-full sm:w-auto px-6 py-3 bg-white text-primary-500 rounded-lg font-semibold hover:bg-primary-100 hover:text-primary-600 transition-colors shadow-lg"
              >
                도서 둘러보기
              </Link>
              <Link 
                href="/rabbit-store" 
                className="w-full sm:w-auto px-6 py-3 border-2 border-white text-white rounded-lg font-semibold hover:bg-white hover:text-primary-500 transition-colors"
              >
                토끼상점 방문하기
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 카테고리 섹션 */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              카테고리별 도서
            </h2>
            <p className="text-lg text-gray-600">
              다양한 분야의 전문서와 실용서를 만나보세요
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { name: '경제경영', href: '/books/economy', icon: '📈', description: '비즈니스 성공 전략' },
              { name: 'IT전문서', href: '/books/it-professional', icon: '💻', description: '개발자 전문서적' },
              { name: 'IT활용서', href: '/books/it-practical', icon: '🔧', description: '실무 활용 가이드' },
              { name: '학습만화', href: '/books/comic', icon: '📚', description: '쉽고 재미있게' },
              { name: '좋은여름', href: '/books/good-summer', icon: '🌞', description: '여름 특별 기획' },
              { name: '수상작품', href: '/books/award', icon: '🏆', description: '검증된 우수작' },
            ].map((category) => (
              <Link
                key={category.name}
                href={category.href}
                className="group p-6 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-200 text-center"
              >
                <div className="text-5xl mb-4 group-hover:scale-105 transition-transform duration-200">
                  {category.icon}
                </div>
                <h3 className="text-xl font-bold mb-2 group-hover:text-blue-600 transition-colors">
                  {category.name}
                </h3>
                <p className="text-gray-600 text-sm">
                  {category.description}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 추천 도서 섹션 */}
      <FeaturedBooks />

      {/* 최신 아티클 섹션 */}
      <LatestArticles />

      {/* CTA 섹션 */}
      <section className="py-16 bg-gradient-accent text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl lg:text-4xl font-bold mb-6">
              골든래빗과 함께 성장하세요
            </h2>
            <p className="text-xl lg:text-2xl mb-8 opacity-90 max-w-3xl mx-auto">
              저자 신청부터 교수회원까지, 다양한 방법으로 참여할 수 있습니다
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-md mx-auto">
              <Link
                href="/author-apply"
                className="w-full sm:w-auto px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors shadow-lg"
              >
                저자 신청하기
              </Link>
              <Link
                href="/professor"
                className="w-full sm:w-auto px-6 py-3 border-2 border-white text-white rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
              >
                교수회원 가입
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}