import { useState, useEffect, useRef } from 'react'

export default function RichTextEditor({ value = '', onChange, placeholder = '내용을 입력하세요...' }) {
  const [isMarkdownMode, setIsMarkdownMode] = useState(false)
  const [content, setContent] = useState(value)
  const [previewMode, setPreviewMode] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null)
  const [showSizePopup, setShowSizePopup] = useState(false)
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 })
  const [currentImageWidth, setCurrentImageWidth] = useState('')
  const textareaRef = useRef(null)
  const previewRef = useRef(null)
  const contentEditableRef = useRef(null)

  useEffect(() => {
    setContent(value)
    // contentEditable도 업데이트
    if (contentEditableRef.current && previewMode) {
      contentEditableRef.current.innerHTML = value || '<p>내용을 입력하세요...</p>'
    }
  }, [value, previewMode])

  const handleContentChange = (newContent) => {
    setContent(newContent)
    onChange(newContent)
  }

  // 텍스트 스타일 적용 함수
  const applyStyle = (tag) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = content.substring(start, end)
    
    let newText = ''
    
    switch (tag) {
      case 'bold':
        newText = isMarkdownMode ? `**${selectedText}**` : `<strong>${selectedText}</strong>`
        break
      case 'italic':
        newText = isMarkdownMode ? `*${selectedText}*` : `<em>${selectedText}</em>`
        break
      case 'h1':
        newText = isMarkdownMode ? `# ${selectedText}` : `<h1>${selectedText}</h1>`
        break
      case 'h2':
        newText = isMarkdownMode ? `## ${selectedText}` : `<h2>${selectedText}</h2>`
        break
      case 'h3':
        newText = isMarkdownMode ? `### ${selectedText}` : `<h3>${selectedText}</h3>`
        break
      case 'code':
        newText = isMarkdownMode ? `\`${selectedText}\`` : `<code>${selectedText}</code>`
        break
      case 'quote':
        newText = isMarkdownMode ? `> ${selectedText}` : `<blockquote>${selectedText}</blockquote>`
        break
      case 'ul':
        const ulLines = selectedText.split('\n').map(line => isMarkdownMode ? `- ${line}` : `<li>${line}</li>`).join('\n')
        newText = isMarkdownMode ? ulLines : `<ul>\n${ulLines}\n</ul>`
        break
      case 'ol':
        const olLines = selectedText.split('\n').map((line, index) => isMarkdownMode ? `${index + 1}. ${line}` : `<li>${line}</li>`).join('\n')
        newText = isMarkdownMode ? olLines : `<ol>\n${olLines}\n</ol>`
        break
      default:
        newText = selectedText
    }

    const newContent = content.substring(0, start) + newText + content.substring(end)
    handleContentChange(newContent)

    // 커서 위치 재설정
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + newText.length, start + newText.length)
    }, 0)
  }

  // 구글 드라이브 링크 변환 함수
  const getGoogleDriveFileId = (url) => {
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

  const convertGoogleDriveUrl = (url) => {
    const fileId = getGoogleDriveFileId(url)
    if (fileId) {
      return `https://lh3.googleusercontent.com/d/${fileId}`
    }
    return url
  }

  // 이미지 URL 입력 처리
  const handleImageUrlInsert = () => {
    const url = prompt('이미지 URL을 입력하세요:\n(구글 드라이브 링크 또는 일반 이미지 URL)')
    if (!url) return

    // URL 타입에 따른 처리
    let convertedUrl
    if (url.includes('drive.google.com')) {
      // 구글 드라이브 링크 변환
      convertedUrl = convertGoogleDriveUrl(url)
    } else if (url.includes('goldenrabbit.co.kr')) {
      // goldenrabbit.co.kr 이미지는 프록시 사용
      convertedUrl = `https://images.weserv.nl/?url=${encodeURIComponent(url)}`
    } else {
      // 기타 일반 이미지는 그대로
      convertedUrl = url
    }
    
    // 이미지 크기 선택 다이얼로그
    const size = prompt('이미지 크기를 선택하세요:\n1. 작게 (300px)\n2. 중간 (500px)\n3. 크게 (700px)\n4. 최대 (100%)\n\n숫자를 입력하세요:', '4')
    
    let width = '100%'
    switch(size) {
      case '1': width = '300px'; break
      case '2': width = '500px'; break
      case '3': width = '700px'; break
      case '4': 
      default: width = '100%'; break
    }
    
    // 텍스트에 이미지 마크업 삽입
    const textarea = textareaRef.current
    const cursorPos = textarea ? textarea.selectionStart : content.length
    const imageId = Date.now()
    
    // 이미지 타입에 따른 속성 설정
    let corsAttributes = 'referrerpolicy="no-referrer"'
    if (convertedUrl.includes('googleusercontent.com') || convertedUrl.includes('drive.google.com')) {
      corsAttributes = 'crossorigin="anonymous" referrerpolicy="no-referrer"'
    } else if (convertedUrl.includes('images.weserv.nl')) {
      // 프록시 서비스도 CORS 지원
      corsAttributes = 'crossorigin="anonymous" referrerpolicy="no-referrer"'
    }
    
    const imageMarkup = isMarkdownMode 
      ? `![이미지 설명](${convertedUrl})`
      : `<div style="position: relative; display: inline-block; margin: 16px 0;"><img src="${convertedUrl}" alt="이미지 설명" style="width: ${width}; height: auto; border-radius: 8px;" ${corsAttributes} data-image-id="${imageId}" /></div>`

    const newContent = content.substring(0, cursorPos) + '\n' + imageMarkup + '\n' + content.substring(cursorPos)
    handleContentChange(newContent)

    // 커서 위치 재설정
    if (textarea) {
      setTimeout(() => {
        textarea.focus()
        textarea.setSelectionRange(cursorPos + imageMarkup.length + 2, cursorPos + imageMarkup.length + 2)
      }, 0)
    }
  }


  // 미리보기 콘텐츠 렌더링
  const renderPreviewContent = (content) => {
    if (!content) return null
    
    const processedContent = content.replace(
      /<img([^>]*?)>/g,
      (match, attributes) => {
        // 기존 style 속성에 cursor: pointer 추가
        let newAttributes = attributes
        if (attributes.includes('style=')) {
          newAttributes = attributes.replace(/style="([^"]*)"/, 'style="$1 cursor: pointer;"')
        } else {
          newAttributes = attributes + ' style="cursor: pointer; width: 100%; height: auto; border-radius: 8px; margin: 16px 0;"'
        }
        return `<img${newAttributes} />`
      }
    )
    
    return (
      <div 
        className="prose max-w-none"
        dangerouslySetInnerHTML={{ __html: processedContent }}
        style={{
          fontSize: '16px',
          lineHeight: '1.7',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
        }}
      />
    )
  }

  // contentEditable 콘텐츠 변경 처리
  const handleContentEditableChange = () => {
    if (contentEditableRef.current) {
      const newContent = contentEditableRef.current.innerHTML
      handleContentChange(newContent)
    }
  }

  // 이미지 클릭 처리 - 크기 조정 팝업 표시
  const handleImageClickForResize = (e, imageElement) => {
    e.preventDefault()
    e.stopPropagation()
    
    console.log('이미지 클릭됨:', imageElement)
    
    // 현재 이미지 크기 가져오기
    const computedStyle = window.getComputedStyle(imageElement)
    const currentWidth = parseInt(imageElement.style.width) || parseInt(computedStyle.width) || imageElement.naturalWidth
    
    // 팝업 위치 계산 (이미지 위쪽 중앙)
    const rect = imageElement.getBoundingClientRect()
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft
    
    setPopupPosition({
      x: rect.left + scrollLeft + (rect.width / 2),
      y: rect.top + scrollTop - 10
    })
    
    setCurrentImageWidth(currentWidth.toString())
    setSelectedImage(imageElement)
    setShowSizePopup(true)
  }

  // 이미지 크기 변경 처리
  const handleImageSizeChange = () => {
    if (!selectedImage || !currentImageWidth) return
    
    const newWidth = parseInt(currentImageWidth)
    if (isNaN(newWidth) || newWidth < 50 || newWidth > 1000) {
      alert('50px~1000px 사이의 값을 입력해주세요.')
      return
    }
    
    // 이미지 크기 적용
    selectedImage.style.width = newWidth + 'px'
    selectedImage.style.height = 'auto'
    
    // HTML 콘텐츠 업데이트
    setTimeout(() => {
      if (contentEditableRef.current) {
        const newContent = contentEditableRef.current.innerHTML
        handleContentChange(newContent)
      }
    }, 100)
    
    // 팝업 닫기
    setShowSizePopup(false)
    setSelectedImage(null)
    setCurrentImageWidth('')
    
    console.log('✅ 이미지 크기 변경 완료:', newWidth + 'px')
  }

  // 팝업 닫기
  const closeSizePopup = () => {
    setShowSizePopup(false)
    setSelectedImage(null)
    setCurrentImageWidth('')
  }

  // 미리보기 콘텐츠 렌더링 (이미지 편집 가능)
  const renderEditableContent = (content) => {
    if (!content) return null
    
    const processedContent = content.replace(
      /<img([^>]*?)>/g,
      (match, attributes) => {
        const imageId = attributes.match(/data-image-id="([^"]*)"/)
        const id = imageId ? imageId[1] : Date.now()
        
        return `<div class="image-container" style="position: relative; display: inline-block; margin: 16px 0;">
          <img${attributes} onclick="window.handleImageSelect && window.handleImageSelect(this)" data-image-id="${id}" style="cursor: pointer; ${attributes.includes('style=') ? '' : 'width: 100%; height: auto; border-radius: 8px;'}" />
        </div>`
      }
    )
    
    return (
      <div 
        className="prose max-w-none"
        dangerouslySetInnerHTML={{ __html: processedContent }}
        style={{
          fontSize: '16px',
          lineHeight: '1.7',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
        }}
      />
    )
  }

  // 컴포넌트 정리
  useEffect(() => {
    return () => {
      setSelectedImage(null)
      setShowSizePopup(false)
      setCurrentImageWidth('')
    }
  }, [])


  return (
    <div className="border border-neutral-300 rounded-lg overflow-hidden">
      {/* CSS 스타일 */}
      <style>{`
        .image-size-popup {
          position: fixed;
          background: white;
          border: 1px solid #ddd;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          padding: 12px;
          z-index: 2000;
          transform: translateX(-50%);
          min-width: 200px;
        }
        .image-size-popup::before {
          content: '';
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          border: 6px solid transparent;
          border-top-color: white;
        }
        .image-size-popup::after {
          content: '';
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          border: 7px solid transparent;
          border-top-color: #ddd;
          z-index: -1;
        }
        .size-input {
          width: 80px;
          padding: 4px 6px;
          border: 1px solid #ccc;
          border-radius: 4px;
          text-align: center;
          font-size: 14px;
        }
        .size-button {
          padding: 4px 8px;
          margin-left: 6px;
          border: none;
          border-radius: 4px;
          background: #007cba;
          color: white;
          cursor: pointer;
          font-size: 12px;
        }
        .size-button:hover {
          background: #005a8a;
        }
        .size-button.cancel {
          background: #6b7280;
          margin-left: 4px;
        }
        .size-button.cancel:hover {
          background: #4b5563;
        }
      `}</style>
      {/* 툴바 */}
      <div className="bg-neutral-50 border-b border-neutral-300 p-3 flex items-center justify-between flex-wrap gap-2">
        {/* 텍스트 스타일 버튼들 */}
        <div className="flex items-center gap-1 flex-wrap">
          <button
            type="button"
            onClick={() => applyStyle('bold')}
            className="px-2 py-1 text-sm border border-neutral-300 rounded hover:bg-neutral-100 transition-colors"
            title="굵게 (Ctrl+B)"
          >
            <strong>B</strong>
          </button>
          <button
            type="button"
            onClick={() => applyStyle('italic')}
            className="px-2 py-1 text-sm border border-neutral-300 rounded hover:bg-neutral-100 transition-colors"
            title="기울임 (Ctrl+I)"
          >
            <em>I</em>
          </button>
          <div className="w-px h-6 bg-neutral-300 mx-1"></div>
          <button
            type="button"
            onClick={() => applyStyle('h1')}
            className="px-2 py-1 text-sm border border-neutral-300 rounded hover:bg-neutral-100 transition-colors"
            title="제목 1"
          >
            H1
          </button>
          <button
            type="button"
            onClick={() => applyStyle('h2')}
            className="px-2 py-1 text-sm border border-neutral-300 rounded hover:bg-neutral-100 transition-colors"
            title="제목 2"
          >
            H2
          </button>
          <button
            type="button"
            onClick={() => applyStyle('h3')}
            className="px-2 py-1 text-sm border border-neutral-300 rounded hover:bg-neutral-100 transition-colors"
            title="제목 3"
          >
            H3
          </button>
          <div className="w-px h-6 bg-neutral-300 mx-1"></div>
          <button
            type="button"
            onClick={() => applyStyle('ul')}
            className="px-2 py-1 text-sm border border-neutral-300 rounded hover:bg-neutral-100 transition-colors"
            title="불릿 목록"
          >
            • 목록
          </button>
          <button
            type="button"
            onClick={() => applyStyle('ol')}
            className="px-2 py-1 text-sm border border-neutral-300 rounded hover:bg-neutral-100 transition-colors"
            title="번호 목록"
          >
            1. 목록
          </button>
          <button
            type="button"
            onClick={() => applyStyle('quote')}
            className="px-2 py-1 text-sm border border-neutral-300 rounded hover:bg-neutral-100 transition-colors"
            title="인용"
          >
            " 인용
          </button>
          <button
            type="button"
            onClick={() => applyStyle('code')}
            className="px-2 py-1 text-sm border border-neutral-300 rounded hover:bg-neutral-100 transition-colors font-mono"
            title="코드"
          >
            &lt;/&gt;
          </button>
          <div className="w-px h-6 bg-neutral-300 mx-1"></div>
          <button
            type="button"
            onClick={handleImageUrlInsert}
            className="px-2 py-1 text-sm border border-neutral-300 rounded hover:bg-neutral-100 transition-colors"
            title="이미지 URL 삽입 (구글 드라이브 또는 일반 이미지)"
          >
            🖼️ 이미지
          </button>
        </div>

        {/* 모드 전환 */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                setPreviewMode(false)
                setSelectedImage(null)
                setIsMarkdownMode(!isMarkdownMode)
              }}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                isMarkdownMode 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-neutral-200 text-neutral-700 hover:bg-neutral-300'
              }`}
            >
              {isMarkdownMode ? 'Markdown' : 'HTML'}
            </button>
            <button
              type="button"
              onClick={() => {
                setPreviewMode(!previewMode)
                setSelectedImage(null)
              }}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                previewMode 
                  ? 'bg-green-500 text-white' 
                  : 'bg-neutral-200 text-neutral-700 hover:bg-neutral-300'
              }`}
            >
              {previewMode ? '텍스트' : '미리보기'}
            </button>
          </div>
        </div>
      </div>

      {/* 에디터/미리보기 영역 */}
      <div className="relative">
        {previewMode ? (
          /* 미리보기 모드 (편집 가능) */
          <div 
            ref={contentEditableRef}
            contentEditable={true}
            suppressContentEditableWarning={true}
            className="w-full h-[500px] p-4 overflow-y-auto bg-white outline-none prose max-w-none"
            style={{
              fontSize: '16px',
              lineHeight: '1.7',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
            }}
            onInput={handleContentEditableChange}
            onPaste={(e) => {
              // HTML 붙여넣기 허용
              setTimeout(handleContentEditableChange, 0)
            }}
            onClick={(e) => {
              console.log('클릭된 요소:', e.target.tagName, e.target)
              if (e.target.tagName === 'IMG') {
                handleImageClickForResize(e, e.target)
              } else {
                // 다른 곳 클릭시 팝업 닫기
                if (showSizePopup) {
                  closeSizePopup()
                }
              }
            }}
            dangerouslySetInnerHTML={{ 
              __html: content || '<p>내용을 입력하세요...</p>' 
            }}
          />
        ) : (
          /* HTML 편집 모드 */
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            placeholder={placeholder}
            className="w-full h-[500px] p-4 border-none outline-none resize-none font-mono text-sm leading-6"
            style={{ 
              fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Inconsolata, "Roboto Mono", monospace'
            }}
          />
        )}
      </div>

      {/* 이미지 크기 조정 팝업 */}
      {showSizePopup && (
        <div 
          className="image-size-popup"
          style={{
            left: `${popupPosition.x}px`,
            top: `${popupPosition.y}px`
          }}
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">크기:</span>
            <input
              type="number"
              value={currentImageWidth}
              onChange={(e) => setCurrentImageWidth(e.target.value)}
              className="size-input"
              placeholder="300"
              min="50"
              max="1000"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleImageSizeChange()
                } else if (e.key === 'Escape') {
                  closeSizePopup()
                }
              }}
              autoFocus
            />
            <span className="text-sm text-gray-500">px</span>
            <button
              onClick={handleImageSizeChange}
              className="size-button"
              title="적용"
            >
              ✓
            </button>
            <button
              onClick={closeSizePopup}
              className="size-button cancel"
              title="취소"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* 도움말 */}
      <div className="bg-neutral-50 border-t border-neutral-300 p-3 text-xs text-neutral-600">
        <strong>도움말:</strong> 
        {isMarkdownMode ? (
          <span> **굵게**, *기울임*, # 제목, - 목록, &gt; 인용, `코드`, ![alt](url) 이미지</span>
        ) : (
          <span> &lt;strong&gt;굵게&lt;/strong&gt;, &lt;em&gt;기울임&lt;/em&gt;, &lt;h1&gt;제목&lt;/h1&gt;, &lt;li&gt;목록&lt;/li&gt;</span>
        )}
        <span> | 🖼️ 이미지 URL 삽입 (구글 드라이브/일반 이미지) 후 미리보기 모드에서 텍스트 편집 + 이미지 클릭 → 크기 조정</span>
      </div>
    </div>
  )
}