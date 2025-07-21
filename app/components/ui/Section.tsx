import { ReactNode } from 'react'
import Container from './Container'

interface SectionProps {
  children: ReactNode
  className?: string
  containerSize?: 'sm' | 'default' | 'lg' | 'xl' | 'full'
  padding?: 'none' | 'sm' | 'default' | 'lg' | 'xl'
  background?: 'transparent' | 'white' | 'neutral' | 'primary' | 'secondary' | 'gradient' | 'gradient-subtle' | 'gradient-warm' | 'glass' | 'dark'
  [key: string]: any
}

const Section = ({ 
  children, 
  className = '',
  containerSize = 'default',
  padding = 'default',
  background = 'transparent',
  ...props 
}: SectionProps) => {
  const paddings = {
    none: '',
    sm: 'py-8',
    default: 'py-16',
    lg: 'py-20',
    xl: 'py-24',
  }
  
  const backgrounds = {
    transparent: '',
    white: 'bg-white',
    neutral: 'bg-neutral-50',
    primary: 'bg-primary-500 text-white',
    secondary: 'bg-secondary-500 text-neutral-900',
    gradient: 'bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 text-white',
    'gradient-subtle': 'bg-gradient-to-br from-neutral-50 to-white',
    'gradient-warm': 'bg-gradient-to-br from-primary-50 via-secondary-50 to-white',
    'glass': 'bg-white/80 backdrop-blur-lg border-y border-white/20',
    'dark': 'bg-neutral-900 text-white',
  }
  
  const classes = `${paddings[padding as keyof typeof paddings]} ${backgrounds[background as keyof typeof backgrounds]} ${className}`
  
  return (
    <section className={classes} {...props}>
      <Container size={containerSize}>
        {children}
      </Container>
    </section>
  )
}

interface SectionHeaderProps {
  title?: string
  description?: string
  className?: string
  titleClassName?: string
  descriptionClassName?: string
  centered?: boolean
}

const SectionHeader = ({ 
  title, 
  description, 
  className = '',
  titleClassName = '',
  descriptionClassName = '',
  centered = true 
}: SectionHeaderProps) => {
  const headerClasses = centered ? 'text-center mb-12' : 'mb-12'
  
  return (
    <div className={`${headerClasses} ${className}`}>
      {title && (
        <h2 className={`text-3xl lg:text-4xl font-bold mb-4 ${titleClassName}`}>
          {title}
        </h2>
      )}
      {description && (
        <p className={`text-lg text-neutral-600 max-w-2xl ${centered ? 'mx-auto' : ''} ${descriptionClassName}`}>
          {description}
        </p>
      )}
    </div>
  )
}

Section.Header = SectionHeader

export default Section