import { useState, useCallback } from 'react'

export const useGoogleDocs = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)


  // 심플한 추출 함수 (인증 없이 공개 문서 접근)
  const extractBookInfoSimple = useCallback(async (documentUrl) => {
    if (!documentUrl || !documentUrl.trim()) {
      setError('문서 URL을 입력해주세요.')
      return null
    }

    try {
      setLoading(true)
      setError(null)

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
    } catch (err) {
      setError(err.message || '도서 정보 추출에 실패했습니다.')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  // 텍스트에서 도서 정보 파싱 (GoogleDocsExtractor와 동일한 로직)
  const parseBookInfoFromText = (text) => {
    const bookInfo = {
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

    // 도서명 추출 (따옴표 안의 텍스트나 제목 패턴)
    const titlePatterns = [
      // 정확한 제미나이 패턴
      /(이게\s*되네\?\s*제미나이[^.\n]*)/gi,
      /"([^"]+)"/g,
      /『([^』]+)』/g,
      /「([^」]+)」/g,
      /"([^"]+)"/g,
      /제목[:\s]*([^\n\r]+)/gi,
      /도서명[:\s]*([^\n\r]+)/gi,
      /책제목[:\s]*([^\n\r]+)/gi,
      // 일반적인 "이게 되네?" 시리즈
      /(이게\s*되네\?[^.\n]*)/gi
    ]

    for (const pattern of titlePatterns) {
      const matches = [...text.matchAll(pattern)]
      for (const match of matches) {
        if (match[1] && match[1].trim().length > 5) {
          let title = match[1].trim()
          // 불필요한 접미사 제거
          title = title.replace(/\s*출간\s*$/, '')
          title = title.replace(/\s*발간\s*$/, '')
          title = title.replace(/\s*출판\s*$/, '')
          // 특정 문자열 정리
          title = title.replace(/^[""]/, '').replace(/[""]$/, '')
          bookInfo.title = title
          break
        }
      }
      if (bookInfo.title) break
    }

    // 저자 추출: 다양한 불릿 문자 패턴 시도
    const authorPatterns = [
      /[・•·‧․]\s*지은이\s*:\s*([^\n\r]+)/gi,  // 다양한 불릿 문자
      /지은이\s*:\s*([^\n\r]+)/gi,            // 불릿 없이
      /저자\s*:\s*([^\n\r]+)/gi               // 저자로 표기된 경우
    ]
    
    for (const pattern of authorPatterns) {
      const authorMatch = text.match(pattern)
      if (authorMatch && authorMatch[0]) {
        let author = authorMatch[0].replace(/[・•·‧․]?\s*(?:지은이|저자)\s*:\s*/, '').trim()
        // 불필요한 문자들 제거
        author = author.replace(/[·•・]/g, '').trim()
        
        if (author && author.length > 0 && author.length < 50) {  // 너무 긴 경우 제외
          bookInfo.author = author
          break
        }
      }
    }
    

    // 가격 추출: 다양한 불릿 문자 패턴 시도 (콤마 포함)
    const pricePatterns = [
      /[・•·‧․]\s*정가\s*:\s*([\d,]+)\s*원/gi,     // 불릿 + 정가 + 콤마 + 원
      /[・•·‧․]\s*정가\s*:\s*([\d,]+)/gi,        // 불릿 + 정가 + 콤마
      /정가\s*:\s*([\d,]+)\s*원/gi,             // 정가 + 콤마 + 원
      /정가\s*:\s*([\d,]+)/gi,                  // 정가 + 콤마
      /가격\s*:\s*([\d,]+)\s*원/gi,             // 가격 + 콤마 + 원  
      /가격\s*:\s*([\d,]+)/gi,                  // 가격 + 콤마
      /([\d,]{4,8})\s*원/g                      // 원 단위로 표기된 경우 (콤마 포함)
    ]
    
    for (const pattern of pricePatterns) {
      const priceMatch = text.match(pattern)
      if (priceMatch && priceMatch[0]) {
        let priceStr = priceMatch[1] || priceMatch[0]
        // 콤마 제거하고 숫자만 추출
        let priceNum = parseInt(priceStr.replace(/[^\d]/g, ''))
        
        if (priceNum && priceNum >= 5000 && priceNum <= 100000) {
          bookInfo.price = priceNum.toString()
          break
        }
      }
    }
    

    // ISBN 추출 (979-11-94383-35-2 패턴)
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

    // 페이지 수 추출 (308p 패턴)
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
        // 도서 페이지 범위(50~2000 페이지)만 추출
        const pages = matches
          .map(m => parseInt(m[1]))
          .filter(page => page >= 50 && page <= 2000)
        
        if (pages.length > 0) {
          bookInfo.page_count = Math.max(...pages).toString()
          break
        }
      }
    }

    // 책 크기 추출 (188mm x 257mm 패턴)
    const sizePatterns = [
      /판형[:\s]*(\d+)\s*(?:mm)?\s*(?:×|x|X)\s*(\d+)\s*(?:mm)?/gi,
      /(\d+)\s*(?:mm)?\s*(?:×|x|X)\s*(\d+)\s*(?:mm)/gi,
      /크기[:\s]*(\d+\s*(?:×|x|X|\*)\s*\d+\s*(?:mm|㎜)?)/gi
    ]

    for (const pattern of sizePatterns) {
      const match = text.match(pattern)
      if (match) {
        if (match.length > 2 && match[1] && match[2]) {
          // 판형: 188 x 257mm 형태
          bookInfo.book_size = `${match[1]}mm x ${match[2]}mm`
        } else {
          bookInfo.book_size = match[1] || match[0]
        }
        break
      }
    }

    // 출간일 추출 (2025년 07월 15일 패턴)
    const datePatterns = [
      // 발행일: 2025년 07월 15일
      /발행일?[:\s]*(\d{4})\s*년\s*0?(\d{1,2})\s*월\s*0?(\d{1,2})\s*일/gi,
      /(\d{4})\s*년\s*0?(\d{1,2})\s*월\s*0?(\d{1,2})\s*일/g,
      /(\d{4})-0?(\d{1,2})-0?(\d{1,2})/g,
      /(\d{4})\.0?(\d{1,2})\.0?(\d{1,2})/g,
      /출간[:\s]*(\d{4}[년\-\.]\d{1,2}[월\-\.]\d{1,2}일?)/gi,
      /출판[:\s]*(\d{4}[년\-\.]\d{1,2}[월\-\.]\d{1,2}일?)/gi,
      /배본일?[:\s]*(\d{4})\s*년\s*0?(\d{1,2})\s*월\s*0?(\d{1,2})\s*일/gi,
      /예정\s*배본일?[:\s]*(\d{4})\s*년\s*0?(\d{1,2})\s*월\s*0?(\d{1,2})\s*일/gi,
      // 특정 형식: "2025년 7월 15일(화요일)" 패턴
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

    // 도서 설명 추출: 4. 출판사 리뷰 하위 내용
    const descriptionMatch = text.match(/4\.\s*출판사\s*리뷰\s*\n([\s\S]*?)(?=\n\d+\.|$)/gi)
    if (descriptionMatch && descriptionMatch[0]) {
      let description = descriptionMatch[0]
        .replace(/4\.\s*출판사\s*리뷰\s*\n/gi, '')
        .trim()
      
      if (description.length > 20) {
        bookInfo.description = description
      }
    }

    // 저자 소개 추출: 3. 저자 소개 하위 내용
    const authorBioMatch = text.match(/3\.\s*저자\s*소개\s*\n([\s\S]*?)(?=\n\d+\.|$)/gi)
    if (authorBioMatch && authorBioMatch[0]) {
      let authorBio = authorBioMatch[0]
        .replace(/3\.\s*저자\s*소개\s*\n/gi, '')
        .trim()
      
      if (authorBio.length > 10) {
        bookInfo.author_bio = authorBio
      }
    }

    // 목차 추출: 다양한 번호. 목차 패턴 (7. 목차, 8. 목차 등)
    const tocPatterns = [
      /\d+\.\s*목차\s*\n([\s\S]*?)(?=\n\d+\.|$)/gi,     // 숫자. 목차
      /목차\s*\n([\s\S]*?)(?=\n\d+\.|$)/gi,            // 목차 (번호 없이)
      /목차[:\s]*\n([\s\S]*?)(?=\n\d+\.|$)/gi          // 목차: 또는 목차 :
    ]
    
    for (const pattern of tocPatterns) {
      const tocMatch = text.match(pattern)
      if (tocMatch && tocMatch[0]) {
        let toc = tocMatch[0]
          .replace(/\d*\.\s*목차[:\s]*\n/gi, '')  // 번호. 목차 제거
          .replace(/목차[:\s]*\n/gi, '')          // 목차 제거
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

  // 에러 초기화
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    loading,
    error,
    extractBookInfoSimple,
    clearError
  }
}