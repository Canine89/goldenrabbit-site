'use client'

import { useState, useRef, useEffect } from 'react'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export default function RichTextEditor({ 
  value, 
  onChange, 
  placeholder = '내용을 입력하세요...', 
  className = '' 
}: RichTextEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [cursorPosition, setCursorPosition] = useState(0)

  // 텍스트 영역 자동 크기 조정
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${textarea.scrollHeight}px`
    }
  }, [value])

  // 커서 위치 저장
  const handleSelectionChange = () => {
    if (textareaRef.current) {
      setCursorPosition(textareaRef.current.selectionStart)
    }
  }

  // 텍스트 삽입 함수
  const insertText = (textToInsert: string) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const newValue = value.substring(0, start) + textToInsert + value.substring(end)
    
    onChange(newValue)
    
    // 커서 위치를 삽입된 텍스트 뒤로 이동
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + textToInsert.length, start + textToInsert.length)
    }, 0)
  }

  // 선택된 텍스트를 감싸는 함수
  const wrapSelectedText = (before: string, after: string = '') => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = value.substring(start, end)
    
    const replacement = before + selectedText + after
    const newValue = value.substring(0, start) + replacement + value.substring(end)
    
    onChange(newValue)
    
    // 커서 위치 조정
    setTimeout(() => {
      textarea.focus()
      if (selectedText) {
        textarea.setSelectionRange(start + before.length, end + before.length)
      } else {
        textarea.setSelectionRange(start + before.length, start + before.length)
      }
    }, 0)
  }


  // 구글 드라이브 파일 ID 추출 함수
  const getGoogleDriveFileId = (url: string) => {
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

  // 구글 드라이브 URL 변환 함수
  const convertGoogleDriveUrl = (url: string) => {
    const fileId = getGoogleDriveFileId(url)
    if (fileId) {
      // 크기 매개변수 추가하여 원본 크기로 서빙
      return `https://lh3.googleusercontent.com/d/${fileId}=w2000-h10000`
    }
    return url
  }

  // 이미지 URL 처리 및 삽입
  const handleImageUrlInsert = () => {
    const imageUrl = prompt('이미지 URL을 입력하세요:\n\n• 구글 드라이브 공유 링크\n• goldenrabbit.co.kr 이미지 URL\n• 기타 이미지 URL')
    if (imageUrl && imageUrl.trim()) {
      const processedUrl = convertGoogleDriveUrl(imageUrl.trim())
      const imageTag = `![이미지 설명](${processedUrl})`
      insertText(imageTag)
    }
  }

  // 서식 적용 함수 (마크다운만 사용)
  const applyFormat = (markdownBefore: string, markdownAfter: string = '') => {
    wrapSelectedText(markdownBefore, markdownAfter)
  }

  const insertFormat = (markdownContent: string) => {
    insertText(markdownContent)
  }

  // 툴바 버튼 스타일
  const toolbarButtonClass = "p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"

  return (
    <div className={`border border-gray-300 rounded-lg overflow-hidden ${className}`}>
      {/* 툴바 */}
      <div className="border-b border-gray-200 bg-gray-50 p-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1">

            {/* 텍스트 포맷팅 */}
            <button
              type="button"
              onClick={() => applyFormat('**', '**')}
              className={toolbarButtonClass}
              title="굵게 (**텍스트**)"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M15.6 10.79c.97-.67 1.65-1.77 1.65-2.79 0-2.26-1.75-4-4-4H7v14h7.04c2.09 0 3.71-1.7 3.71-3.79 0-1.52-.86-2.82-2.15-3.42zM10 6.5h3c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-3v-3zm3.5 9H10v-3h3.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5z"/>
              </svg>
            </button>

            <button
              type="button"
              onClick={() => applyFormat('*', '*')}
              className={toolbarButtonClass}
              title="기울임 (*텍스트*)"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4z"/>
              </svg>
            </button>

          <div className="w-px h-6 bg-gray-300 mx-2"></div>

            {/* 제목 */}
            <button
              type="button"
              onClick={() => insertFormat('\n## 제목\n\n')}
              className={toolbarButtonClass}
              title="H2 제목 추가 (##)"
            >
              <span className="text-sm font-bold">H2</span>
            </button>

            <button
              type="button"
              onClick={() => insertFormat('\n### 소제목\n\n')}
              className={toolbarButtonClass}
              title="H3 제목 추가 (###)"
            >
              <span className="text-sm font-bold">H3</span>
            </button>

          <div className="w-px h-6 bg-gray-300 mx-2"></div>

            {/* 링크 */}
            <button
              type="button"
              onClick={() => applyFormat('[', '](URL을_여기에_입력)')}
              className={toolbarButtonClass}
              title="링크 추가 ([텍스트](URL))"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </button>

            {/* 이미지 URL 삽입 */}
            <button
              type="button"
              onClick={handleImageUrlInsert}
              className={toolbarButtonClass}
              title="이미지 삽입 (![alt](URL))"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>

          <div className="w-px h-6 bg-gray-300 mx-2"></div>

            {/* 리스트 */}
            <button
              type="button"
              onClick={() => insertFormat('\n- 목록 항목\n- 목록 항목\n\n')}
              className={toolbarButtonClass}
              title="불릿 목록 추가 (- 항목)"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
              </svg>
            </button>

            <button
              type="button"
              onClick={() => insertFormat('\n1. 목록 항목\n2. 목록 항목\n\n')}
              className={toolbarButtonClass}
              title="숫자 목록 추가 (1. 항목)"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 6h13M8 12h13M8 18h13M4 6v2l2 2-2 2v2M4 12v6M4 18v-2" />
              </svg>
            </button>

          {/* 인용문 */}
          <button
            type="button"
            onClick={() => insertFormat('\n> 인용문을 여기에 입력하세요.\n\n')}
            className={toolbarButtonClass}
            title="인용문 추가 (>)"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z"/>
            </svg>
          </button>

          {/* 코드 블록 */}
          <button
            type="button"
            onClick={() => insertFormat('\n```\n코드를 여기에 입력하세요\n```\n\n')}
            className={toolbarButtonClass}
            title="코드 블록 추가 (```)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </button>

          {/* 구분선 */}
          <button
            type="button"
            onClick={() => insertFormat('\n---\n\n')}
            className={toolbarButtonClass}
            title="구분선 추가 (---)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
            </svg>
          </button>
          </div>
        </div>
      </div>

      {/* 에디터 영역 */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onSelect={handleSelectionChange}
          onKeyUp={handleSelectionChange}
          onClick={handleSelectionChange}
          placeholder={placeholder}
          className="w-full p-4 border-none outline-none resize-none min-h-[400px] font-mono text-sm leading-relaxed"
          style={{ fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace' }}
        />
      </div>

      {/* 도움말 */}
      <div className="border-t border-gray-200 bg-gray-50 p-3">
        <div className="text-xs text-gray-500 space-y-1">
          <div>
            <strong>📝 마크다운 문법:</strong> 
            **굵게**, *기울임*, ## 제목, [링크](URL), ![이미지](URL) 등
          </div>
          <div>
            <strong>🖼️ 이미지 추가:</strong> 
            이미지 버튼을 클릭하고 구글 드라이브 공유 링크나 이미지 URL을 입력하세요.
          </div>
          <div>
            <strong>📋 목록 & 기타:</strong> 
            - 항목 (불릿), 1. 항목 (숫자), &gt; 인용문, ``` 코드 ```, --- (구분선)
          </div>
        </div>
      </div>
    </div>
  )
}