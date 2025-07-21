'use client'

import { useState, useCallback, useEffect } from 'react'
import Image from 'next/image'

interface SmartImageProps {
  src?: string | null
  alt: string
  className?: string
  fallback?: React.ReactNode
  width?: number
  height?: number
  fill?: boolean
  sizes?: string
  priority?: boolean
}

export default function SmartImage({ 
  src, 
  alt, 
  className = '', 
  fallback,
  width,
  height,
  fill = false,
  sizes,
  priority = false
}: SmartImageProps) {
  const [isError, setIsError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [processedSrc, setProcessedSrc] = useState<string | null>(null)

  // 구글 드라이브 파일 ID 추출 함수
  const getGoogleDriveFileId = useCallback((url: string) => {
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
  }, [])

  // 구글 드라이브 URL 변환 함수
  const convertGoogleDriveUrl = useCallback((url: string) => {
    const fileId = getGoogleDriveFileId(url)
    if (fileId) {
      return `https://lh3.googleusercontent.com/d/${fileId}`
    }
    return url
  }, [getGoogleDriveFileId])

  // src 변경 시 URL 처리
  useEffect(() => {
    if (src) {
      const converted = convertGoogleDriveUrl(src)
      setProcessedSrc(converted)
      setIsError(false)
      setIsLoading(true)
    } else {
      setProcessedSrc(null)
    }
  }, [src, convertGoogleDriveUrl])

  // src가 없거나 처리된 src가 없는 경우 fallback 표시
  if (!src || !processedSrc || isError) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 ${className}`}>
        {fallback || (
          <div className="text-gray-400 text-center p-4">
            <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-sm">이미지 없음</span>
          </div>
        )}
      </div>
    )
  }

  // fill 사용 시와 일반 사용 시 구분
  if (fill) {
    return (
      <div 
        className="relative w-full h-full" 
        style={{ 
          position: 'relative', 
          width: '100%', 
          height: '100%',
          minHeight: '400px' 
        }}
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 animate-pulse z-10">
            <div className="text-gray-400 text-center">
              <svg className="w-8 h-8 mx-auto mb-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="text-sm">로딩 중...</span>
            </div>
          </div>
        )}
        <Image
          src={processedSrc}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          className={className}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsError(true)
            setIsLoading(false)
          }}
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
      </div>
    )
  }

  // 일반 이미지 (width, height 사용)
  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 animate-pulse z-10">
          <div className="text-gray-400 text-center">
            <svg className="w-8 h-8 mx-auto mb-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="text-sm">로딩 중...</span>
          </div>
        </div>
      )}
      {width && height ? (
        <Image
          src={processedSrc}
          alt={alt}
          width={width}
          height={height}
          sizes={sizes}
          priority={priority}
          className={className}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsError(true)
            setIsLoading(false)
          }}
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
      ) : (
        // width, height가 없는 경우 일반 img 태그 사용
        <img
          src={processedSrc}
          alt={alt}
          className={`w-full h-full object-cover ${className}`}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsError(true)
            setIsLoading(false)
          }}
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
          loading={priority ? 'eager' : 'lazy'}
        />
      )}
    </div>
  )
}