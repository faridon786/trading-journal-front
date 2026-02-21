import type { CSSProperties, ReactNode } from 'react'

interface Props {
  children: ReactNode
  className?: string
  style?: CSSProperties
}

export function Card({ children, className = '', style }: Props) {
  return (
    <div className={`card ${className}`.trim()} style={style}>
      {children}
    </div>
  )
}

export function CardBody({ children, className = '', style }: Props) {
  return (
    <div className={`card__body ${className}`.trim()} style={style}>
      {children}
    </div>
  )
}
