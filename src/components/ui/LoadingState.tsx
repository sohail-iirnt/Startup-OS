import { Loader2 } from 'lucide-react'

type LoadingStateProps = {
  label?: string
  minHeight?: string
}

function LoadingState({
  label = 'Loading...',
  minHeight = '260px',
}: LoadingStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center"
      style={{ minHeight }}
    >
      <Loader2
        size={22}
        className="animate-spin text-[var(--os-accent)]"
      />

      <p className="mt-3 text-xs text-[var(--os-text-muted)]">
        {label}
      </p>
    </div>
  )
}

export default LoadingState