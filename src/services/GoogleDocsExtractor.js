import { google } from 'googleapis'

class GoogleDocsExtractor {
  constructor() {
    this.auth = null
    this.docs = null
  }

  // 구글 문서 URL에서 Document ID 추출
  extractDocumentId(url) {
    const match = url.match(/\/document\/d\/([a-zA-Z0-9-_]+)/)
    return match ? match[1] : null
  }

  // OAuth 2.0 인증 초기화
  async initializeAuth() {
    try {
      const clientSecrets = {
        web: {
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || "",
          client_secret: import.meta.env.VITE_GOOGLE_CLIENT_SECRET || "",
          redirect_uris: ["http://localhost:3000/oauth2callback"]
        }
      }

      this.auth = new google.auth.OAuth2(
        clientSecrets.web.client_id,
        clientSecrets.web.client_secret,
        clientSecrets.web.redirect_uris[0]
      )

      // 스코프 설정 (Google Docs 읽기 권한)
      const scopes = ['https://www.googleapis.com/auth/documents.readonly']
      
      const authUrl = this.auth.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
      })

      this.docs = google.docs({ version: 'v1', auth: this.auth })
      
      return authUrl
    } catch (error) {
      console.error('인증 초기화 실패:', error)
      throw new Error('Google 인증 초기화에 실패했습니다.')
    }
  }

  // 인증 토큰 설정
  setCredentials(token) {
    if (this.auth) {
      this.auth.setCredentials(token)
    }
  }

  // 구글 문서 내용 가져오기
  async getDocumentContent(documentId) {
    if (!this.docs) {
      throw new Error('Google Docs API가 초기화되지 않았습니다.')
    }

    try {
      const response = await this.docs.documents.get({
        documentId: documentId,
      })

      return response.data
    } catch (error) {
      console.error('문서 가져오기 실패:', error)
      throw new Error('문서를 가져올 수 없습니다. 권한을 확인해주세요.')
    }
  }

  // 문서에서 텍스트 추출
  extractText(document) {
    let text = ''
    
    if (document.body && document.body.content) {
      document.body.content.forEach(element => {
        if (element.paragraph) {
          element.paragraph.elements.forEach(el => {
            if (el.textRun) {
              text += el.textRun.content
            }
          })
        }
      })
    }
    
    return text
  }

  // 도서 정보 파싱
  parseBookInfo(text) {
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
      /"([^"]+)"/g,
      /제목[:\s]*([^\n]+)/gi,
      /도서명[:\s]*([^\n]+)/gi,
      /책제목[:\s]*([^\n]+)/gi
    ]

    for (const pattern of titlePatterns) {
      const match = text.match(pattern)
      if (match && match[1] && match[1].trim().length > 3) {
        bookInfo.title = match[1].trim()
        break
      }
    }

    // 저자 추출
    const authorPatterns = [
      /저자[:\s]*([^\n]+)/gi,
      /지은이[:\s]*([^\n]+)/gi,
      /글쓴이[:\s]*([^\n]+)/gi,
      /작가[:\s]*([^\n]+)/gi
    ]

    for (const pattern of authorPatterns) {
      const match = text.match(pattern)
      if (match && match[1]) {
        bookInfo.author = match[1].trim()
        break
      }
    }

    // 가격 추출
    const priceMatch = text.match(/(\d{1,3}(?:,\d{3})*)\s*원/g)
    if (priceMatch) {
      const prices = priceMatch.map(p => parseInt(p.replace(/[^\d]/g, '')))
      // 가장 큰 가격을 책 가격으로 추정 (일반적으로 도서 가격이 가장 높음)
      bookInfo.price = Math.max(...prices).toString()
    }

    // ISBN 추출
    const isbnMatch = text.match(/ISBN[:\s]*([0-9\-]{10,17})/gi)
    if (isbnMatch) {
      bookInfo.isbn = isbnMatch[0].replace(/ISBN[:\s]*/gi, '').trim()
    }

    // 페이지 수 추출
    const pageMatch = text.match(/(\d+)\s*(?:페이지|쪽|p\.|page)/gi)
    if (pageMatch) {
      const pages = pageMatch.map(p => parseInt(p.match(/\d+/)[0]))
      bookInfo.page_count = Math.max(...pages).toString()
    }

    // 책 크기 추출
    const sizeMatch = text.match(/(\d+)\s*(?:×|x|X)\s*(\d+)\s*(?:mm|㎜)/gi)
    if (sizeMatch) {
      bookInfo.book_size = sizeMatch[0].trim()
    }

    // 출간일 추출
    const datePatterns = [
      /(\d{4})\s*년\s*(\d{1,2})\s*월\s*(\d{1,2})\s*일/g,
      /(\d{4})-(\d{1,2})-(\d{1,2})/g,
      /(\d{4})\.(\d{1,2})\.(\d{1,2})/g,
      /출간\s*[:\s]*(\d{4}[년\-\.]\d{1,2}[월\-\.]\d{1,2}일?)/gi,
      /발행\s*[:\s]*(\d{4}[년\-\.]\d{1,2}[월\-\.]\d{1,2}일?)/gi
    ]

    for (const pattern of datePatterns) {
      const match = text.match(pattern)
      if (match) {
        if (pattern.source.includes('년')) {
          const year = match[1]
          const month = match[2].padStart(2, '0')
          const day = match[3].padStart(2, '0')
          bookInfo.publication_date = `${year}-${month}-${day}`
        } else {
          bookInfo.publication_date = match[0].replace(/[년월일\.]/g, '-').replace(/-$/, '')
        }
        break
      }
    }

    // 목차 추출 (목차 섹션 찾기)
    const tocMatch = text.match(/목차[:\s]*\n([\s\S]*?)(?=\n\n|\n[가-힣]+[:\s]|\n\d+\.|\n-|$)/gi)
    if (tocMatch) {
      bookInfo.table_of_contents = tocMatch[0].replace(/^목차[:\s]*\n?/gi, '').trim()
    }

    // 도서 설명/소개 추출
    const descriptionPatterns = [
      /도서\s*(?:소개|설명)[:\s]*\n([\s\S]*?)(?=\n\n|\n[가-힣]+[:\s]|$)/gi,
      /책\s*(?:소개|설명)[:\s]*\n([\s\S]*?)(?=\n\n|\n[가-힣]+[:\s]|$)/gi,
      /내용\s*(?:소개|설명)[:\s]*\n([\s\S]*?)(?=\n\n|\n[가-힣]+[:\s]|$)/gi
    ]

    for (const pattern of descriptionPatterns) {
      const match = text.match(pattern)
      if (match && match[1] && match[1].trim().length > 20) {
        bookInfo.description = match[1].trim()
        break
      }
    }

    // 저자 소개 추출
    const authorBioPatterns = [
      /저자\s*(?:소개|프로필)[:\s]*\n([\s\S]*?)(?=\n\n|\n[가-힣]+[:\s]|$)/gi,
      /지은이\s*(?:소개|프로필)[:\s]*\n([\s\S]*?)(?=\n\n|\n[가-힣]+[:\s]|$)/gi
    ]

    for (const pattern of authorBioPatterns) {
      const match = text.match(pattern)
      if (match && match[1] && match[1].trim().length > 10) {
        bookInfo.author_bio = match[1].trim()
        break
      }
    }

    // 카테고리 추정 (키워드 기반)
    const categoryKeywords = {
      'IT전문서': ['프로그래밍', '개발', '코딩', '소프트웨어', '시스템', '데이터베이스', '알고리즘', '머신러닝', 'AI', '인공지능'],
      'IT활용서': ['엑셀', '파워포인트', '워드', '오피스', '컴퓨터 활용', '인터넷', '스마트폰'],
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

  // 메인 추출 함수
  async extractBookInfoFromUrl(documentUrl) {
    try {
      const documentId = this.extractDocumentId(documentUrl)
      if (!documentId) {
        throw new Error('올바른 Google Docs URL이 아닙니다.')
      }

      const document = await this.getDocumentContent(documentId)
      const text = this.extractText(document)
      const bookInfo = this.parseBookInfo(text)

      return {
        success: true,
        data: bookInfo,
        extractedText: text // 디버깅용
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: null
      }
    }
  }
}

export default GoogleDocsExtractor