import type { ReactNode } from 'react'

type BadgeVariant =
  | 'default'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'accent'

type BadgeProps = {
  children: ReactNode
  variant?: BadgeVariant
  dot?: boolean
}

const variants: Record<BadgeVariant, string> = {
  default:
    'bg-[var(--os-surface-raised)] text-[var(--os-text-secondary)] border-[var(--os-border)]',
  success:
    'bg-[rgba(66,211,146,0.1)] text-[var(--os-success)] border-[rgba(66,211,146,0.2)]',
  warning:
    'bg-[rgba(245,185,66,0.1)] text-[var(--os-warning)] border-[rgba(245,185,66,0.2)]',
  danger:
    'bg-[rgba(255,100,124,0.1)] text-[var(--os-danger)] border-[rgba(255,100,124,0.2)]',
  info:
    'bg-[rgba(90,169,255,0.1)] text-[var(--os-info)] border-[rgba(90,169,255,0.2)]',
  accent:
    'bg-[var(--os-accent-soft)] text-[var(--os-accent)] border-[rgba(139,124,255,0.2)]',
}

function Badge({
  children,
  variant = 'default',
  dot = false,
}: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 rounded-full border',
        'px-2.5 py-1 text-[11px] font-medium',
        variants[variant],
      ].join(' ')}
    >
      {dot && (
        <span className="h-1.5 w-1.5 rounded-full bg-current" />
      )}

      {children}
    </span>
  )
}

export default Badge