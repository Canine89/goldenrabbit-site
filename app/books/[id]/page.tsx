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
  pages?: number
  size?: string
  publication_date?: string
  table_of_contents?: string
  description?: string
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
        console.log('온라인 서점 링크 조회 실패:', storeError)
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
            p: ({ children }) => <p className="mb-4 leading-relaxed text-gray-700">{children}</p>,
            h1: ({ children }) => (
              <h1 className="text-3xl font-bold mb-6 mt-8 text-gray-900 border-b-2 border-primary-200 pb-2">
                {children}
              </h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-2xl font-bold mb-4 mt-7 text-gray-900 border-b border-gray-200 pb-1">
                {children}
              </h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-xl font-semibold mb-3 mt-6 text-gray-800">
                {children}
              </h3>
            ),
            h4: ({ children }) => (
              <h4 className="text-lg font-semibold mb-2 mt-4 text-gray-800">
                {children}
              </h4>
            ),
            ul: ({ children }) => (
              <ul className="list-disc ml-8 mb-6 space-y-2 pl-4">
                {children}
              </ul>
            ),
            ol: ({ children }) => (
              <ol className="list-decimal ml-8 mb-6 space-y-2 pl-4">
                {children}
              </ol>
            ),
            li: ({ children }) => (
              <li className="leading-relaxed text-gray-700 ml-4">
                {children}
              </li>
            ),
            blockquote: ({ children }) => (
              <blockquote className="border-l-4 border-yellow-400 bg-yellow-50 pl-6 pr-4 py-3 italic my-6 rounded-r-lg">
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
              <pre className="bg-gray-900 text-gray-100 p-6 rounded-lg overflow-x-auto mb-6 border shadow-lg">
                <code className="text-sm font-mono leading-relaxed">
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
              <div className="overflow-x-auto my-6">
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

  const onlineStoreLinks = [
    { name: 'YES24', url: onlineStores.yes24_url, color: 'bg-blue-600' },
    { name: '교보문고', url: onlineStores.kyobo_url, color: 'bg-green-600' },
    { name: '알라딘', url: onlineStores.aladin_url, color: 'bg-purple-600' },
    { name: '리디북스', url: onlineStores.ridibooks_url, color: 'bg-red-600' },
  ].filter(store => store.url)

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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
          {/* 도서 이미지 */}
          <div className="flex justify-center">
            <div className="w-full max-w-md">
              <div className="w-full h-96 bg-white rounded-lg shadow-lg overflow-hidden relative">
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
          <div>
            <div className="mb-6">
              {book.is_featured && (
                <span className="inline-block px-3 py-1 bg-secondary-100 text-secondary-800 text-sm font-medium rounded-full mb-4">
                  추천 도서
                </span>
              )}
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">{formatTextWithBreaks(book.title)}</h1>
              <p className="text-xl text-gray-600 mb-6">{formatTextWithBreaks(book.author)}</p>
              <p className="text-3xl font-bold text-primary-600 mb-8">{formatPrice(book.price)}원</p>
            </div>

            {/* 도서 기본 정보 */}
            <div className="bg-white rounded-lg p-6 shadow-sm mb-8">
              <h3 className="text-lg font-semibold mb-4">도서 정보</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">ISBN:</span>
                  <span className="ml-2 font-medium">{book.isbn || '-'}</span>
                </div>
                <div>
                  <span className="text-gray-600">페이지:</span>
                  <span className="ml-2 font-medium">{book.pages ? `${book.pages}쪽` : '-'}</span>
                </div>
                <div>
                  <span className="text-gray-600">크기:</span>
                  <span className="ml-2 font-medium">{book.size || '-'}</span>
                </div>
                <div>
                  <span className="text-gray-600">출간일:</span>
                  <span className="ml-2 font-medium">{formatDate(book.publication_date)}</span>
                </div>
              </div>
            </div>

            {/* 온라인 서점 링크 */}
            {onlineStoreLinks.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4">온라인 서점에서 구매하기</h3>
                <div className="grid grid-cols-2 gap-3">
                  {onlineStoreLinks.map((store) => (
                    <a
                      key={store.name}
                      href={store.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`${store.color} text-white text-center py-3 px-4 rounded-lg font-medium hover:opacity-90 transition-opacity`}
                    >
                      {store.name}에서 구매
                    </a>
                  ))}
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  * 온라인 서점으로 이동합니다. 가격은 각 서점에서 확인해주세요.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 탭 섹션 */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex">
              {[
                { id: 'info', name: '상세정보' },
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
                <h3 className="text-lg font-semibold mb-4">상세 정보</h3>
                <div className="prose prose-gray max-w-none text-gray-700">
                  {book.description ? (
                    renderContent(book.description)
                  ) : (
                    <p className="text-gray-500">상세 정보가 준비 중입니다.</p>
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