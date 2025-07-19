import { useState } from 'react'
import { supabase } from '../../lib/supabase'

const ImageUpload = ({ 
  value, 
  onChange, 
  label = '이미지', 
  bucket = 'public',
  folder = 'images',
  className = ''
}) => {
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [imageError, setImageError] = useState(false)
  const [currentUrlIndex, setCurrentUrlIndex] = useState(0)

  const handleFileUpload = async (event) => {
    try {
      setUploading(true)
      setUploadError('')

      const file = event.target.files[0]
      if (!file) return

      // 파일 타입 검증
      if (!file.type.startsWith('image/')) {
        setUploadError('이미지 파일만 업로드 가능합니다.')
        return
      }

      // 파일 크기 검증 (5MB 제한)
      if (file.size > 5 * 1024 * 1024) {
        setUploadError('파일 크기는 5MB를 초과할 수 없습니다.')
        return
      }

      // 파일명 생성 (timestamp + 원본 파일명)
      const timestamp = Date.now()
      const fileName = `${timestamp}_${file.name}`
      const filePath = `${folder}/${fileName}`

      // Supabase Storage에 업로드
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        throw error
      }

      // 업로드된 파일의 공개 URL 생성
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath)

      // 부모 컴포넌트에 URL 전달
      onChange(publicUrl)

    } catch (error) {
      console.error('이미지 업로드 중 오류:', error)
      setUploadError('이미지 업로드에 실패했습니다.')
    } finally {
      setUploading(false)
    }
  }

  const getGoogleDriveFileId = (url) => {
    // Google Drive 공유 링크에서 파일 ID 추출
    if (url.includes('drive.google.com/file/d/')) {
      const match = url.match(/\/file\/d\/([a-zA-Z0-9-_]+)/)
      return match ? match[1] : null
    }
    
    if (url.includes('drive.google.com/open?id=')) {
      const match = url.match(/id=([a-zA-Z0-9-_]+)/)
      return match ? match[1] : null
    }
    
    return null
  }

  const getGoogleDriveUrls = (fileId) => {
    // 가장 안정적인 방법만 사용
    return [
      `https://lh3.googleusercontent.com/d/${fileId}`
    ]
  }

  const convertGoogleDriveUrl = (url) => {
    const fileId = getGoogleDriveFileId(url)
    if (fileId) {
      return `https://lh3.googleusercontent.com/d/${fileId}`
    }
    return url
  }

  const handleUrlChange = (event) => {
    let url = event.target.value.trim()
    
    // Google Drive 링크 자동 변환
    url = convertGoogleDriveUrl(url)
    
    // 이미지 에러 상태 초기화
    setImageError(false)
    setCurrentUrlIndex(0)
    
    onChange(url)
  }

  const handleImageError = () => {
    // 바로 에러 상태로 전환 (다른 URL 시도하지 않음)
    setImageError(true)
  }

  const handleClearImage = () => {
    onChange('')
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      
      {/* 현재 이미지 미리보기 */}
      {value && (
        <div className="relative inline-block">
          {!imageError ? (
            <img
              src={value}
              alt="미리보기"
              className="w-32 h-32 object-cover rounded-lg border border-gray-300"
              onError={handleImageError}
              crossOrigin="anonymous"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-32 h-32 bg-gray-200 rounded-lg border border-gray-300 flex flex-col items-center justify-center">
              <svg className="w-8 h-8 text-gray-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span className="text-xs text-gray-500 text-center">이미지 로드 실패</span>
              <button
                type="button"
                onClick={() => {
                  // 강제로 iframe 미리보기 시도
                  const fileId = getGoogleDriveFileId(value)
                  if (fileId) {
                    window.open(`https://drive.google.com/file/d/${fileId}/view`, '_blank')
                  }
                }}
                className="mt-1 text-xs text-blue-600 hover:text-blue-800 underline"
              >
                브라우저에서 보기
              </button>
            </div>
          )}
          <button
            type="button"
            onClick={handleClearImage}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
          >
            ×
          </button>
        </div>
      )}

      {/* 파일 업로드 */}
      <div className="flex items-center space-x-2">
        <label className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors cursor-pointer">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          {uploading ? '업로드 중...' : '파일 선택'}
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            disabled={uploading}
            className="hidden"
          />
        </label>
        
        {uploading && (
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            <span className="text-sm text-gray-600">업로드 중...</span>
          </div>
        )}
      </div>

      {/* URL 직접 입력 */}
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-500">또는</span>
        <input
          type="url"
          value={value}
          onChange={handleUrlChange}
          placeholder="https://example.com/image.jpg"
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* 에러 메시지 */}
      {uploadError && (
        <div className="text-red-600 text-sm">
          {uploadError}
        </div>
      )}

      {/* 도움말 */}
      <div className="text-xs text-gray-500">
        JPG, PNG, GIF 파일만 업로드 가능 (최대 5MB)<br />
        Google Drive 링크는 자동으로 이미지 URL로 변환됩니다<br />
        {imageError && (
          <span className="text-red-500">
            ⚠️ 이미지 로드 실패: Google Drive 파일이 공개로 설정되어 있는지 확인하세요
          </span>
        )}
      </div>
      
      {/* Google Drive 사용 안내 */}
      {value && value.includes('drive.google.com') && (
        <div className="text-xs bg-green-50 border border-green-200 rounded p-2 mt-2">
          <div className="font-medium text-green-800">✅ Google Drive 이미지 자동 변환</div>
          <ul className="text-green-700 mt-1 space-y-1">
            <li>• 변환된 URL: <code className="bg-green-100 px-1 rounded text-xs">{value}</code></li>
            <li>• 최적화된 방법으로 자동 변환되었습니다</li>
          </ul>
          <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
            <div className="font-medium text-blue-800">💡 더 안정적인 방법:</div>
            <div className="text-blue-700 mt-1 text-xs">
              파일을 다운로드 후 직접 업로드하면 더욱 안정적입니다
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ImageUpload