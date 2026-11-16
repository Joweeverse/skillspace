import React from 'react'
import { Loader2 } from 'lucide-react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  as?: 'button' | 'div' | 'span'
}

export const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  as = 'button',
  ...props 
}: ButtonProps) => {
  const baseStyles = 'inline-flex min-h-11 items-center justify-center rounded-xl font-semibold transition-all duration-200 active:scale-95 disabled:pointer-events-none disabled:opacity-50 disabled:active:scale-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
  
  const sizes = {
    sm: 'px-3 text-xs gap-1.5',
    md: 'px-5 text-sm gap-2',
    lg: 'min-h-12 px-8 text-base gap-3'
  }

  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/30 dark:bg-blue-600 dark:hover:bg-blue-500',
    secondary: 'bg-blue-50 text-blue-700 hover:bg-blue-100 hover:shadow-md dark:bg-blue-950/70 dark:text-blue-300 dark:hover:bg-blue-900/70',
    outline: 'border-2 border-gray-200 bg-transparent text-gray-700 hover:border-blue-600 hover:text-blue-600 hover:bg-blue-50/50 dark:border-slate-700 dark:text-slate-200 dark:hover:border-blue-500 dark:hover:text-blue-400 dark:hover:bg-blue-950/40',
    ghost: 'bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white',
    danger: 'bg-red-50 text-red-600 hover:bg-red-600 hover:text-white hover:shadow-lg hover:shadow-red-500/30 dark:bg-red-950/60 dark:text-red-300 dark:hover:bg-red-600 dark:hover:text-white',
    success: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white hover:shadow-lg hover:shadow-emerald-500/30 dark:bg-emerald-950/60 dark:text-emerald-300 dark:hover:bg-emerald-600 dark:hover:text-white'
  }

  const Component = as as React.ElementType

  return (
    <Component 
      className={`${baseStyles} ${sizes[size]} ${variants[variant]} ${className}`}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
      {!isLoading && leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
      {children}
      {!isLoading && rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
    </Component>
  )
}
