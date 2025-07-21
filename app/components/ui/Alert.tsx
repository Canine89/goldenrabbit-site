import { useState, ReactNode } from 'react'

interface AlertProps {
  children: ReactNode
  variant?: 'info' | 'success' | 'warning' | 'danger' | 'neutral'
  dismissible?: boolean
  onDismiss?: () => void
  className?: string
  icon?: ReactNode | false
  title?: string
  [key: string]: any
}

const Alert = ({ 
  children, 
  variant = 'info',
  dismissible = false,
  onDismiss,
  className = '',
  icon,
  title,
  ...props 
}: AlertProps) => {
  const [isVisible, setIsVisible] = useState(true)
  
  const variants = {
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    success: 'bg-green-50 border-green-200 text-green-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    danger: 'bg-red-50 border-red-200 text-red-800',
    neutral: 'bg-neutral-50 border-neutral-200 text-neutral-800',
  }
  
  const iconVariants = {
    info: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    success: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    warning: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
    ),
    danger: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    neutral: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  }
  
  const handleDismiss = () => {
    setIsVisible(false)
    if (onDismiss) {
      onDismiss()
    }
  }
  
  if (!isVisible) return null
  
  return (
    <div
      className={`border rounded-lg p-4 ${variants[variant as keyof typeof variants]} ${className}`}
      role="alert"
      {...props}
    >
      <div className="flex">
        {(icon !== false) && (
          <div className="flex-shrink-0">
            {icon || iconVariants[variant as keyof typeof iconVariants]}
          </div>
        )}
        
        <div className={`${icon !== false ? 'ml-3' : ''} flex-1`}>
          {title && (
            <h4 className="font-medium mb-1">{title}</h4>
          )}
          <div className={title ? 'text-sm' : ''}>
            {children}
          </div>
        </div>
        
        {dismissible && (
          <div className="flex-shrink-0 ml-4">
            <button
              type="button"
              className="inline-flex rounded-md p-1.5 hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-current"
              onClick={handleDismiss}
            >
              <span className="sr-only">닫기</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default Alert