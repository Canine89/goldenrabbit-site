'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeSanitize from 'rehype-sanitize'
import { createSupabaseClient } from '../../lib/supabase-client'
import SmartImage from '../../components/SmartImage'
import Loading from '../../components/ui/Loading'
import Button from '../../components/ui/Button'

interface Book {
  id: string
  title: string
  author: string
  author_bio?: string
  price: number
  cover_image_url?: string
  category: string
  isbn?: string
  page_count?: number
  size?: string
  publication_date?: string
  table_of_contents?: string
  description?: string
  publisher_review?: string
  testimonials?: string
  errata_link?: string
  error_report_link?: string
  is_featured: boolean
  is_active: boolean
  created_at: string
}

interface OnlineStore {
  yes24_url?: string
  kyobo_url?: string
  aladin_url?: string
  ridibooks_url?: string
}

export default function BookDetailPage() {
  const params = useParams()
  const [book, setBook] = useState<Book | null>(null)
  const [onlineStores, setOnlineStores] = useState<OnlineStore>({})
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('info')
  const supabase = createSupabaseClient()

  useEffect(() => {
    if (params?.id) {
      fetchBook(params.id as string)
    }
  }, [params?.id])

  const fetchBook = async (bookId: string) => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .eq('id', bookId)
        .eq('is_active', true)
        .single()

      if (error) throw error
      
      setBook(data)
      
      // 온라인 서점 링크 조회 - 임시로 비활성화 (테이블이 아직 생성되지 않음)
      // TODO: 나중에 online_bookstore_links 테이블 생성 후 활성화
      /*
      try {
        const { data: storeData, error: storeError } = await supabase
          .from('online_bookstore_links')
          .select('*')
          .eq('book_id', bookId)
          .single()
        
        if (storeData && !storeError) {
          setOnlineStores(storeData)
        }
      } catch (storeError) {
      }
      */
    } catch (error) {
      console.error('도서 조회 실패:', error instanceof Error ? error.message : '알 수 없는 오류')
    } finally {
      setLoading(false)
    }
  }


  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR').format(price)
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // Enter로 입력된 줄바꿈을 JSX로 처리하는 함수
  const formatTextWithBreaks = (text: string) => {
    if (!text) return text
    return text.split('\n').map((line, index, array) => (
      <React.Fragment key={index}>
        {line}
        {index < array.length - 1 && <br />}
      </React.Fragment>
    ))
  }

  // 마크다운 텍스트에서 줄바꿈을 처리하는 함수
  const preprocessMarkdownForLineBreaks = (content: string) => {
    // 1. 먼저 2개 이상의 연속 줄바꿈을 1개로 정규화
    // 2. 그 다음 모든 줄바꿈을 마크다운 hard break로 변환
    return content
      .replace(/\n{2,}/g, '\n')  // 2개 이상 연속 줄바꿈을 1개로
      .replace(/\n/g, '  \n')    // 모든 줄바꿈을 hard break로
  }

  // 마크다운과 일반 텍스트를 모두 처리하는 함수
  const renderContent = (content: string, isMarkdown: boolean = true) => {
    if (!content) return null
    
    if (isMarkdown) {
      // 마크다운 전처리: 단일 줄바꿈을 hard break로 변환
      const processedContent = preprocessMarkdownForLineBreaks(content)
      
      return (
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeSanitize]}
          components={{
            p: ({ children }) => <p className="mb-2 leading-normal text-gray-700">{children}</p>,
            h1: ({ children }) => (
              <h1 className="text-3xl font-bold mb-4 mt-6 text-gray-900 border-b-2 border-primary-200 pb-2">
                {children}
              </h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-2xl font-bold mb-3 mt-5 text-gray-900 border-b border-gray-200 pb-1">
                {children}
              </h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-xl font-semibold mb-2 mt-4 text-gray-800">
                {children}
              </h3>
            ),
            h4: ({ children }) => (
              <h4 className="text-lg font-semibold mb-2 mt-3 text-gray-800">
                {children}
              </h4>
            ),
            ul: ({ children }) => (
              <ul className="list-disc ml-8 mb-4 space-y-1 pl-4">
                {children}
              </ul>
            ),
            ol: ({ children }) => (
              <ol className="list-decimal ml-8 mb-4 space-y-1 pl-4">
                {children}
              </ol>
            ),
            li: ({ children }) => (
              <li className="leading-normal text-gray-700 ml-4">
                {children}
              </li>
            ),
            blockquote: ({ children }) => (
              <blockquote className="border-l-4 border-yellow-400 bg-yellow-50 pl-6 pr-4 py-3 italic my-4 rounded-r-lg">
                <div className="text-yellow-800">
                  {children}
                </div>
              </blockquote>
            ),
            code: ({ children }) => (
              <code className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm font-mono border">
                {children}
              </code>
            ),
            pre: ({ children }) => (
              <pre className="bg-gray-900 text-gray-100 p-6 rounded-lg overflow-x-auto mb-4 border shadow-lg">
                <code className="text-sm font-mono leading-normal">
                  {children}
                </code>
              </pre>
            ),
            strong: ({ children }) => (
              <strong className="font-bold text-gray-900">
                {children}
              </strong>
            ),
            em: ({ children }) => (
              <em className="italic text-gray-700">
                {children}
              </em>
            ),
            br: () => <br className="block" />,
            table: ({ children }) => (
              <div className="overflow-x-auto my-4">
                <table className="min-w-full border-collapse border border-gray-300 bg-white rounded-lg shadow-sm">
                  {children}
                </table>
              </div>
            ),
            thead: ({ children }) => (
              <thead className="bg-gray-50">
                {children}
              </thead>
            ),
            tbody: ({ children }) => (
              <tbody className="divide-y divide-gray-200">
                {children}
              </tbody>
            ),
            tr: ({ children }) => (
              <tr className="hover:bg-gray-50 transition-colors">
                {children}
              </tr>
            ),
            td: ({ children }) => (
              <td className="border border-gray-300 px-4 py-2 text-sm text-gray-700">
                {children}
              </td>
            ),
            th: ({ children }) => (
              <th className="border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-900 bg-gray-100">
                {children}
              </th>
            ),
          }}
        >
          {processedContent}
        </ReactMarkdown>
      )
    } else {
      // 일반 텍스트의 경우 줄바꿈 처리
      return (
        <div className="leading-relaxed">
          {formatTextWithBreaks(content)}
        </div>
      )
    }
  }

  const onlineStoreLinks = book ? [
    { name: 'YES24', url: (book as any).yes24_link, color: 'bg-blue-600' },
    { name: '교보문고', url: (book as any).kyobo_link, color: 'bg-green-600' },
    { name: '알라딘', url: (book as any).aladin_link, color: 'bg-purple-600' },
  ].filter(store => store.url) : []

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loading size="lg" text="도서 정보 로딩 중..." />
      </div>
    )
  }

  if (!book) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">도서를 찾을 수 없습니다</h1>
          <p className="text-gray-600 mb-6">요청하신 도서가 존재하지 않거나 삭제되었습니다.</p>
          <Link href="/books">
            <Button>도서 목록으로 돌아가기</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 상단 네비게이션 */}
        <div className="mb-6">
          <Link href="/books" className="inline-flex items-center text-primary-600 hover:text-primary-700">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            도서 목록으로 돌아가기
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mb-12">
          {/* 도서 이미지 */}
          <div className="lg:col-span-2 flex justify-center lg:justify-end">
            <div className="w-full max-w-md lg:max-w-none">
              <div className="w-full h-96 lg:h-[480px] bg-white rounded-lg shadow-lg overflow-hidden relative">
                <SmartImage
                  src={book.cover_image_url}
                  alt={book.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-contain p-6"
                  fallback={
                    <div className="w-full h-full bg-gray-100 flex flex-col items-center justify-center">
                      <svg className="w-20 h-20 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      <span className="text-gray-500 text-sm">표지 이미지</span>
                      <span className="text-gray-400 text-xs mt-1">준비 중</span>
                    </div>
                  }
                />
              </div>
            </div>
          </div>

          {/* 도서 정보 */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              {book.is_featured && (
                <span className="inline-flex items-center px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full mb-4">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  추천 도서
                </span>
              )}
              
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-3 leading-tight">
                {formatTextWithBreaks(book.title)}
              </h1>
              
              <div className="flex items-center mb-4">
                <svg className="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <p className="text-lg text-gray-600">{formatTextWithBreaks(book.author)}</p>
              </div>
              
              <div className="flex items-center mb-6">
                <svg className="w-6 h-6 text-primary-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
                <p className="text-2xl font-bold text-primary-600">{formatPrice(book.price)}원</p>
              </div>

              {/* 구분선 */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">도서 정보</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-500">ISBN</span>
                    <span className={`text-sm ${book.isbn ? 'text-gray-900' : 'text-gray-400 italic'}`}>
                      {book.isbn || '입력 예정'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-500">페이지</span>
                    <span className={`text-sm ${book.page_count ? 'text-gray-900' : 'text-gray-400 italic'}`}>
                      {book.page_count ? `${book.page_count}쪽` : '입력 예정'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-500">크기</span>
                    <span className={`text-sm ${book.size ? 'text-gray-900' : 'text-gray-400 italic'}`}>
                      {book.size || '입력 예정'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-500">출간일</span>
                    <span className={`text-sm ${book.publication_date ? 'text-gray-900' : 'text-gray-400 italic'}`}>
                      {book.publication_date ? formatDate(book.publication_date) : '입력 예정'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 정오표 및 오탈자 신고 */}
              {(book.errata_link || book.error_report_link) && (
                <div className="pt-6">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">정오표 및 오탈자 신고</h3>
                  <div className="flex flex-col sm:flex-row gap-3">
                    {book.errata_link && (
                      <a
                        href={book.errata_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        정오표 확인하기
                      </a>
                    )}
                    {book.error_report_link && (
                      <a
                        href={book.error_report_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.99-.833-2.46 0L5.354 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        오탈자 신고하기
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* 온라인 서점 링크 */}
              <div className="pt-6">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">온라인 서점에서 구매하기</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {[
                    { name: 'YES24', url: (book as any)?.yes24_link, color: 'bg-blue-600' },
                    { name: '교보문고', url: (book as any)?.kyobo_link, color: 'bg-green-600' },
                    { name: '알라딘', url: (book as any)?.aladin_link, color: 'bg-purple-600' },
                  ].map((store) => (
                    store.url ? (
                      <a
                        key={store.name}
                        href={store.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`${store.color} text-white text-center py-3 px-4 rounded-lg font-medium hover:opacity-90 transition-all hover:scale-105 flex items-center justify-center`}
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        {store.name}
                      </a>
                    ) : (
                      <div
                        key={store.name}
                        className="bg-gray-200 text-gray-400 text-center py-3 px-4 rounded-lg font-medium flex items-center justify-center cursor-not-allowed"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="italic">{store.name} 입력 예정</span>
                      </div>
                    )
                  ))}
                </div>
                {onlineStoreLinks.length > 0 && (
                  <p className="text-xs text-gray-500 mt-3 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    온라인 서점으로 이동합니다. 가격은 각 서점에서 확인해주세요.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 탭 섹션 */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex">
              {[
                { id: 'info', name: '책 소개' },
                { id: 'publisher_review', name: '출판사 리뷰' },
                { id: 'testimonials', name: '추천사' },
                { id: 'toc', name: '목차' },
                { id: 'author', name: '저자소개' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-6 font-medium text-sm border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'info' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">책 소개</h3>
                <div className="prose prose-gray max-w-none text-gray-700">
                  {book.description ? (
                    renderContent(book.description)
                  ) : (
                    <p className="text-gray-500">책 소개가 준비 중입니다.</p>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'publisher_review' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">출판사 리뷰</h3>
                <div className="prose prose-gray max-w-none text-gray-700">
                  {book.publisher_review ? (
                    renderContent(book.publisher_review)
                  ) : (
                    <p className="text-gray-500">출판사 리뷰가 준비 중입니다.</p>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'testimonials' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">추천사</h3>
                <div className="prose prose-gray max-w-none text-gray-700">
                  {book.testimonials ? (
                    renderContent(book.testimonials)
                  ) : (
                    <p className="text-gray-500">추천사가 준비 중입니다.</p>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'toc' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">목차</h3>
                <div className="prose prose-gray max-w-none text-gray-700">
                  {book.table_of_contents ? (
                    renderContent(book.table_of_contents)
                  ) : (
                    <p className="text-gray-500">목차 정보가 준비 중입니다.</p>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'author' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">저자 소개</h3>
                <div className="prose prose-gray max-w-none text-gray-700">
                  {book.author_bio ? (
                    renderContent(book.author_bio)
                  ) : (
                    <p className="text-gray-500">저자 소개가 준비 중입니다.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}