import { useState, useEffect, useCallback } from 'react'

const SmartImage = ({ 
  src, 
  alt, 
  className = '', 
  fallback = null,
  onError = null,
  loading = 'lazy',
  priority = false,
  ...props 
}) => {
  const [currentUrl, setCurrentUrl] = useState('')
  const [urlIndex, setUrlIndex] = useState(0)
  const [imageError, setImageError] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  const getGoogleDriveFileId = (url) => {
    if (!url) return null
    
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

  const convertGoogleDriveUrl = useCallback((url) => {
    const fileId = getGoogleDriveFileId(url)
    if (fileId) {
      return `https://lh3.googleusercontent.com/d/${fileId}`
    }
    return url
  }, [])

  useEffect(() => {
    if (src) {
      const convertedUrl = convertGoogleDriveUrl(src)
      setCurrentUrl(convertedUrl)
      setUrlIndex(0)
      setImageError(false)
      setIsLoaded(false)
    }
  }, [src, convertGoogleDriveUrl])

  const handleImageError = useCallback(() => {
    setImageError(true)
    if (onError) {
      onError()
    }
  }, [onError])

  const handleImageLoad = useCallback(() => {
    setIsLoaded(true)
  }, [])

  // 이미지 에러 시 fallback 처리
  if (imageError) {
    if (fallback) {
      return fallback
    }
    
    return (
      <div className={`bg-gray-200 flex items-center justify-center ${className}`}>
        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    )
  }

  if (!currentUrl) {
    return (
      <div className={`bg-neutral-200 flex items-center justify-center ${className}`}>
        <div className="animate-pulse">
          <svg className="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      {/* 로딩 오버레이 */}
      {!isLoaded && !imageError && (
        <div className="absolute inset-0 bg-neutral-200 animate-pulse flex items-center justify-center">
          <svg className="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      )}
      
      <img
        src={currentUrl}
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        onError={handleImageError}
        onLoad={handleImageLoad}
        loading={priority ? 'eager' : loading}
        crossOrigin="anonymous"
        referrerPolicy="no-referrer"
        {...props}
      />
    </div>
  )
}

export default SmartImage