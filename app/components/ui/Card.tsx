import { ReactNode, ComponentType } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  variant?: 'default' | 'elevated' | 'outlined' | 'glass' | 'glass-strong' | 'gradient' | 'premium'
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  hover?: boolean
  as?: ComponentType<any> | string
  [key: string]: any
}

const Card = ({ 
  children, 
  className = '', 
  variant = 'default',
  padding = 'md',
  hover = false,
  as: Component = 'div',
  ...props 
}: CardProps) => {
  const baseClasses = 'bg-white rounded-xl transition-all duration-200'
  
  const variants = {
    default: 'border border-neutral-200',
    elevated: 'shadow-lg border-0',
    outlined: 'border-2 border-neutral-300',
    glass: 'backdrop-blur-sm bg-white/80 border border-white/20',
    'glass-strong': 'backdrop-blur-md bg-white/70 border border-white/30 shadow-xl',
    'gradient': 'border-0 bg-gradient-to-br from-white via-white to-neutral-50',
    'premium': 'border-0 bg-gradient-to-br from-white to-neutral-50/50 shadow-xl ring-1 ring-neutral-200/50',
  }
  
  const paddings = {
    none: '',
    sm: 'p-3 sm:p-4',
    md: 'p-4 sm:p-6',
    lg: 'p-6 sm:p-8',
    xl: 'p-8 sm:p-10',
  }
  
  const hoverEffect = hover ? 'hover:shadow-xl hover:-translate-y-1 cursor-pointer group' : ''
  
  const classes = `${baseClasses} ${variants[variant as keyof typeof variants]} ${paddings[padding as keyof typeof paddings]} ${hoverEffect} ${className}`
  
  return (
    <Component className={classes} {...props}>
      {children}
    </Component>
  )
}

interface CardSubComponentProps {
  children: ReactNode
  className?: string
}

const CardHeader = ({ children, className = '' }: CardSubComponentProps) => (
  <div className={`mb-3 sm:mb-4 ${className}`}>
    {children}
  </div>
)

const CardTitle = ({ children, className = '' }: CardSubComponentProps) => (
  <h3 className={`text-base sm:text-lg font-semibold text-neutral-900 ${className}`}>
    {children}
  </h3>
)

const CardDescription = ({ children, className = '' }: CardSubComponentProps) => (
  <p className={`text-sm sm:text-base text-neutral-600 ${className}`}>
    {children}
  </p>
)

const CardContent = ({ children, className = '' }: CardSubComponentProps) => (
  <div className={`p-4 sm:p-6 ${className}`}>
    {children}
  </div>
)

const CardFooter = ({ children, className = '' }: CardSubComponentProps) => (
  <div className={`mt-4 sm:mt-6 ${className}`}>
    {children}
  </div>
)

// Attach sub-components
const CardWithSubComponents = Card as typeof Card & {
  Header: typeof CardHeader
  Title: typeof CardTitle
  Description: typeof CardDescription
  Content: typeof CardContent
  Footer: typeof CardFooter
}

CardWithSubComponents.Header = CardHeader
CardWithSubComponents.Title = CardTitle
CardWithSubComponents.Description = CardDescription
CardWithSubComponents.Content = CardContent
CardWithSubComponents.Footer = CardFooter

export default CardWithSubComponents