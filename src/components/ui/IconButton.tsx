import type { ButtonHTMLAttributes, ReactNode } from 'react'

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode
  label: string
  size?: 'sm' | 'md' | 'lg'
}

const sizes = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-11 w-11',
}

function IconButton({
  children,
  label,
  size = 'md',
  className = '',
  ...props
}: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={[
        'os-focus-ring inline-flex shrink-0 items-center justify-center',
        'rounded-xl text-[var(--os-text-secondary)]',
        'transition-all duration-200',
        'hover:bg-[var(--os-surface-hover)] hover:text-[var(--os-text)]',
        'disabled:cursor-not-allowed disabled:opacity-50',
        sizes[size],
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </button>
  )
}

export default IconButton