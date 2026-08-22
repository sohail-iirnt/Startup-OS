import type { ReactNode } from 'react'

type EmptyStateProps = {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
}

function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex min-h-[260px] flex-col items-center justify-center px-6 py-10 text-center">
      {icon && (
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] text-[var(--os-text-muted)]">
          {icon}
        </div>
      )}

      <h3 className="mt-4 text-sm font-semibold text-[var(--os-text)]">
        {title}
      </h3>

      {description && (
        <p className="mt-1.5 max-w-sm text-xs leading-5 text-[var(--os-text-muted)]">
          {description}
        </p>
      )}

      {action && (
        <div className="mt-5">
          {action}
        </div>
      )}
    </div>
  )
}

export default EmptyState