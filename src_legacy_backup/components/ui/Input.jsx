import { forwardRef } from 'react'

const Input = forwardRef(({ 
  label,
  error,
  helperText,
  className = '',
  containerClassName = '',
  ...props 
}, ref) => {
  const baseInputClasses = 'w-full px-3 py-2 border rounded-lg text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors'
  
  const errorClasses = error 
    ? 'border-red-300 focus:ring-red-500' 
    : 'border-neutral-300 hover:border-neutral-400'
  
  const inputClasses = `${baseInputClasses} ${errorClasses} ${className}`
  
  return (
    <div className={containerClassName}>
      {label && (
        <label className="block text-sm font-medium text-neutral-700 mb-1">
          {label}
        </label>
      )}
      
      <input
        ref={ref}
        className={inputClasses}
        {...props}
      />
      
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      
      {helperText && !error && (
        <p className="mt-1 text-sm text-neutral-500">{helperText}</p>
      )}
    </div>
  )
})

Input.displayName = 'Input'

export default Input