import type { ReactNode } from 'react'

type StatCardProps = {
  label: string
  value: string
  description?: string
  icon?: ReactNode
  trend?: {
    value: string
    positive?: boolean
  }
}

function StatCard({
  label,
  value,
  description,
  icon,
  trend,
}: StatCardProps) {
  return (
    <div className="os-card os-card-hover p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm text-[var(--os-text-muted)]">
            {label}
          </p>

          <p className="mt-3 truncate text-3xl font-semibold tracking-tight text-[var(--os-text)]">
            {value}
          </p>
        </div>

        {icon && (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--os-accent-soft)] text-[var(--os-accent)]">
            {icon}
          </div>
        )}
      </div>

      {(description || trend) && (
        <div className="mt-3 flex items-center gap-2 text-xs">
          {trend && (
            <span
              className={
                trend.positive
                  ? 'font-medium text-[var(--os-success)]'
                  : 'font-medium text-[var(--os-danger)]'
              }
            >
              {trend.positive ? '↑' : '↓'} {trend.value}
            </span>
          )}

          {description && (
            <span className="text-[var(--os-text-muted)]">
              {description}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

export default StatCard