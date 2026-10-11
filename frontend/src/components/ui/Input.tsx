import React from 'react'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ hasError = false, leftIcon, rightIcon, className = '', ...rest }, ref) => {
    const isAriaInvalid = hasError ? true : rest['aria-invalid']

    if (!leftIcon && !rightIcon) {
      return (
        <input
          ref={ref}
          className={`form-control ${hasError ? 'has-error' : ''} ${className}`.trim()}
          aria-invalid={isAriaInvalid}
          {...rest}
        />
      )
    }

    return (
      <div style={{ position: 'relative', width: '100%' }}>
        {leftIcon && (
          <span
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              display: 'flex',
              alignItems: 'center',
              pointerEvents: 'none',
              color: 'var(--color-text-muted)',
            }}
            aria-hidden="true"
          >
            {leftIcon}
          </span>
        )}
        <input
          ref={ref}
          className={`form-control ${hasError ? 'has-error' : ''} ${className}`.trim()}
          aria-invalid={isAriaInvalid}
          style={{
            paddingLeft: leftIcon ? '38px' : undefined,
            paddingRight: rightIcon ? '38px' : undefined,
          }}
          {...rest}
        />
        {rightIcon && (
          <span
            style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              display: 'flex',
              alignItems: 'center',
              pointerEvents: 'none',
              color: 'var(--color-text-muted)',
            }}
            aria-hidden="true"
          >
            {rightIcon}
          </span>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
