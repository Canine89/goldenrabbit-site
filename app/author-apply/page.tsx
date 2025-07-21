'use client'

import Link from 'next/link'

export default function AuthorApplyPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* 헤더 섹션 */}
      <div className="bg-gradient-gold text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-5xl font-bold mb-4">WRITE WITH US</h1>
            <p className="text-xl mb-2">골든래빗에서 저자의 꿈을 키우세요.</p>
            <p className="text-lg opacity-90">당신의 소중한 원고를 기다립니다.</p>
          </div>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* 원고 제출 안내 */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-12">
          <h2 className="text-2xl font-bold mb-6 text-gray-900">원고기획서 제출</h2>
          <div className="prose prose-lg text-gray-700 mb-8">
            <p>
              원고기획서는 사본을 만들고 작성하세요. [공유] 버튼을 누르고 사용자로 
              <span className="font-semibold text-primary-600"> apply@goldenrabbit.co.kr</span>을 
              추가한 다음, 메일을 보내주세요. 궁금한 점은 페이스북 메시지로 문의주시기 바랍니다.
            </p>
          </div>
          
          <div className="flex justify-center">
            <a
              href="https://docs.google.com/document/d/1RCSlGTI4bUUsdvidN2dugXIrcr_2aIzl4LhVxZCvMMA/edit#"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-8 py-4 bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-600 transition-colors shadow-lg text-lg"
            >
              <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              원고 기획서 받기
            </a>
          </div>
        </div>

        {/* 연락처 정보 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* 이메일 & 페이스북 */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-bold mb-4 text-gray-900">Contact</h3>
            <div className="space-y-3">
              <div className="flex items-center text-gray-700">
                <svg className="w-5 h-5 mr-3 text-primary-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                </svg>
                <a href="mailto:apply@goldenrabbit.co.kr" className="hover:text-primary-600 transition-colors">
                  apply@goldenrabbit.co.kr
                </a>
              </div>
              <div className="flex items-center text-gray-700">
                <svg className="w-5 h-5 mr-3 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                <a href="https://facebook.com/goldenrabbit2020" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors">
                  facebook.com/goldenrabbit2020
                </a>
              </div>
            </div>
          </div>

          {/* 위치 정보 */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-bold mb-4 text-gray-900">Our Location</h3>
            <p className="text-gray-700">
              (우) 04051<br />
              서울 마포구 양화로 186<br />
              LC타워 449호
            </p>
          </div>
        </div>

        {/* Connect us */}
        <div className="bg-gray-50 rounded-lg p-6 mt-8">
          <h3 className="text-lg font-bold mb-4 text-gray-900">Connect us</h3>
          <div className="space-y-3 text-gray-700">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span>0505-398-0505</span>
            </div>
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
              </svg>
              <span>0505-537-0505</span>
            </div>
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-3 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
              </svg>
              <a href="mailto:master@goldenrabbit.co.kr" className="hover:text-primary-600 transition-colors">
                master@goldenrabbit.co.kr
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}