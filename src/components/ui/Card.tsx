import type { HTMLAttributes, ReactNode } from 'react'

type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode
  hover?: boolean
}

function Card({
  children,
  hover = false,
  className = '',
  ...props
}: CardProps) {
  return (
    <div
      className={[
        'os-card',
        hover ? 'os-card-hover' : '',
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </div>
  )
}

export default Card