'use client'

import { useState, useEffect } from 'react'
import { createSupabaseClient } from '../lib/supabase-client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Button from '../components/ui/Button'
import Loading from '../components/ui/Loading'

export default function ProfessorPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    university: '',
    department: '',
    course: '',
    book_id: '',
    message: ''
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [books, setBooks] = useState<any[]>([])
  const supabase = createSupabaseClient()

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (user) {
      fetchBooks()
    }
  }, [user])

  const checkAuth = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        setUser(null)
        setCheckingAuth(false)
        return
      }

      // 사용자 프로필 정보도 가져오기
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, full_name, university, department, professor_application_date')
        .eq('id', user.id)
        .single()

      if (!profileError && profile) {
        setUserProfile(profile)
      }

      setUser(user)
      setCheckingAuth(false)
    } catch (error) {
      console.error('인증 확인 실패:', error)
      setUser(null)
      setCheckingAuth(false)
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

  const fetchBooks = async () => {
    try {
      const { data, error } = await supabase
        .from('books')
        .select('id, title, author')
        .eq('is_active', true)
        .order('title')

      if (error) throw error
      setBooks(data || [])
    } catch (error) {
      console.error('도서 조회 실패:', error)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    
    // 전화번호 자동 포매팅
    if (name === 'phone') {
      // 숫자만 추출
      const numbers = value.replace(/[^\d]/g, '')
      
      // 포매팅 적용
      let formatted = ''
      if (numbers.length <= 3) {
        formatted = numbers
      } else if (numbers.length <= 7) {
        formatted = `${numbers.slice(0, 3)}-${numbers.slice(3)}`
      } else if (numbers.length <= 11) {
        formatted = `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`
      } else {
        // 11자리 초과 입력 방지
        return
      }
      
      setFormData({
        ...formData,
        [name]: formatted
      })
    } else {
      setFormData({
        ...formData,
        [name]: value
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    // 전화번호 형식 검증
    const phoneRegex = /^\d{3}-\d{4}-\d{4}$/
    if (!phoneRegex.test(formData.phone)) {
      setError('전화번호는 000-0000-0000 형식으로 입력해주세요.')
      setLoading(false)
      return
    }

    try {
      // 현재 사용자의 프로필 업데이트
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          role: 'professor_pending',
          full_name: formData.name,
          phone: formData.phone,
          university: formData.university,
          department: formData.department,
          course: formData.course,
          professor_book_id: formData.book_id,
          professor_message: formData.message,
          professor_application_date: new Date().toISOString()
        })
        .eq('id', user.id)

      if (profileError) throw profileError

      // professor_applications 테이블에도 기록 (백업/이력 관리용)
      const { error: appError } = await supabase
        .from('professor_applications')
        .insert([{
          ...formData,
          user_id: user.id
        }])

      if (appError) {
        console.error('백업 테이블 저장 실패:', appError)
        // 백업 실패는 무시하고 계속 진행
      }

      setSuccess(true)
      setFormData({
        name: '',
        email: '',
        phone: '',
        university: '',
        department: '',
        course: '',
        book_id: '',
        message: ''
      })
    } catch (err: any) {
      setError(err.message || '신청 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  if (checkingAuth) {
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
            <h2 className="text-2xl font-bold text-gray-900 mb-2">교수회원 등록</h2>
            <p className="text-gray-600">
              교수회원 등록을 하려면 로그인이 필요합니다.
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
    <div className="min-h-screen bg-white">
      {/* 헤더 섹션 */}
      <div className="bg-gradient-gold text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">교수회원 등록</h1>
            <p className="text-xl opacity-90">
              골든래빗 도서 자료를 활용하시려는 분들을 위한 등록 페이지
            </p>
          </div>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* 안내 섹션 */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-12">
          <h2 className="text-2xl font-bold mb-6 text-gray-900">교수회원 혜택</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-blue-50 p-6 rounded-lg">
              <div className="flex items-center mb-3">
                <svg className="w-8 h-8 text-blue-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900">강의교안</h3>
              </div>
              <p className="text-gray-700">
                도서 내용에 맞춘 PPT 강의자료를 무료로 제공합니다.
              </p>
            </div>
            <div className="bg-green-50 p-6 rounded-lg">
              <div className="flex items-center mb-3">
                <svg className="w-8 h-8 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900">소스코드</h3>
              </div>
              <p className="text-gray-700">
                도서의 전체 예제 소스코드를 다운로드하실 수 있습니다.
              </p>
            </div>
            <div className="bg-primary-50 p-6 rounded-lg">
              <div className="flex items-center mb-3">
                <svg className="w-8 h-8 text-primary-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900">도서정보</h3>
              </div>
              <p className="text-gray-700">
                상세한 도서 정보와 목차, 강의 계획서 샘플을 제공합니다.
              </p>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="flex items-center mb-3">
                <svg className="w-8 h-8 text-gray-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900">판권</h3>
              </div>
              <p className="text-gray-700">
                강의용 복사 및 배포에 대한 공식 허가를 받으실 수 있습니다.
              </p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              <strong>안내:</strong> 교수회원 신청 후 관리자 승인을 거쳐 <a href="/professor/resources" className="underline">교수회원 자료실</a>에서 관련 자료를 다운로드하실 수 있습니다.
            </p>
          </div>
        </div>

        {/* 신청 폼 */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h2 className="text-2xl font-bold mb-6 text-gray-900">교수회원 신청</h2>
          
          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800">
                교수회원 신청이 완료되었습니다. 관리자 승인 후 <a href="/professor/resources" className="underline">교수회원 자료실</a>에서 자료를 다운로드하실 수 있습니다.
              </p>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* 교수회원 대기 상태 메시지 */}
          {userProfile?.role === 'professor_pending' && (
            <div className="mb-6 p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center mb-4">
                <svg className="w-8 h-8 text-yellow-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-lg font-semibold text-yellow-800">교수회원 승인 대기 중</h3>
              </div>
              <div className="space-y-2 text-sm text-yellow-700">
                <p><strong>신청자:</strong> {userProfile.full_name || '정보 없음'}</p>
                <p><strong>소속:</strong> {userProfile.university} {userProfile.department && `- ${userProfile.department}`}</p>
                {userProfile.professor_application_date && (
                  <p><strong>신청일:</strong> {new Date(userProfile.professor_application_date).toLocaleDateString('ko-KR')}</p>
                )}
                <div className="mt-4 p-4 bg-yellow-100 rounded-lg">
                  <p className="text-yellow-800 font-medium">
                    교수회원 신청이 접수되었습니다. 관리자 승인 후 교수회원 자료실을 이용하실 수 있습니다.
                  </p>
                  <p className="text-yellow-700 text-xs mt-2">
                    승인 관련 문의: <a href="mailto:master@goldenrabbit.co.kr" className="underline">master@goldenrabbit.co.kr</a>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 이미 교수인 경우 메시지 */}
          {userProfile?.role === 'professor' && (
            <div className="mb-6 p-6 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center mb-4">
                <svg className="w-8 h-8 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-lg font-semibold text-green-800">교수회원 승인 완료</h3>
              </div>
              <div className="space-y-2 text-sm text-green-700">
                <p><strong>승인된 교수:</strong> {userProfile.full_name || '정보 없음'}</p>
                <p><strong>소속:</strong> {userProfile.university} {userProfile.department && `- ${userProfile.department}`}</p>
                <div className="mt-4 p-4 bg-green-100 rounded-lg">
                  <p className="text-green-800 font-medium">
                    교수회원으로 승인되었습니다. 이제 <a href="/professor/resources" className="underline font-semibold">교수회원 자료실</a>에서 자료를 다운로드하실 수 있습니다.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 신청 폼은 일반 사용자나 관리자에게만 표시 */}
          {(!userProfile?.role || userProfile?.role === 'user' || userProfile?.role === 'admin') && (
            <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  성명 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  이메일 <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  연락처 <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  placeholder="010-0000-0000"
                  pattern="\d{3}-\d{4}-\d{4}"
                  title="전화번호는 000-0000-0000 형식으로 입력해주세요"
                  maxLength={13}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                <p className="mt-1 text-xs text-gray-500">숫자만 입력하시면 자동으로 하이픈(-)이 추가됩니다.</p>
              </div>
              <div>
                <label htmlFor="university" className="block text-sm font-medium text-gray-700 mb-2">
                  학교명 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="university"
                  name="university"
                  value={formData.university}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-2">
                  학과 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="department"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label htmlFor="course" className="block text-sm font-medium text-gray-700 mb-2">
                  강의과목
                </label>
                <input
                  type="text"
                  id="course"
                  name="course"
                  value={formData.course}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="book_id" className="block text-sm font-medium text-gray-700 mb-2">
                사용 예정 도서 <span className="text-red-500">*</span>
              </label>
              <select
                id="book_id"
                name="book_id"
                value={formData.book_id}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">도서를 선택해주세요</option>
                {books.map((book) => (
                  <option key={book.id} value={book.id}>
                    {book.title} - {book.author}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                기타 문의사항
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div className="flex justify-center">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={loading}
                disabled={loading}
              >
                교수회원 신청하기
              </Button>
            </div>
          </form>
          )}
        </div>

        {/* 문의 정보 */}
        {/* 삭제: <div className="mt-12 text-center text-gray-600"> ... </div> */}
      </div>
    </div>
  )
}