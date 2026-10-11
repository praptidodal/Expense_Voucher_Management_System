import React from 'react'
import { ChevronDown } from 'lucide-react'

export interface SelectOption {
  value: string | number
  label: string
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options?: SelectOption[]
  hasError?: boolean
  placeholder?: string
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ options, hasError = false, placeholder, className = '', children, ...rest }, ref) => {
    const isAriaInvalid = hasError ? true : rest['aria-invalid']

    return (
      <div className="select-wrapper">
        <select
          ref={ref}
          className={`form-control ${hasError ? 'has-error' : ''} ${className}`.trim()}
          aria-invalid={isAriaInvalid}
          {...rest}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))
            : children}
        </select>
        <span className="select-chevron" aria-hidden="true">
          <ChevronDown size={16} strokeWidth={2} />
        </span>
      </div>
    )
  }
)

Select.displayName = 'Select'
