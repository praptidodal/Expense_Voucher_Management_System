import React from 'react'

export interface FormGroupProps {
  label?: string
  htmlFor?: string
  required?: boolean
  helperText?: string
  error?: string
  helperId?: string
  errorId?: string
  children: React.ReactNode
  className?: string
}

export const FormGroup: React.FC<FormGroupProps> = ({
  label,
  htmlFor,
  required = false,
  helperText,
  error,
  helperId,
  errorId,
  children,
  className = '',
}) => {
  const resolvedErrorId = errorId || (htmlFor ? `${htmlFor}-error` : undefined)
  const resolvedHelperId = helperId || (htmlFor ? `${htmlFor}-helper` : undefined)

  return (
    <div className={`form-group ${className}`.trim()}>
      {label && (
        <label htmlFor={htmlFor} className="form-label">
          {label}
          {required && <span className="required" aria-hidden="true">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <span className="form-error" role="alert" id={resolvedErrorId}>
          {error}
        </span>
      ) : helperText ? (
        <span className="form-helper" id={resolvedHelperId}>
          {helperText}
        </span>
      ) : null}
    </div>
  )
}
