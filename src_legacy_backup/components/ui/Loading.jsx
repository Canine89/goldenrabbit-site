const Loading = ({ 
  size = 'md', 
  variant = 'spinner',
  className = '',
  text,
  ...props 
}) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  }
  
  const spinnerSizes = {
    sm: 'border-2',
    md: 'border-4',
    lg: 'border-4',
    xl: 'border-4',
  }
  
  if (variant === 'dots') {
    return (
      <div className={`flex items-center justify-center space-x-1 ${className}`} {...props}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`bg-primary-500 rounded-full animate-pulse ${
              size === 'sm' ? 'w-2 h-2' : 
              size === 'md' ? 'w-3 h-3' : 
              size === 'lg' ? 'w-4 h-4' : 'w-5 h-5'
            }`}
            style={{
              animationDelay: `${i * 0.2}s`,
              animationDuration: '1.4s'
            }}
          />
        ))}
        {text && <span className="ml-3 text-neutral-600">{text}</span>}
      </div>
    )
  }
  
  if (variant === 'pulse') {
    return (
      <div className={`flex items-center justify-center ${className}`} {...props}>
        <div className={`bg-primary-200 rounded-full animate-pulse ${sizes[size]}`} />
        {text && <span className="ml-3 text-neutral-600">{text}</span>}
      </div>
    )
  }
  
  // Default spinner
  return (
    <div className={`flex items-center justify-center ${className}`} {...props}>
      <div
        className={`animate-spin rounded-full border-primary-500 border-t-transparent ${sizes[size]} ${spinnerSizes[size]}`}
        role="status"
        aria-label={text || "로딩 중"}
      />
      {text && <span className="ml-3 text-neutral-600">{text}</span>}
    </div>
  )
}

// 스켈레톤 로딩 컴포넌트
const Skeleton = ({ 
  className = '',
  variant = 'text',
  width,
  height,
  ...props 
}) => {
  const variants = {
    text: 'h-4 bg-neutral-200 rounded',
    title: 'h-6 bg-neutral-200 rounded',
    avatar: 'h-12 w-12 bg-neutral-200 rounded-full',
    button: 'h-10 bg-neutral-200 rounded-lg',
    card: 'h-48 bg-neutral-200 rounded-xl',
    image: 'aspect-video bg-neutral-200 rounded-lg',
  }
  
  const style = {}
  if (width) style.width = width
  if (height) style.height = height
  
  return (
    <div
      className={`animate-pulse ${variants[variant]} ${className}`}
      style={style}
      {...props}
    />
  )
}

Loading.Skeleton = Skeleton

export default Loading