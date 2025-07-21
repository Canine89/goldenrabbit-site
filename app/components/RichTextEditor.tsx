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
  const [isMarkdownMode, setIsMarkdownMode] = useState(false)

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
      return `https://lh3.googleusercontent.com/d/${fileId}`
    }
    return url
  }

  // 이미지 URL 처리 및 삽입
  const handleImageUrlInsert = () => {
    const imageUrl = prompt('이미지 URL을 입력하세요:\n\n• 구글 드라이브 공유 링크\n• goldenrabbit.co.kr 이미지 URL\n• 기타 이미지 URL')
    if (imageUrl && imageUrl.trim()) {
      const processedUrl = convertGoogleDriveUrl(imageUrl.trim())
      const imageTag = isMarkdownMode 
        ? `![이미지 설명](${processedUrl})`
        : `<img src="${processedUrl}" alt="이미지 설명" style="width: 100%; max-width: 700px; height: auto; border-radius: 8px; margin: 16px 0;" crossorigin="anonymous" referrerpolicy="no-referrer" data-image-id="${Date.now()}" />`
      insertText(imageTag)
    }
  }

  // 서식 적용 함수 (마크다운/HTML 모드에 따라 다름)
  const applyFormat = (htmlBefore: string, htmlAfter: string, markdownBefore: string, markdownAfter: string = '') => {
    if (isMarkdownMode) {
      wrapSelectedText(markdownBefore, markdownAfter)
    } else {
      wrapSelectedText(htmlBefore, htmlAfter)
    }
  }

  const insertFormat = (htmlContent: string, markdownContent: string) => {
    insertText(isMarkdownMode ? markdownContent : htmlContent)
  }

  // 툴바 버튼 스타일
  const toolbarButtonClass = "p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"

  return (
    <div className={`border border-gray-300 rounded-lg overflow-hidden ${className}`}>
      {/* 툴바 */}
      <div className="border-b border-gray-200 bg-gray-50 p-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1">
            {/* 모드 전환 */}
            <div className="flex items-center bg-white border border-gray-300 rounded-md p-1">
              <button
                type="button"
                onClick={() => setIsMarkdownMode(false)}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                  !isMarkdownMode 
                    ? 'bg-primary-500 text-white' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title="HTML 모드"
              >
                HTML
              </button>
              <button
                type="button"
                onClick={() => setIsMarkdownMode(true)}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                  isMarkdownMode 
                    ? 'bg-primary-500 text-white' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title="마크다운 모드"
              >
                MD
              </button>
            </div>

            <div className="w-px h-6 bg-gray-300 mx-2"></div>

            {/* 텍스트 포맷팅 */}
            <button
              type="button"
              onClick={() => applyFormat('<strong>', '</strong>', '**', '**')}
              className={toolbarButtonClass}
              title={`굵게 ${isMarkdownMode ? '(**텍스트**)' : '(HTML)'}`}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M15.6 10.79c.97-.67 1.65-1.77 1.65-2.79 0-2.26-1.75-4-4-4H7v14h7.04c2.09 0 3.71-1.7 3.71-3.79 0-1.52-.86-2.82-2.15-3.42zM10 6.5h3c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-3v-3zm3.5 9H10v-3h3.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5z"/>
              </svg>
            </button>

            <button
              type="button"
              onClick={() => applyFormat('<em>', '</em>', '*', '*')}
              className={toolbarButtonClass}
              title={`기울임 ${isMarkdownMode ? '(*텍스트*)' : '(HTML)'}`}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4z"/>
              </svg>
            </button>

          <div className="w-px h-6 bg-gray-300 mx-2"></div>

            {/* 제목 */}
            <button
              type="button"
              onClick={() => insertFormat('\n<h2>제목</h2>\n\n', '\n## 제목\n\n')}
              className={toolbarButtonClass}
              title={`H2 제목 추가 ${isMarkdownMode ? '(##)' : '(HTML)'}`}
            >
              <span className="text-sm font-bold">H2</span>
            </button>

            <button
              type="button"
              onClick={() => insertFormat('\n<h3>소제목</h3>\n\n', '\n### 소제목\n\n')}
              className={toolbarButtonClass}
              title={`H3 제목 추가 ${isMarkdownMode ? '(###)' : '(HTML)'}`}
            >
              <span className="text-sm font-bold">H3</span>
            </button>

          <div className="w-px h-6 bg-gray-300 mx-2"></div>

            {/* 링크 */}
            <button
              type="button"
              onClick={() => applyFormat('<a href="URL을_여기에_입력" target="_blank">', '</a>', '[', '](URL을_여기에_입력)')}
              className={toolbarButtonClass}
              title={`링크 추가 ${isMarkdownMode ? '([텍스트](URL))' : '(HTML)'}`}
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
              title={`이미지 삽입 ${isMarkdownMode ? '(![alt](URL))' : '(HTML)'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>

          <div className="w-px h-6 bg-gray-300 mx-2"></div>

            {/* 리스트 */}
            <button
              type="button"
              onClick={() => insertFormat('\n<ul>\n<li>목록 항목</li>\n<li>목록 항목</li>\n</ul>\n\n', '\n- 목록 항목\n- 목록 항목\n\n')}
              className={toolbarButtonClass}
              title={`불릿 목록 추가 ${isMarkdownMode ? '(- 항목)' : '(HTML)'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
              </svg>
            </button>

            <button
              type="button"
              onClick={() => insertFormat('\n<ol>\n<li>목록 항목</li>\n<li>목록 항목</li>\n</ol>\n\n', '\n1. 목록 항목\n2. 목록 항목\n\n')}
              className={toolbarButtonClass}
              title={`숫자 목록 추가 ${isMarkdownMode ? '(1. 항목)' : '(HTML)'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 6h13M8 12h13M8 18h13M4 6v2l2 2-2 2v2M4 12v6M4 18v-2" />
              </svg>
            </button>

          {/* 인용문 */}
          <button
            type="button"
            onClick={() => insertFormat(
              '\n<blockquote style="border-left: 4px solid #e5e7eb; padding-left: 16px; margin: 16px 0; font-style: italic; color: #6b7280;">인용문을 여기에 입력하세요.</blockquote>\n\n',
              '\n> 인용문을 여기에 입력하세요.\n\n'
            )}
            className={toolbarButtonClass}
            title={`인용문 추가 ${isMarkdownMode ? '(>)' : '(HTML)'}`}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z"/>
            </svg>
          </button>

          {/* 코드 블록 */}
          <button
            type="button"
            onClick={() => insertFormat(
              '\n<pre style="background-color: #f5f5f5; border: 1px solid #ddd; border-radius: 4px; padding: 12px; margin: 16px 0; overflow-x: auto;"><code>코드를 여기에 입력하세요</code></pre>\n\n',
              '\n```\n코드를 여기에 입력하세요\n```\n\n'
            )}
            className={toolbarButtonClass}
            title={`코드 블록 추가 ${isMarkdownMode ? '(```)' : '(HTML)'}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </button>

          {/* 구분선 */}
          <button
            type="button"
            onClick={() => insertFormat(
              '\n<hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />\n\n',
              '\n---\n\n'
            )}
            className={toolbarButtonClass}
            title={`구분선 추가 ${isMarkdownMode ? '(---)' : '(HTML)'}`}
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
            <strong>🔄 모드 전환:</strong> 
            HTML 모드와 마크다운(MD) 모드를 선택하여 작성할 수 있습니다.
          </div>
          <div>
            <strong>📝 텍스트 서식:</strong> 
            굵게(B), 기울임(I), 제목(H2/H3), 링크 등의 버튼을 클릭하여 서식을 적용하세요.
          </div>
          <div>
            <strong>🖼️ 이미지 추가:</strong> 
            이미지 버튼을 클릭하고 구글 드라이브 공유 링크나 이미지 URL을 입력하세요.
          </div>
          <div>
            <strong>📋 목록 & 기타:</strong> 
            불릿 목록, 숫자 목록, 인용문, 코드 블록, 구분선을 쉽게 추가할 수 있습니다.
          </div>
        </div>
      </div>
    </div>
  )
}