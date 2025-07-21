export default function AboutPage() {
  return (
    <div className="min-h-screen bg-black">
      {/* 히어로 섹션 */}
      <div className="bg-gradient-to-r from-primary-500 to-white text-primary-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4 text-primary-500">골든래빗 소개</h1>
            <p className="text-xl opacity-90 max-w-2xl mx-auto text-primary-500">
              IT 전문서와 실용서로 더 나은 세상을 만들어가는 출판사
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* 회사 미션 */}
        <section className="mb-16">
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-primary-500 mb-6">우리의 미션</h2>
            <div className="prose prose-lg max-w-none text-black">
              <p className="mb-4">
                골든래빗은 IT 전문서와 실용서를 통해 독자들의 성장과 발전에 기여하는 출판사입니다.
                복잡한 기술과 지식을 쉽고 명확하게 전달하여, 모든 사람이 IT 기술의 혜택을 누릴 수 있도록 돕습니다.
              </p>
              <p className="mb-4">
                우리는 단순히 책을 출간하는 것을 넘어서, 독자와 저자, 그리고 업계 전문가들이 함께 성장할 수 있는 
                플랫폼을 만들어가고 있습니다.
              </p>
            </div>
          </div>
        </section>

        {/* 도서 시리즈 */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">주요 도서 시리즈</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                title: 'IT 전문서',
                description: '개발자와 IT 전문가를 위한 깊이 있는 기술서',
                icon: '💻'
              },
              {
                title: 'IT 활용서',
                description: '일반인도 쉽게 따라할 수 있는 실무 활용 가이드',
                icon: '🔧'
              },
              {
                title: '경제경영',
                description: '비즈니스 성공을 위한 전략과 인사이트',
                icon: '📈'
              },
              {
                title: '학습만화',
                description: '복잡한 개념을 쉽고 재미있게 설명하는 만화 시리즈',
                icon: '📚'
              }
            ].map((series, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm p-6">
                <div className="text-3xl mb-3">{series.icon}</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{series.title}</h3>
                <p className="text-gray-600">{series.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 주요 성과 */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">주요 성과</h2>
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-3xl font-bold text-primary-600 mb-2">100+</div>
                <div className="text-gray-600">출간 도서</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary-600 mb-2">50+</div>
                <div className="text-gray-600">저자진</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary-600 mb-2">10만+</div>
                <div className="text-gray-600">독자</div>
              </div>
            </div>
          </div>
        </section>

        {/* 연혁 */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">연혁</h2>
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="space-y-8">
              {[
                { year: '2020', event: '골든래빗 출판사 설립' },
                { year: '2021', event: 'IT 전문서 시리즈 출간 시작' },
                { year: '2022', event: '학습만화 시리즈 런칭' },
                { year: '2023', event: '토끼상점 오픈, 온라인 플랫폼 구축' },
                { year: '2024', event: '교수회원 제도 도입, 저자 지원 프로그램 확대' },
              ].map((item, index) => (
                <div key={index} className="flex items-start">
                  <div className="flex-shrink-0 w-20 text-lg font-bold text-primary-600">
                    {item.year}
                  </div>
                  <div className="text-gray-700">{item.event}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 연락처 */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-8">연락처</h2>
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">일반 문의</h3>
                <div className="space-y-2 text-gray-600">
                  <p>📧 info@goldenrabbit.co.kr</p>
                  <p>📞 02-1234-5678</p>
                  <p>📍 서울특별시 강남구 테헤란로 123</p>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">저자 문의</h3>
                <div className="space-y-2 text-gray-600">
                  <p>📧 author@goldenrabbit.co.kr</p>
                  <p>📞 02-1234-5679</p>
                  <p>💼 월-금 09:00-18:00</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}