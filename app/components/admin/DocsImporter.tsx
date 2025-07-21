'use client'

import { useState } from 'react'

interface BookInfo {
  title: string
  author: string
  category: string
  price: string
  description: string
  isbn: string
  page_count: string
  book_size: string
  publication_date: string
  table_of_contents: string
  author_bio: string
}

interface DocsImporterProps {
  onBookInfoExtracted: (bookInfo: BookInfo) => void
}

export default function DocsImporter({ onBookInfoExtracted }: DocsImporterProps) {
  const [documentUrl, setDocumentUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleImport = async () => {
    if (!documentUrl.trim()) {
      alert('보도자료 링크를 입력해주세요.')
      return
    }

    setError(null)
    setLoading(true)

    try {
      const bookInfo = await extractBookInfoSimple(documentUrl)
      
      if (bookInfo) {
        // 추출된 정보를 부모 컴포넌트로 전달
        onBookInfoExtracted(bookInfo)
        
        // 성공 메시지
        alert('보도자료에서 도서 정보를 성공적으로 불러왔습니다!')
        
        // URL 초기화
        setDocumentUrl('')
      }
    } catch (err: any) {
      console.error('도서 정보 추출 실패:', err)
      setError(err.message || '도서 정보 추출에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // 구글 문서에서 도서 정보 추출
  const extractBookInfoSimple = async (documentUrl: string): Promise<BookInfo | null> => {
    if (!documentUrl || !documentUrl.trim()) {
      throw new Error('문서 URL을 입력해주세요.')
    }

    // URL에서 문서 ID 추출
    const match = documentUrl.match(/\/document\/d\/([a-zA-Z0-9-_]+)/)
    if (!match) {
      throw new Error('올바른 Google Docs URL이 아닙니다.')
    }

    const documentId = match[1]
    
    // CORS 우회를 위한 프록시 서버 사용
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(
      `https://docs.google.com/document/d/${documentId}/export?format=txt`
    )}`
    
    const response = await fetch(proxyUrl)
    if (!response.ok) {
      throw new Error('문서에 접근할 수 없습니다. 문서가 공개되어 있는지 확인해주세요.')
    }

    const data = await response.json()
    const text = data.contents
    
    // 텍스트 파싱
    const bookInfo = parseBookInfoFromText(text)
    
    return bookInfo
  }

  // 텍스트에서 도서 정보 파싱
  const parseBookInfoFromText = (text: string): BookInfo => {
    const bookInfo: BookInfo = {
      title: '',
      author: '',
      category: '',
      price: '',
      description: '',
      isbn: '',
      page_count: '',
      book_size: '',
      publication_date: '',
      table_of_contents: '',
      author_bio: ''
    }

    // 도서명 추출
    const titlePatterns = [
      /(이게\s*되네\?\s*제미나이[^.\n]*)/gi,
      /"([^"]+)"/g,
      /『([^』]+)』/g,
      /「([^」]+)」/g,
      /"([^"]+)"/g,
      /제목[:\s]*([^\n\r]+)/gi,
      /도서명[:\s]*([^\n\r]+)/gi,
      /책제목[:\s]*([^\n\r]+)/gi,
      /(이게\s*되네\?[^.\n]*)/gi
    ]

    for (const pattern of titlePatterns) {
      const matches = [...text.matchAll(pattern)]
      for (const match of matches) {
        if (match[1] && match[1].trim().length > 5) {
          let title = match[1].trim()
          title = title.replace(/\s*출간\s*$/, '')
          title = title.replace(/\s*발간\s*$/, '')
          title = title.replace(/\s*출판\s*$/, '')
          title = title.replace(/^[""]/, '').replace(/[""]$/, '')
          bookInfo.title = title
          break
        }
      }
      if (bookInfo.title) break
    }

    // 저자 추출
    const authorPatterns = [
      /[・•·‧․]\s*지은이\s*:\s*([^\n\r]+)/gi,
      /지은이\s*:\s*([^\n\r]+)/gi,
      /저자\s*:\s*([^\n\r]+)/gi
    ]
    
    for (const pattern of authorPatterns) {
      const authorMatch = text.match(pattern)
      if (authorMatch && authorMatch[0]) {
        let author = authorMatch[0].replace(/[・•·‧․]?\s*(?:지은이|저자)\s*:\s*/, '').trim()
        author = author.replace(/[·•・]/g, '').trim()
        
        if (author && author.length > 0 && author.length < 50) {
          bookInfo.author = author
          break
        }
      }
    }

    // 가격 추출
    const pricePatterns = [
      /[・•·‧․]\s*정가\s*:\s*([\d,]+)\s*원/gi,
      /[・•·‧․]\s*정가\s*:\s*([\d,]+)/gi,
      /정가\s*:\s*([\d,]+)\s*원/gi,
      /정가\s*:\s*([\d,]+)/gi,
      /가격\s*:\s*([\d,]+)\s*원/gi,
      /가격\s*:\s*([\d,]+)/gi,
      /([\d,]{4,8})\s*원/g
    ]
    
    for (const pattern of pricePatterns) {
      const priceMatch = text.match(pattern)
      if (priceMatch && priceMatch[0]) {
        let priceStr = priceMatch[1] || priceMatch[0]
        let priceNum = parseInt(priceStr.replace(/[^\d]/g, ''))
        
        if (priceNum && priceNum >= 5000 && priceNum <= 100000) {
          bookInfo.price = priceNum.toString()
          break
        }
      }
    }

    // ISBN 추출
    const isbnPatterns = [
      /ISBN[:\s]*([0-9\-]{10,17})/gi,
      /(979-\d{2}-\d{5}-\d{2}-\d)/g,
      /(978-\d{2}-\d{5}-\d{2}-\d)/g,
      /(\d{3}-\d{2}-\d{5}-\d{2}-\d)/g
    ]

    for (const pattern of isbnPatterns) {
      const match = text.match(pattern)
      if (match) {
        let isbn = match[1] || match[0]
        isbn = isbn.replace(/^ISBN[:\s]*/gi, '').trim()
        bookInfo.isbn = isbn
        break
      }
    }

    // 페이지 수 추출
    const pagePatterns = [
      /분량[:\s]*(\d+)p/gi,
      /(\d+)p(?!\w)/gi,
      /(\d+)\s*(?:페이지|쪽|page)/gi,
      /쪽수[:\s]*(\d+)/gi,
      /페이지[:\s]*(\d+)/gi
    ]

    for (const pattern of pagePatterns) {
      const matches = [...text.matchAll(pattern)]
      if (matches.length > 0) {
        const pages = matches
          .map(m => parseInt(m[1]))
          .filter(page => page >= 50 && page <= 2000)
        
        if (pages.length > 0) {
          bookInfo.page_count = Math.max(...pages).toString()
          break
        }
      }
    }

    // 책 크기 추출
    const sizePatterns = [
      /판형[:\s]*(\d+)\s*(?:mm)?\s*(?:×|x|X)\s*(\d+)\s*(?:mm)?/gi,
      /(\d+)\s*(?:mm)?\s*(?:×|x|X)\s*(\d+)\s*(?:mm)/gi,
      /크기[:\s]*(\d+\s*(?:×|x|X|\*)\s*\d+\s*(?:mm|㎜)?)/gi
    ]

    for (const pattern of sizePatterns) {
      const match = text.match(pattern)
      if (match) {
        if (match.length > 2 && match[1] && match[2]) {
          bookInfo.book_size = `${match[1]}mm x ${match[2]}mm`
        } else {
          bookInfo.book_size = match[1] || match[0]
        }
        break
      }
    }

    // 출간일 추출
    const datePatterns = [
      /발행일?[:\s]*(\d{4})\s*년\s*0?(\d{1,2})\s*월\s*0?(\d{1,2})\s*일/gi,
      /(\d{4})\s*년\s*0?(\d{1,2})\s*월\s*0?(\d{1,2})\s*일/g,
      /(\d{4})-0?(\d{1,2})-0?(\d{1,2})/g,
      /(\d{4})\.0?(\d{1,2})\.0?(\d{1,2})/g,
      /출간[:\s]*(\d{4}[년\-\.]\d{1,2}[월\-\.]\d{1,2}일?)/gi,
      /출판[:\s]*(\d{4}[년\-\.]\d{1,2}[월\-\.]\d{1,2}일?)/gi,
      /배본일?[:\s]*(\d{4})\s*년\s*0?(\d{1,2})\s*월\s*0?(\d{1,2})\s*일/gi,
      /예정\s*배본일?[:\s]*(\d{4})\s*년\s*0?(\d{1,2})\s*월\s*0?(\d{1,2})\s*일/gi,
      /(\d{4})\s*년\s*0?(\d{1,2})\s*월\s*0?(\d{1,2})\s*일\s*\([가-힣]+\)/gi
    ]

    for (const pattern of datePatterns) {
      const matches = [...text.matchAll(pattern)]
      for (const match of matches) {
        if (match.length > 3) {
          const year = match[1]
          const month = match[2].padStart(2, '0')
          const day = match[3].padStart(2, '0')
          bookInfo.publication_date = `${year}-${month}-${day}`
          break
        } else if (match[1]) {
          let dateStr = match[1]
          dateStr = dateStr.replace(/[년월일\.]/g, '-').replace(/-+/g, '-').replace(/-$/, '')
          bookInfo.publication_date = dateStr
          break
        }
      }
      if (bookInfo.publication_date) break
    }

    // 도서 설명 추출
    const descriptionMatch = text.match(/4\.\s*출판사\s*리뷰\s*\n([\s\S]*?)(?=\n\d+\.|$)/gi)
    if (descriptionMatch && descriptionMatch[0]) {
      let description = descriptionMatch[0]
        .replace(/4\.\s*출판사\s*리뷰\s*\n/gi, '')
        .trim()
      
      if (description.length > 20) {
        bookInfo.description = description
      }
    }

    // 저자 소개 추출
    const authorBioMatch = text.match(/3\.\s*저자\s*소개\s*\n([\s\S]*?)(?=\n\d+\.|$)/gi)
    if (authorBioMatch && authorBioMatch[0]) {
      let authorBio = authorBioMatch[0]
        .replace(/3\.\s*저자\s*소개\s*\n/gi, '')
        .trim()
      
      if (authorBio.length > 10) {
        bookInfo.author_bio = authorBio
      }
    }

    // 목차 추출
    const tocPatterns = [
      /\d+\.\s*목차\s*\n([\s\S]*?)(?=\n\d+\.|$)/gi,
      /목차\s*\n([\s\S]*?)(?=\n\d+\.|$)/gi,
      /목차[:\s]*\n([\s\S]*?)(?=\n\d+\.|$)/gi
    ]
    
    for (const pattern of tocPatterns) {
      const tocMatch = text.match(pattern)
      if (tocMatch && tocMatch[0]) {
        let toc = tocMatch[0]
          .replace(/\d*\.\s*목차[:\s]*\n/gi, '')
          .replace(/목차[:\s]*\n/gi, '')
          .trim()
        
        if (toc.length > 20) {
          bookInfo.table_of_contents = toc
          break
        }
      }
    }

    // 카테고리 추정
    const categoryKeywords = {
      'IT전문서': ['프로그래밍', '개발', '코딩', '소프트웨어', '시스템', '데이터베이스', '알고리즘', '머신러닝', 'AI', '인공지능', '제미나이', '노트북LM'],
      'IT활용서': ['엑셀', '파워포인트', '워드', '오피스', '컴퓨터 활용', '인터넷', '스마트폰', '활용법'],
      '경제경영': ['경영', '마케팅', '투자', '재테크', '경제', '비즈니스', '창업', '리더십'],
      '학습만화': ['만화', '웹툰', '일러스트', '그림'],
      '좋은여름': ['여름', '휴가', '여행'],
      '수상작품': ['수상', '베스트셀러', '추천도서']
    }

    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        bookInfo.category = category
        break
      }
    }

    return bookInfo
  }

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDocumentUrl(e.target.value)
    if (error) {
      setError(null)
    }
  }

  const isValidGoogleDocsUrl = (url: string) => {
    return url.includes('docs.google.com/document/d/')
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        </div>
        
        <div className="flex-1">
          <h3 className="text-lg font-bold text-blue-900 mb-2">
            보도자료에서 도서 정보 불러오기
          </h3>
          <p className="text-sm text-blue-700 mb-4">
            구글 문서로 작성된 보도자료 링크를 입력하면 도서 정보를 자동으로 추출합니다.
          </p>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-blue-900 mb-1">
                구글 문서 링크
              </label>
              <div className="flex gap-3">
                <input
                  type="url"
                  value={documentUrl}
                  onChange={handleUrlChange}
                  placeholder="https://docs.google.com/document/d/..."
                  className={`flex-1 border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    error ? 'border-red-300 bg-red-50' : 'border-blue-300'
                  }`}
                  disabled={loading}
                />
                <button
                  onClick={handleImport}
                  disabled={loading || !documentUrl.trim() || !isValidGoogleDocsUrl(documentUrl)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      불러오는 중...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      불러오기
                    </>
                  )}
                </button>
              </div>
            </div>
            
            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-red-800">오류가 발생했습니다</p>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            )}
            
            {!isValidGoogleDocsUrl(documentUrl) && documentUrl.trim() && (
              <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <svg className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-yellow-800">잘못된 링크 형식</p>
                  <p className="text-sm text-yellow-700">구글 문서 링크를 입력해주세요. (예: https://docs.google.com/document/d/...)</p>
                </div>
              </div>
            )}
          </div>
          
          <div className="mt-4 p-3 bg-blue-100 rounded-lg">
            <h4 className="text-sm font-medium text-blue-900 mb-2">💡 사용 팁</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• 구글 문서가 "링크가 있는 모든 사용자"로 공유되어 있어야 합니다.</li>
              <li>• 보도자료에 도서명, 저자, 가격 등의 정보가 명확히 기재되어 있을 때 효과적입니다.</li>
              <li>• 추출되지 않은 정보는 수동으로 입력하실 수 있습니다.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}