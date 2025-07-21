import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useBook } from '../hooks/useBooks'
import SmartImage from '../components/common/SmartImage'
import ReactMarkdown from 'react-markdown'
import remarkBreaks from 'remark-breaks'

export default function BookDetail() {
  const { id } = useParams()
  const { book, loading, error } = useBook(id)
  const [activeTab, setActiveTab] = useState('info')

  const formatPrice = (price) => {
    return new Intl.NumberFormat('ko-KR').format(price)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <div className="max-w-5xl mx-auto px-6 py-12">
          <div className="animate-pulse">
            <div className="h-4 bg-neutral-200 rounded w-1/3 mb-8"></div>
            <div className="bg-white rounded-xl p-8 shadow-sm">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="aspect-[3/4] bg-neutral-200 rounded-xl"></div>
                <div className="space-y-4">
                  <div className="h-8 bg-neutral-200 rounded"></div>
                  <div className="h-6 bg-neutral-200 rounded w-2/3"></div>
                  <div className="h-4 bg-neutral-200 rounded w-1/2"></div>
                  <div className="h-4 bg-neutral-200 rounded w-1/3"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !book) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="max-w-md mx-auto px-6">
          <div className="bg-white rounded-xl p-8 shadow-sm text-center">
            <div className="text-red-500 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-neutral-900 mb-3">
              도서를 찾을 수 없습니다
            </h3>
            <p className="text-neutral-600 mb-6">
              {error || '요청하신 도서가 존재하지 않거나 삭제되었습니다.'}
            </p>
            <Link 
              to="/books"
              className="inline-flex items-center px-6 py-3 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors"
            >
              도서 목록으로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* 브레드크럼 */}
        <nav className="text-sm mb-8 text-neutral-500">
          <Link to="/" className="hover:text-primary-600 transition-colors">홈</Link>
          <span className="mx-2">›</span>
          <Link to="/books" className="hover:text-primary-600 transition-colors">도서</Link>
          <span className="mx-2">›</span>
          <Link to={`/books/${book.category}`} className="hover:text-primary-600 transition-colors">
            {book.category}
          </Link>
          <span className="mx-2">›</span>
          <span className="text-neutral-900 font-medium">{book.title}</span>
        </nav>

        {/* 메인 정보 섹션 */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 p-8 lg:p-12">
            {/* 도서 표지 */}
            <div>
              <div className="aspect-[3/4] bg-neutral-100 overflow-hidden shadow-md">
                <SmartImage
                  src={book.cover_image_url}
                  alt={book.title}
                  className="w-full h-full object-cover"
                  fallback={
                    <div className="w-full h-full flex items-center justify-center text-neutral-400">
                      <svg className="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                  }
                />
              </div>
              
              {/* 추천 도서 뱃지 */}
              {book.is_featured && (
                <div className="flex justify-center mt-6">
                  <div className="inline-flex items-center bg-amber-100 text-amber-800 px-4 py-2 rounded-full text-sm font-medium">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                    추천 도서
                  </div>
                </div>
              )}
            </div>

            {/* 도서 정보 */}
            <div className="flex flex-col">
              <div className="mb-6">
                <span className="inline-block bg-primary-500 text-white px-3 py-1.5 rounded-full text-sm font-medium mb-4">
                  {book.category}
                </span>
                <h1 className="text-3xl lg:text-4xl font-bold text-neutral-900 mb-3 leading-tight">{book.title}</h1>
                <p className="text-xl text-neutral-600 mb-6">{book.author}</p>
              </div>
              
              <div className="text-sm text-neutral-600 space-y-3 mb-8 bg-neutral-50 p-4 rounded-lg">
                {book.publication_date && (
                  <div className="flex justify-between">
                    <span className="font-medium">출간일</span>
                    <span>{formatDate(book.publication_date)}</span>
                  </div>
                )}
                {book.page_count && (
                  <div className="flex justify-between">
                    <span className="font-medium">쪽수</span>
                    <span>{book.page_count}쪽</span>
                  </div>
                )}
                {book.book_size && (
                  <div className="flex justify-between">
                    <span className="font-medium">크기</span>
                    <span>{book.book_size}</span>
                  </div>
                )}
                {book.isbn && (
                  <div className="flex justify-between">
                    <span className="font-medium">ISBN</span>
                    <span className="font-mono text-xs">{book.isbn}</span>
                  </div>
                )}
              </div>

              {/* 가격 정보 */}
              <div className="mb-8">
                <p className="text-4xl font-bold text-primary-600 mb-2">
                  {formatPrice(book.price)}원
                </p>
                <p className="text-sm text-neutral-500">
                  * 골든래빗에서는 도서 직접 판매를 하지 않습니다.
                </p>
              </div>

              {/* 온라인 서점 링크 */}
              <div className="mt-auto">
                <h3 className="text-lg font-bold text-neutral-900 mb-4">온라인 서점에서 구매하기</h3>
                {(() => {
                  const storeLinks = [
                    { name: 'Yes24', url: book.yes24_link, color: 'bg-blue-600 hover:bg-blue-700 border-blue-600' },
                    { name: '교보문고', url: book.kyobo_link, color: 'bg-green-600 hover:bg-green-700 border-green-600' },
                    { name: '알라딘', url: book.aladin_link, color: 'bg-purple-600 hover:bg-purple-700 border-purple-600' },
                    { name: '리디북스', url: book.ridibooks_link, color: 'bg-red-600 hover:bg-red-700 border-red-600' }
                  ].filter(store => store.url && store.url.trim() !== '')
                  
                  return storeLinks.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {storeLinks.map((store) => (
                        <a 
                          key={store.name}
                          href={store.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`flex items-center justify-center px-5 py-3.5 text-white rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5 ${store.color}`}
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          {store.name}에서 구매
                        </a>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-6 text-center">
                      <svg className="w-12 h-12 mx-auto text-neutral-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      <p className="text-neutral-500 font-medium">온라인 서점 링크가 준비 중입니다</p>
                    </div>
                  )
                })()}
              </div>
            </div>
          </div>
        </div>

        {/* 탭 메뉴 */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="border-b border-neutral-200">
            <div className="flex">
              {[
                { id: 'info', label: '도서 소개', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
                { id: 'toc', label: '목차', icon: 'M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
                { id: 'author', label: '저자 소개', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-6 py-4 font-medium transition-all duration-200 ${
                    activeTab === tab.id 
                      ? 'border-b-2 border-primary-500 text-primary-600 bg-primary-50' 
                      : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
                  }`}
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={tab.icon} />
                  </svg>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* 탭 콘텐츠 */}
          <div className="p-8 lg:p-12 min-h-[400px]">
            {activeTab === 'info' && (
              <div>
                <h2 className="text-2xl font-bold text-neutral-900 mb-6">도서 소개</h2>
                {book.description ? (
                  <div className="prose prose-lg max-w-none text-neutral-700">
                    <ReactMarkdown
                      remarkPlugins={[remarkBreaks]}
                      components={{
                        h1: ({children}) => <h1 className="text-3xl font-bold text-neutral-900 mb-4 mt-8 first:mt-0">{children}</h1>,
                        h2: ({children}) => <h2 className="text-2xl font-bold text-neutral-900 mb-3 mt-6 first:mt-0">{children}</h2>,
                        h3: ({children}) => <h3 className="text-xl font-bold text-neutral-900 mb-2 mt-5 first:mt-0">{children}</h3>,
                        h4: ({children}) => <h4 className="text-lg font-semibold text-neutral-900 mb-2 mt-4 first:mt-0">{children}</h4>,
                        p: ({children}) => <p className="mb-4 leading-relaxed">{children}</p>,
                        strong: ({children}) => <strong className="font-bold text-neutral-900">{children}</strong>,
                        em: ({children}) => <em className="italic text-neutral-700">{children}</em>,
                        ul: ({children}) => <ul className="list-disc pl-6 mb-4 space-y-1">{children}</ul>,
                        ol: ({children}) => <ol className="list-decimal pl-6 mb-4 space-y-1">{children}</ol>,
                        li: ({children}) => <li className="leading-relaxed">{children}</li>,
                        blockquote: ({children}) => <blockquote className="border-l-4 border-primary-300 pl-4 py-2 mb-4 italic text-neutral-600 bg-primary-50 rounded-r">{children}</blockquote>,
                        code: ({children}) => <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono text-red-600">{children}</code>,
                        pre: ({children}) => <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto mb-4 text-sm">{children}</pre>,
                        a: ({children, href}) => <a href={href} className="text-primary-600 hover:text-primary-800 underline" target="_blank" rel="noopener noreferrer">{children}</a>,
                        br: () => <br className="my-1" />,
                      }}
                    >
                      {book.description}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-8 text-center">
                    <svg className="w-16 h-16 mx-auto text-neutral-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    <p className="text-neutral-500 font-medium">도서 소개가 준비 중입니다</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'toc' && (
              <div>
                <h2 className="text-2xl font-bold text-neutral-900 mb-6">목차</h2>
                {book.table_of_contents ? (
                  <div className="prose prose-lg max-w-none text-neutral-700 bg-neutral-50 p-6 rounded-lg border">
                    <ReactMarkdown
                      remarkPlugins={[remarkBreaks]}
                      components={{
                        h1: ({children}) => <h1 className="text-2xl font-bold text-neutral-900 mb-3 mt-6 first:mt-0">{children}</h1>,
                        h2: ({children}) => <h2 className="text-xl font-bold text-neutral-900 mb-2 mt-5 first:mt-0">{children}</h2>,
                        h3: ({children}) => <h3 className="text-lg font-semibold text-neutral-900 mb-2 mt-4 first:mt-0">{children}</h3>,
                        h4: ({children}) => <h4 className="text-base font-semibold text-neutral-900 mb-1 mt-3 first:mt-0">{children}</h4>,
                        p: ({children}) => <p className="mb-2 leading-relaxed">{children}</p>,
                        strong: ({children}) => <strong className="font-bold text-neutral-900">{children}</strong>,
                        em: ({children}) => <em className="italic text-neutral-700">{children}</em>,
                        ul: ({children}) => <ul className="list-disc pl-6 mb-3 space-y-1">{children}</ul>,
                        ol: ({children}) => <ol className="list-decimal pl-6 mb-3 space-y-1">{children}</ol>,
                        li: ({children}) => <li className="leading-relaxed">{children}</li>,
                        code: ({children}) => <code className="bg-gray-200 px-2 py-1 rounded text-sm font-mono">{children}</code>,
                        br: () => <br className="my-1" />,
                      }}
                    >
                      {book.table_of_contents}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-8 text-center">
                    <svg className="w-16 h-16 mx-auto text-neutral-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                    <p className="text-neutral-500 font-medium">목차 정보가 준비 중입니다</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'author' && (
              <div>
                <h2 className="text-2xl font-bold text-neutral-900 mb-6">저자 소개</h2>
                {book.author_bio ? (
                  <div className="prose prose-lg max-w-none text-neutral-700">
                    <ReactMarkdown
                      remarkPlugins={[remarkBreaks]}
                      components={{
                        h1: ({children}) => <h1 className="text-3xl font-bold text-neutral-900 mb-4 mt-8 first:mt-0">{children}</h1>,
                        h2: ({children}) => <h2 className="text-2xl font-bold text-neutral-900 mb-3 mt-6 first:mt-0">{children}</h2>,
                        h3: ({children}) => <h3 className="text-xl font-bold text-neutral-900 mb-2 mt-5 first:mt-0">{children}</h3>,
                        h4: ({children}) => <h4 className="text-lg font-semibold text-neutral-900 mb-2 mt-4 first:mt-0">{children}</h4>,
                        p: ({children}) => <p className="mb-4 leading-relaxed">{children}</p>,
                        strong: ({children}) => <strong className="font-bold text-neutral-900">{children}</strong>,
                        em: ({children}) => <em className="italic text-neutral-700">{children}</em>,
                        ul: ({children}) => <ul className="list-disc pl-6 mb-4 space-y-1">{children}</ul>,
                        ol: ({children}) => <ol className="list-decimal pl-6 mb-4 space-y-1">{children}</ol>,
                        li: ({children}) => <li className="leading-relaxed">{children}</li>,
                        blockquote: ({children}) => <blockquote className="border-l-4 border-primary-300 pl-4 py-2 mb-4 italic text-neutral-600 bg-primary-50 rounded-r">{children}</blockquote>,
                        code: ({children}) => <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono text-red-600">{children}</code>,
                        pre: ({children}) => <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto mb-4 text-sm">{children}</pre>,
                        a: ({children, href}) => <a href={href} className="text-primary-600 hover:text-primary-800 underline" target="_blank" rel="noopener noreferrer">{children}</a>,
                        br: () => <br className="my-1" />,
                      }}
                    >
                      {book.author_bio}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-8 text-center">
                    <svg className="w-16 h-16 mx-auto text-neutral-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <p className="text-neutral-500 font-medium">저자 소개가 준비 중입니다</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}