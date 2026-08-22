import { useEffect, useState } from 'react'
import { Check, ChevronDown, UserRound } from 'lucide-react'

import { getWorkspaceMembers } from '../../services/memberService'
import type { WorkspaceMember } from '../../types/workspace'

type MemberSelectorProps = {
  workspaceId: string
  value: string | null | undefined
  onChange: (memberId: string | null) => void
  disabled?: boolean
  label?: string
}

function MemberSelector({
  workspaceId,
  value,
  onChange,
  disabled = false,
  label = 'Assign To',
}: MemberSelectorProps) {
  const [members, setMembers] = useState<WorkspaceMember[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadMembers() {
      setLoading(true)
      setError('')
      try {
        const result = await getWorkspaceMembers(workspaceId)
        if (!cancelled) setMembers(result)
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load workspace members.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadMembers()
    return () => {
      cancelled = true
    }
  }, [workspaceId])

  const selected = members.find((member) => member.userId === value)

  return (
    <div className="relative">
      <label className="mb-1.5 block text-xs font-semibold text-[var(--os-text-secondary)]">
        {label}
      </label>
      <button
        type="button"
        disabled={disabled || loading}
        onClick={() => setOpen((current) => !current)}
        className="os-focus-ring flex min-h-11 w-full items-center justify-between gap-3 rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] px-3.5 text-left text-sm text-[var(--os-text)] transition-colors hover:border-[var(--os-border-strong)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className="flex min-w-0 items-center gap-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--os-accent-soft)] text-[var(--os-accent)]">
            <UserRound size={14} />
          </span>
          <span className="truncate">
            {loading ? 'Loading members...' : selected?.displayName || selected?.email || 'Unassigned'}
          </span>
        </span>
        <ChevronDown size={16} className="shrink-0 text-[var(--os-text-muted)]" />
      </button>

      {error && <p className="mt-1.5 text-xs text-[var(--os-danger)]">{error}</p>}

      {open && !disabled && !loading && (
        <div className="absolute z-30 mt-2 max-h-64 w-full overflow-auto rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] p-1.5 shadow-[var(--os-shadow-lg)]">
          <button
            type="button"
            onClick={() => { onChange(null); setOpen(false) }}
            className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm text-[var(--os-text-secondary)] hover:bg-[var(--os-surface-hover)]"
          >
            Unassigned
            {!value && <Check size={15} />}
          </button>
          {members.map((member) => {
            const isSelected = member.userId === value
            return (
              <button
                key={member.userId}
                type="button"
                onClick={() => { onChange(member.userId); setOpen(false) }}
                className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-[var(--os-surface-hover)]"
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--os-accent-soft)] text-xs font-semibold text-[var(--os-accent)]">
                    {(member.displayName || member.email || 'U').slice(0, 1).toUpperCase()}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-[var(--os-text)]">
                      {member.displayName || member.email || 'Workspace member'}
                    </span>
                    <span className="block truncate text-[11px] capitalize text-[var(--os-text-muted)]">
                      {member.designation || member.role}
                    </span>
                  </span>
                </span>
                {isSelected && <Check size={15} className="text-[var(--os-accent)]" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default MemberSelector
