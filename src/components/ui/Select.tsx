import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'

export type SelectOption = { value: string; label: string; description?: string; disabled?: boolean }

type SelectProps = {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  disabled?: boolean
  className?: string
  ariaLabel?: string
}

export default function Select({ value, onChange, options, placeholder = 'Select...', disabled = false, className = '', ariaLabel }: SelectProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const selected = options.find((option) => option.value === value)

  useEffect(() => {
    if (!open) return undefined
    const handlePointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [open])

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        className="os-focus-ring flex h-10 w-full items-center justify-between gap-3 rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] px-3 text-left text-sm text-[var(--os-text)] transition hover:border-[var(--os-accent)]/50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className={selected ? 'truncate' : 'truncate text-[var(--os-text-muted)]'}>{selected?.label ?? placeholder}</span>
        <ChevronDown size={16} className={`shrink-0 text-[var(--os-text-muted)] transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div role="listbox" className="absolute z-50 mt-2 max-h-64 w-full overflow-auto rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] p-1.5 shadow-xl">
          {options.length === 0 ? <div className="px-3 py-2.5 text-xs text-[var(--os-text-muted)]">No options available</div> : options.map((option) => (
            <button
              type="button"
              role="option"
              aria-selected={option.value === value}
              key={option.value}
              disabled={option.disabled}
              onClick={() => { if (option.disabled) return; onChange(option.value); setOpen(false) }}
              className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-xs transition hover:bg-[var(--os-surface-hover)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <span className="min-w-0"><span className="block truncate font-medium text-[var(--os-text)]">{option.label}</span>{option.description && <span className="mt-0.5 block truncate text-[10px] text-[var(--os-text-muted)]">{option.description}</span>}</span>
              {option.value === value && <Check size={15} className="shrink-0 text-[var(--os-accent)]" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}