import React from 'react'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  hasError?: boolean
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ hasError = false, className = '', rows = 3, ...rest }, ref) => {
    const isAriaInvalid = hasError ? true : rest['aria-invalid']

    return (
      <textarea
        ref={ref}
        rows={rows}
        className={`form-control ${hasError ? 'has-error' : ''} ${className}`.trim()}
        aria-invalid={isAriaInvalid}
        style={{ resize: 'vertical' }}
        {...rest}
      />
    )
  }
)

Textarea.displayName = 'Textarea'
