import { ReactNode } from 'react'

interface ContainerProps {
  children: ReactNode
  size?: 'sm' | 'default' | 'lg' | 'xl' | 'full'
  className?: string
  [key: string]: any
}

const Container = ({ 
  children, 
  size = 'default',
  className = '',
  ...props 
}: ContainerProps) => {
  const sizes = {
    sm: 'max-w-3xl',
    default: 'max-w-7xl',
    lg: 'max-w-screen-xl',
    xl: 'max-w-screen-2xl',
    full: 'max-w-full',
  }
  
  const classes = `${sizes[size]} mx-auto px-4 sm:px-6 lg:px-8 ${className}`
  
  return (
    <div className={classes} {...props}>
      {children}
    </div>
  )
}

export default Container