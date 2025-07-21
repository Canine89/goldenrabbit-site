'use client'

import { useState, useEffect } from 'react'
import { createSupabaseClient } from '../lib/supabase-client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Loading from '../components/ui/Loading'
import Card from '../components/ui/Card'

export default function ProfessorApplicationPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [books, setBooks] = useState<any[]>([])
  const supabase = createSupabaseClient()

  const [formData, setFormData] = useState({
    name: '',
    institution: '',
    institution_url: '',
    position: '',
    phone: '',
    department: '',
    lecture_topics: '',
    interested_books: [] as string[],
    request_type: [] as string[]
  })

  // 도서 목록
  const booksList = [
    '[이게 되네?] 이게 되네 챗GPT 미친 활용법 71제',
    '[Must Have] 코드팩토리의 플러터 프로그래밍(3판)',
    '[되기] 파이썬 데이터 분석가 되기+챗GPT',
    '챗GPT와 함께 배우는 엔트리 마스터하기',
    '[되기] 코딩 테스트 합격자 되기(자바스크립트 편)',
    '[되기] 코딩 테스트 합격자 되기(C++ 편)',
    '[되기] 스프링 부트 3 백엔드 개발자 되기(자바 편)(2판)',
    '[되기] 코딩 테스트 합격자 되기(자바 편)',
    '[Must Have] 코드팩토리의 플러터 프로그래밍(2판)',
    '[되기] 코딩 테스트 합격자 되기(파이썬 편)',
    '[Must Have] 성낙현의 JSP 자바 웹 프로그래밍(2판)',
    '[되기] Node.js 백엔드 개발자 되기',
    '[Must Have] 텐초의 파이토치 딥러닝 특강',
    '[Must Have] 데싸노트의 실전에서 통하는 머신러닝',
    '[Must Have] 코로나보드로 배우는 실전 웹 서비스 개발',
    '[Must Have] 머신러닝·딥러닝 문제해결 전략(세종도서 선정작)',
    '[Must Have] Joyce의 안드로이드 앱 프로그래밍 with 코틀린(세종도서 선정작)',
    '[Must Have] 성낙현의 JSP 자바 웹 프로그래밍',
    '[Must Have] 나성호의 R 데이터 분석 입문',
    '[Must Have] 박미정의 깃&깃허브 입문',
    '[Must Have] 이재환의 자바 프로그래밍 입문',
    '[Must Have] 비전공자를 위한 첫 코딩 챌린지 with HTML&CSS',
    '[Must Have] Tucker의 Go 언어 프로그래밍(세종도서 선정작)'
  ]

  const requestTypes = [
    '관심도서 전자책 증정',
    '관심도서 교안 증정'
  ]

  // 로그인 확인
  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        setUser(null)
        setLoading(false)
        return
      }

      setUser(user)
      setLoading(false)
    } catch (error) {
      console.error('인증 확인 실패:', error)
      setUser(null)
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          scopes: 'openid email profile https://www.googleapis.com/auth/drive'
        }
      })
      
      if (error) {
        console.error('로그인 오류:', error)
        alert('로그인 중 오류가 발생했습니다.')
      }
    } catch (error) {
      console.error('로그인 처리 오류:', error)
      alert('로그인 중 오류가 발생했습니다.')
    }
  }

  const handleBookSelection = (bookTitle: string) => {
    setFormData(prev => ({
      ...prev,
      interested_books: prev.interested_books.includes(bookTitle)
        ? prev.interested_books.filter(book => book !== bookTitle)
        : prev.interested_books.length >= 2 
          ? prev.interested_books  // 2권 초과 선택 방지
          : [...prev.interested_books, bookTitle]
    }))
  }

  const handleRequestTypeSelection = (requestType: string) => {
    setFormData(prev => ({
      ...prev,
      request_type: prev.request_type.includes(requestType)
        ? prev.request_type.filter(type => type !== requestType)
        : [...prev.request_type, requestType]
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // 필수 필드 검증
    if (!formData.name || !formData.institution || !formData.institution_url || 
        !formData.phone || !formData.department || !formData.lecture_topics ||
        formData.interested_books.length === 0 || formData.request_type.length === 0) {
      alert('모든 필수 항목을 입력해주세요.')
      return
    }

    if (formData.interested_books.length > 2) {
      alert('관심 도서는 최대 2권까지 선택 가능합니다.')
      return
    }

    try {
      setSubmitting(true)

      const applicationData = {
        user_id: user.id,
        email: user.email,
        name: formData.name,
        institution: formData.institution,
        institution_url: formData.institution_url,
        position: formData.position,
        phone: formData.phone,
        department: formData.department,
        lecture_topics: formData.lecture_topics,
        interested_books: formData.interested_books,
        request_type: formData.request_type,
        status: 'pending',
        created_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('professor_applications')
        .insert([applicationData])

      if (error) throw error

      alert('교수 회원 등록 신청이 완료되었습니다!\n담당자가 확인 후 업무일 기준 24시간 이내에 처리됩니다.')
      
      // 폼 초기화
      setFormData({
        name: '',
        institution: '',
        institution_url: '',
        position: '',
        phone: '',
        department: '',
        lecture_topics: '',
        interested_books: [],
        request_type: []
      })

    } catch (error: any) {
      console.error('신청 제출 실패:', error)
      alert(`신청 제출 중 오류가 발생했습니다: ${error.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loading size="lg" text="페이지 로딩 중..." />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-6">
            <svg className="w-16 h-16 mx-auto text-primary-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l9-5-9-5-9 5 9 5z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
            </svg>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">교수 회원 등록</h2>
            <p className="text-gray-600">
              교수 회원 등록을 하려면 로그인이 필요합니다.
            </p>
          </div>
          
          <div className="space-y-4">
            <Button 
              onClick={handleGoogleLogin}
              className="w-full"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google로 로그인
            </Button>
            
            <div className="pt-4 border-t border-gray-200">
              <Link href="/" className="text-primary-600 hover:text-primary-700 text-sm">
                ← 메인 페이지로 돌아가기
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
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