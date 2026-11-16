import type { HTMLAttributes } from 'react'

interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  size?: 'content' | 'wide'
}

const sizeStyles = {
  content: 'max-w-5xl',
  wide: 'max-w-7xl',
}

export function Container({ children, className = '', size = 'wide', ...props }: ContainerProps) {
  return (
    <div className={`mx-auto w-full px-4 sm:px-6 lg:px-8 ${sizeStyles[size]} ${className}`} {...props}>
      {children}
    </div>
  )
}
