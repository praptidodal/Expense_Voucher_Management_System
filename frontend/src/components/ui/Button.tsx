import React from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'destructive' | 'ghost'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: React.ReactNode
  fullWidth?: boolean
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  fullWidth = false,
  className = '',
  disabled = false,
  ...rest
}) => {
  const variantClass = `btn-${variant}`
  const sizeClass = size === 'md' ? '' : `btn-${size}`
  const fullWidthStyle = fullWidth ? { width: '100%' } : undefined

  return (
    <button
      className={`btn ${variantClass} ${sizeClass} ${className}`.trim()}
      style={fullWidthStyle}
      disabled={disabled}
      {...rest}
    >
      {icon && <span aria-hidden="true" style={{ display: 'inline-flex', alignItems: 'center' }}>{icon}</span>}
      {children}
    </button>
  )
}
