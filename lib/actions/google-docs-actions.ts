'use server'

import { GoogleDocsUrlSchema } from './schemas'
import { 
  createSuccessResponse,
  createErrorResponse,
  logError
} from './utils'
import { ActionResult } from './types'

// 구글 문서 텍스트 가져오기
export async function fetchGoogleDocText(formData: FormData): Promise<ActionResult<{ text: string }>> {
  try {
    // FormData를 객체로 변환
    const rawData = Object.fromEntries(formData.entries())

    // 데이터 검증
    const validatedData = GoogleDocsUrlSchema.parse(rawData)
    
    // 구글 문서 ID 추출
    const match = validatedData.url.match(/\/document\/d\/([a-zA-Z0-9-_]+)/)
    if (!match) {
      return createErrorResponse('올바른 구글 문서 URL이 아닙니다')
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
      let errorMessage = `구글 문서 가져오기 실패: ${response.status} ${response.statusText}`
      
      if (response.status === 403) {
        errorMessage += '\n\n문서가 "링크가 있는 모든 사용자"에게 공개되어 있는지 확인해주세요.'
      } else if (response.status === 404) {
        errorMessage += '\n\n문서를 찾을 수 없습니다. URL을 다시 확인해주세요.'
      }
      
      return createErrorResponse(errorMessage)
    }

    const text = await response.text()
    
    if (!text || text.trim().length === 0) {
      return createErrorResponse('문서 내용이 비어있습니다. 문서가 공개되어 있는지 확인해주세요.')
    }

    // 텍스트 정리 (불필요한 공백 제거 등)
    const cleanedText = text
      .replace(/\r\n/g, '\n')  // Windows 줄바꿈을 Unix 형식으로 변환
      .replace(/\n{3,}/g, '\n\n')  // 3개 이상의 연속 줄바꿈을 2개로 제한
      .trim()

    return createSuccessResponse({ text: cleanedText }, '구글 문서 내용을 성공적으로 가져왔습니다')
    
  } catch (error) {
    logError('fetchGoogleDocText', error)
    
    if (error instanceof Error && error.name === 'ZodError') {
      return createErrorResponse('입력된 URL이 올바르지 않습니다', error.message)
    }
    
    // 네트워크 오류나 기타 오류 처리
    let errorMessage = '구글 문서 가져오기 중 오류가 발생했습니다'
    
    if (error instanceof Error) {
      if (error.message.includes('fetch')) {
        errorMessage += '\n\n네트워크 연결을 확인해주세요.'
      } else if (error.message.includes('timeout')) {
        errorMessage += '\n\n요청 시간이 초과되었습니다. 다시 시도해주세요.'
      } else {
        errorMessage += `\n\n오류 내용: ${error.message}`
      }
    }
    
    errorMessage += '\n\n문서가 "링크가 있는 모든 사용자"에게 공개되어 있는지 확인해주세요.'
    
    return createErrorResponse(errorMessage)
  }
}

// 구글 문서 URL에서 문서 ID 추출
export async function extractGoogleDocId(url: string): Promise<ActionResult<{ documentId: string }>> {
  try {
    const validatedData = GoogleDocsUrlSchema.parse({ url })
    
    const match = validatedData.url.match(/\/document\/d\/([a-zA-Z0-9-_]+)/)
    if (!match) {
      return createErrorResponse('올바른 구글 문서 URL이 아닙니다')
    }

    const documentId = match[1]
    return createSuccessResponse({ documentId }, '문서 ID를 성공적으로 추출했습니다')
    
  } catch (error) {
    logError('extractGoogleDocId', error)
    
    if (error instanceof Error && error.name === 'ZodError') {
      return createErrorResponse('입력된 URL이 올바르지 않습니다', error.message)
    }
    
    return createErrorResponse('문서 ID 추출 중 오류가 발생했습니다')
  }
}

// 구글 문서 공개 여부 확인
export async function checkGoogleDocAccess(documentId: string): Promise<ActionResult<{ accessible: boolean }>> {
  try {
    const exportUrl = `https://docs.google.com/document/d/${documentId}/export?format=txt`
    
    // HEAD 요청으로 접근 가능성만 확인
    const response = await fetch(exportUrl, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; GoldenRabbit-DocsImporter/1.0)',
      }
    })

    const accessible = response.ok
    
    if (!accessible) {
      let message = '문서에 접근할 수 없습니다'
      
      if (response.status === 403) {
        message = '문서가 비공개입니다. "링크가 있는 모든 사용자"에게 공개해주세요.'
      } else if (response.status === 404) {
        message = '문서를 찾을 수 없습니다. URL을 확인해주세요.'
      }
      
      return createSuccessResponse({ accessible }, message)
    }

    return createSuccessResponse(
      { accessible }, 
      '문서에 접근할 수 있습니다'
    )
    
  } catch (error) {
    logError('checkGoogleDocAccess', error)
    return createErrorResponse('문서 접근성 확인 중 오류가 발생했습니다')
  }
}