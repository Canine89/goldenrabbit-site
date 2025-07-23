import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()
    
    if (!url) {
      return NextResponse.json(
        { error: 'URL이 필요합니다.' },
        { status: 400 }
      )
    }

    // 구글 문서 ID 추출
    const match = url.match(/\/document\/d\/([a-zA-Z0-9-_]+)/)
    if (!match) {
      return NextResponse.json(
        { error: '올바른 구글 문서 URL이 아닙니다.' },
        { status: 400 }
      )
    }

    const documentId = match[1]
    const exportUrl = `https://docs.google.com/document/d/${documentId}/export?format=txt`
    
    // 서버에서 직접 구글 문서 가져오기
    const response = await fetch(exportUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; GoldenRabbit-DocsImporter/1.0)',
        'Accept': 'text/plain, */*'
      }
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: `구글 문서 가져오기 실패: ${response.status} ${response.statusText}` },
        { status: response.status }
      )
    }

    const text = await response.text()
    
    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: '문서 내용이 비어있습니다. 문서가 공개되어 있는지 확인해주세요.' },
        { status: 400 }
      )
    }

    return NextResponse.json({ text })
    
  } catch (error) {
    console.error('구글 문서 가져오기 오류:', error)
    return NextResponse.json(
      { 
        error: `서버 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}
        
문서가 '링크가 있는 모든 사용자'에게 공개되어 있는지 확인해주세요.` 
      },
      { status: 500 }
    )
  }
}