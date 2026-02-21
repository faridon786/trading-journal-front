import type { InputHTMLAttributes } from 'react'

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helper?: string
}

export function Input({ label, error, helper, id, className = '', ...props }: Props) {
  const helperText = error ?? helper
  const helperClass = error ? 'input-helper input-helper--error' : 'input-helper'
  return (
    <div className="input-group">
      {label && <label htmlFor={id}>{label}</label>}
      <input
        id={id}
        className={`input ${error ? 'input--error' : ''} ${className}`.trim()}
        aria-invalid={Boolean(error)}
        aria-describedby={helperText ? `${id}-helper` : undefined}
        {...props}
      />
      {helperText && (
        <span id={id ? `${id}-helper` : undefined} className={helperClass}>
          {helperText}
        </span>
      )}
    </div>
  )
}
