import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  children: ReactNode
  icon?: ReactNode
}

export function Button({ variant = 'primary', children, icon, className = '', disabled, ...props }: Props) {
  const classes = ['btn', `btn--${variant}`, className].filter(Boolean).join(' ')
  return (
    <button type="button" className={classes} disabled={disabled} {...props}>
      {icon}
      {children}
    </button>
  )
}
