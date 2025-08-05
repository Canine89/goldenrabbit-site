export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 히어로 섹션 */}
      <div className="bg-gradient-gold text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-5xl lg:text-6xl font-bold mb-6 text-white">골든래빗 소개</h1>
            <p className="text-xl lg:text-2xl opacity-95 max-w-3xl mx-auto text-white leading-relaxed">
              IT 전문서와 실용서로 더 나은 세상을 만들어가는 출판사
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* 회사 미션 */}
        <section className="mb-16">
          <div className="bg-white rounded-xl shadow-lg p-10 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">우리의 미션</h2>
            <div className="prose prose-lg max-w-none text-gray-700">
              <p className="mb-4 leading-relaxed">
                골든래빗은 IT 전문서와 실용서를 통해 독자들의 성장과 발전에 기여하는 출판사입니다.
                복잡한 기술과 지식을 쉽고 명확하게 전달하여, 모든 사람이 IT 기술의 혜택을 누릴 수 있도록 돕습니다.
              </p>
              <p className="mb-4 leading-relaxed">
                우리는 단순히 책을 출간하는 것을 넘어서, 독자와 저자, 그리고 업계 전문가들이 함께 성장할 수 있는 
                플랫폼을 만들어가고 있습니다.
              </p>
            </div>
          </div>
        </section>

        {/* 도서 시리즈 */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-10 text-center">주요 도서 시리즈</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                title: 'IT 전문서',
                description: '개발자와 IT 전문가를 위한 깊이 있는 기술서',
                icon: '💻',
                color: 'bg-blue-50 border-blue-200'
              },
              {
                title: 'IT 활용서',
                description: '일반인도 쉽게 따라할 수 있는 실무 활용 가이드',
                icon: '🔧',
                color: 'bg-green-50 border-green-200'
              },
              {
                title: '경제경영',
                description: '비즈니스 성공을 위한 전략과 인사이트',
                icon: '📈',
                color: 'bg-primary-50 border-primary-200'
              },
              {
                title: '학습만화',
                description: '복잡한 개념을 쉽고 재미있게 설명하는 만화 시리즈',
                icon: '📚',
                color: 'bg-purple-50 border-purple-200'
              }
            ].map((series) => (
              <div key={series.title} className={`${series.color} border rounded-xl p-8 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1`}>
                <div className="text-5xl mb-4">{series.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{series.title}</h3>
                <p className="text-gray-700 leading-relaxed">{series.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 주요 성과 */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-10 text-center">주요 성과</h2>
          <div className="bg-gradient-gold rounded-xl shadow-xl p-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div className="transform hover:scale-105 transition-transform duration-300">
                <div className="text-5xl font-bold text-white mb-3">100+</div>
                <div className="text-xl text-white opacity-90">출간 도서</div>
              </div>
              <div className="transform hover:scale-105 transition-transform duration-300">
                <div className="text-5xl font-bold text-white mb-3">50+</div>
                <div className="text-xl text-white opacity-90">저자진</div>
              </div>
              <div className="transform hover:scale-105 transition-transform duration-300">
                <div className="text-5xl font-bold text-white mb-3">10만+</div>
                <div className="text-xl text-white opacity-90">독자</div>
              </div>
            </div>
          </div>
        </section>

        {/* 연혁 */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-10 text-center">연혁</h2>
          <div className="bg-white rounded-xl shadow-lg p-10 border border-gray-100">
            <div className="space-y-8">
              {[
                { year: '2020', event: '골든래빗 출판사 설립', highlight: true },
                { year: '2021', event: 'IT 전문서 시리즈 출간 시작' },
                { year: '2022', event: '학습만화 시리즈 런칭' },
                { year: '2023', event: '토끼상점 오픈, 온라인 플랫폼 구축' },
                { year: '2024', event: '교수회원 제도 도입, 저자 지원 프로그램 확대', highlight: true },
              ].map((item) => (
                <div key={item.year} className="flex items-start group hover:bg-gray-50 p-4 rounded-lg transition-colors duration-200">
                  <div className={`flex-shrink-0 w-24 text-xl font-bold ${item.highlight ? 'text-primary-600' : 'text-gray-700'}`}>
                    {item.year}
                  </div>
                  <div className="text-gray-700 text-lg leading-relaxed pl-4 border-l-2 border-gray-200 group-hover:border-primary-400 transition-colors duration-200">
                    {item.event}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 연락처 */}
        <section>
          <h2 className="text-3xl font-bold text-gray-900 mb-10 text-center">연락처</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 일반 문의 */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <span className="text-xl mr-2">📞</span> 일반 문의
              </h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="font-medium text-gray-600 mb-1">이메일</p>
                  <a href="mailto:master@goldenrabbit.co.kr" className="text-blue-600 hover:underline break-all">
                    master@goldenrabbit.co.kr
                  </a>
                </div>
                <div>
                  <p className="font-medium text-gray-600 mb-1">전화</p>
                  <p className="text-gray-700">0505-398-0505</p>
                </div>
                <div>
                  <p className="font-medium text-gray-600 mb-1">팩스</p>
                  <p className="text-gray-700">0505-537-0505</p>
                </div>
              </div>
            </div>
            
            {/* 저자 문의 */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <span className="text-xl mr-2">✍️</span> 저자 문의
              </h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="font-medium text-gray-600 mb-1">원고 제출</p>
                  <a href="mailto:apply@goldenrabbit.co.kr" className="text-green-600 hover:underline break-all">
                    apply@goldenrabbit.co.kr
                  </a>
                </div>
                <div>
                  <p className="font-medium text-gray-600 mb-1">페이스북</p>
                  <a href="https://facebook.com/goldenrabbit2020" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">
                    @goldenrabbit2020
                  </a>
                </div>
              </div>
            </div>
            
            {/* 위치 정보 */}
            <div className="bg-primary-50 border border-primary-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <span className="text-xl mr-2">📍</span> 오시는 길
              </h3>
              <div className="space-y-1 text-sm text-gray-700">
                <p className="font-medium text-gray-900 mb-2">골든래빗 사무실</p>
                <p>(우) 04051</p>
                <p>서울 마포구 양화로 186</p>
                <p>LC타워 449호</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}