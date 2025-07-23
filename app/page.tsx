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
              <a 
                href="https://rabbit.prosell.kr/" 
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-6 py-3 border-2 border-white text-white rounded-lg font-semibold hover:bg-white hover:text-primary-500 transition-colors"
              >
                토끼상점 방문하기
              </a>
            </div>
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