const Card = ({ 
  children, 
  className = '', 
  variant = 'default',
  padding = 'md',
  hover = false,
  as: Component = 'div',
  ...props 
}) => {
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
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-10',
  }
  
  const hoverEffect = hover ? 'hover:shadow-xl hover:-translate-y-1 cursor-pointer group' : ''
  
  const classes = `${baseClasses} ${variants[variant]} ${paddings[padding]} ${hoverEffect} ${className}`
  
  return (
    <Component className={classes} {...props}>
      {children}
    </Component>
  )
}

const CardHeader = ({ children, className = '' }) => (
  <div className={`mb-4 ${className}`}>
    {children}
  </div>
)

const CardTitle = ({ children, className = '' }) => (
  <h3 className={`text-lg font-semibold text-neutral-900 ${className}`}>
    {children}
  </h3>
)

const CardDescription = ({ children, className = '' }) => (
  <p className={`text-neutral-600 ${className}`}>
    {children}
  </p>
)

const CardContent = ({ children, className = '' }) => (
  <div className={`p-6 ${className}`}>
    {children}
  </div>
)

const CardFooter = ({ children, className = '' }) => (
  <div className={`mt-6 ${className}`}>
    {children}
  </div>
)

Card.Header = CardHeader
Card.Title = CardTitle
Card.Description = CardDescription
Card.Content = CardContent
Card.Footer = CardFooter

export default Card