'use client'

import { useState, useEffect } from 'react'
import { createSupabaseClient } from '../lib/supabase-client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Loading from '../components/ui/Loading'
import Card from '../components/ui/Card'

export default function AuthorApplicationPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const supabase = createSupabaseClient()

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    book_title: '',
    book_description: '',
    author_bio: '',
    portfolio_url: '',
    experience: '',
    motivation: ''
  })


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // 필수 필드 검증
    if (!formData.name || !formData.email || !formData.phone || 
        !formData.book_title || !formData.book_description || !formData.author_bio) {
      alert('모든 필수 항목을 입력해주세요.')
      return
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      alert('올바른 이메일 형식을 입력해주세요.')
      return
    }

    try {
      setSubmitting(true)

      const applicationData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        book_title: formData.book_title,
        book_description: formData.book_description,
        author_bio: formData.author_bio,
        portfolio_url: formData.portfolio_url || null,
        experience: formData.experience || null,
        motivation: formData.motivation || null,
        status: 'pending',
        created_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('author_applications')
        .insert([applicationData])

      if (error) throw error

      alert('저자 신청이 완료되었습니다!\n담당자가 확인 후 연락드리겠습니다.')
      
      // 폼 초기화
      setFormData({
        name: '',
        email: '',
        phone: '',
        book_title: '',
        book_description: '',
        author_bio: '',
        portfolio_url: '',
        experience: '',
        motivation: ''
      })

    } catch (error: any) {
      console.error('신청 제출 실패:', error)
      alert(`신청 제출 중 오류가 발생했습니다: ${error.message}`)
    } finally {
      setSubmitting(false)
    }
  }


  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 페이지 헤더 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">저자 신청</h1>
          <p className="text-xl text-gray-600">
            골든래빗과 함께 IT 전문서를 출간하고 싶으신가요?
          </p>
        </div>

        {/* 원고 제출 안내 */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
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

        {/* 저자 신청서 */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6 text-gray-900">저자 신청서</h2>
          <p className="text-gray-600 mb-8">
            아래 양식을 작성해주시면 담당자가 검토 후 연락드리겠습니다.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 기본 정보 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  성명 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="홍길동"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  이메일 <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="your.email@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  연락처 <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="010-1234-5678"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  포트폴리오 URL
                </label>
                <input
                  type="url"
                  value={formData.portfolio_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, portfolio_url: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="https://github.com/username"
                />
              </div>
            </div>

            {/* 도서 정보 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                집필 희망 도서 제목 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.book_title}
                onChange={(e) => setFormData(prev => ({ ...prev, book_title: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="예: React로 배우는 현대적 웹 개발"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                도서 개요 및 특징 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.book_description}
                onChange={(e) => setFormData(prev => ({ ...prev, book_description: e.target.value }))}
                rows={5}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="집필하고자 하는 도서의 주요 내용, 독자 대상, 차별화 포인트 등을 자세히 설명해주세요."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                저자 소개 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.author_bio}
                onChange={(e) => setFormData(prev => ({ ...prev, author_bio: e.target.value }))}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="학력, 경력, 전문 분야, 주요 프로젝트 경험 등을 포함해 자기소개를 작성해주세요."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                관련 경험 및 전문성
              </label>
              <textarea
                value={formData.experience}
                onChange={(e) => setFormData(prev => ({ ...prev, experience: e.target.value }))}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="해당 주제와 관련된 실무 경험, 프로젝트, 교육 경험 등을 작성해주세요."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                집필 동기 및 목표
              </label>
              <textarea
                value={formData.motivation}
                onChange={(e) => setFormData(prev => ({ ...prev, motivation: e.target.value }))}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="이 책을 쓰고자 하는 이유와 독자들에게 전달하고자 하는 메시지를 작성해주세요."
              />
            </div>

            <div className="pt-6">
              <Button
                type="submit"
                disabled={submitting}
                className="w-full py-3 text-lg"
              >
                {submitting ? '제출 중...' : '저자 신청서 제출'}
              </Button>
            </div>
          </form>
        </div>

        {/* 연락처 정보 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* 이메일 & 페이스북 */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-bold mb-4 text-gray-900">문의사항</h3>
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
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-bold mb-4 text-gray-900">출판사 위치</h3>
            <p className="text-gray-700 leading-relaxed">
              (우) 04051<br />
              서울 마포구 양화로 186<br />
              LC타워 449호<br />
              <span className="text-sm text-gray-500 mt-2 inline-block">
                전화: 0505-398-0505
              </span>
            </p>
          </div>
        </div>

        {/* 메인으로 돌아가기 */}
        <div className="text-center mt-12">
          <Link 
            href="/"
            className="inline-flex items-center px-6 py-3 text-primary-600 hover:text-primary-700 border border-primary-600 hover:border-primary-700 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            메인 페이지로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  )
}