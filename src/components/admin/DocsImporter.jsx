import { useState } from 'react'
import { useGoogleDocs } from '../../hooks/useGoogleDocs'
import { useAuth } from '../../contexts/AuthContext'

export default function DocsImporter({ onBookInfoExtracted }) {
  const [documentUrl, setDocumentUrl] = useState('')
  const { loading, error, extractBookInfoSimple, clearError } = useGoogleDocs()
  const { user } = useAuth()
  
  // Google API 환경변수 확인
  const isGoogleApiAvailable = import.meta.env.VITE_GOOGLE_CLIENT_ID && import.meta.env.VITE_GOOGLE_CLIENT_SECRET
  
  // 보도자료 접근 권한 확인
  const hasDocsAccess = (userEmail) => {
    if (!userEmail) return false
    
    // 골든래빗 도메인 이메일 확인
    const authorizedDomains = ['goldenrabbit.co.kr']
    const authorizedEmails = [
      'hgpark@goldenrabbit.co.kr',
      'hwchoi@goldenrabbit.co.kr', 
      'ohhc@goldenrabbit.co.kr'
    ]
    
    return authorizedDomains.some(domain => userEmail.endsWith(`@${domain}`)) ||
           authorizedEmails.includes(userEmail)
  }

  const handleImport = async () => {
    if (!documentUrl.trim()) {
      alert('보도자료 링크를 입력해주세요.')
      return
    }

    clearError()

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
    } catch (err) {
      console.error('도서 정보 추출 실패:', err)
    }
  }

  const handleUrlChange = (e) => {
    setDocumentUrl(e.target.value)
    if (error) {
      clearError()
    }
  }

  const isValidGoogleDocsUrl = (url) => {
    return url.includes('docs.google.com/document/d/')
  }

  // Google API 설정 및 사용자 권한 동시 확인
  const canShowDocsImporter = isGoogleApiAvailable && hasDocsAccess(user?.email)
  
  // 권한이 없거나 API가 설정되지 않은 경우 컴포넌트 숨김
  if (!canShowDocsImporter) {
    return null
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