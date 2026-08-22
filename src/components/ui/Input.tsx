import type {
  InputHTMLAttributes,
  ReactNode,
} from 'react'

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  hint?: string
  error?: string
  icon?: ReactNode
}

function Input({
  label,
  hint,
  error,
  icon,
  id,
  className = '',
  ...props
}: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={id}
          className="mb-2 block text-sm font-medium text-[var(--os-text-secondary)]"
        >
          {label}
        </label>
      )}

      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--os-text-muted)]">
            {icon}
          </span>
        )}

        <input
          id={id}
          className={[
            'os-focus-ring h-11 w-full rounded-xl border',
            'border-[var(--os-border)]',
            'bg-[var(--os-surface-raised)]',
            'px-3.5 text-sm text-[var(--os-text)]',
            'placeholder:text-[var(--os-text-muted)]',
            'transition-all duration-200',
            'hover:border-[var(--os-border-strong)]',
            'focus:border-[var(--os-accent)]',
            'focus:bg-[var(--os-surface)]',
            'disabled:cursor-not-allowed disabled:opacity-50',
            icon ? 'pl-10' : '',
            error
              ? 'border-[var(--os-danger)] focus:border-[var(--os-danger)]'
              : '',
            className,
          ].join(' ')}
          {...props}
        />
      </div>

      {error ? (
        <p className="mt-1.5 text-xs text-[var(--os-danger)]">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-[var(--os-text-muted)]">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

export default Input