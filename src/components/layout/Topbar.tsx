import {
  Bell,
  Menu,
  Search,
} from 'lucide-react'

import { useAuth } from '../../context/useAuth'
import { useWorkspace } from '../../context/useWorkspace'

type TopbarProps = {
  onMenuClick: () => void
}

function Topbar({
  onMenuClick,
}: TopbarProps) {
  const { user } = useAuth()
  const {
    workspace,
    loading: workspaceLoading,
  } = useWorkspace()

  const displayName =
    user?.displayName ||
    user?.email?.split('@')[0] ||
    'User'

  const initials =
    displayName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(
        (part) =>
          part.charAt(0).toUpperCase(),
      )
      .join('') || 'U'

  const workspaceName =
    workspaceLoading
      ? 'Loading workspace...'
      : workspace?.name ||
        'No workspace'
  const portalName = workspace?.portalName?.trim() || 'Startup OS'

  return (
    <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-[var(--os-border)] bg-[rgba(8,9,12,0.82)] px-4 backdrop-blur-xl sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          aria-label="Open navigation"
          onClick={onMenuClick}
          className="os-focus-ring flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[var(--os-text-secondary)] transition-colors hover:bg-[var(--os-surface-hover)] hover:text-[var(--os-text)] lg:hidden"
        >
          <Menu size={20} />
        </button>

        <div className="hidden min-w-0 items-center gap-2 text-sm sm:flex">
          <span className="shrink-0 text-[var(--os-text-muted)]">
            {portalName}
          </span>

          <span className="text-[var(--os-text-muted)]">
            /
          </span>

          <span className="max-w-[260px] truncate font-medium text-[var(--os-text-secondary)]">
            {workspaceName}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Search"
          className="os-focus-ring flex h-10 w-10 items-center justify-center rounded-xl text-[var(--os-text-secondary)] transition-colors hover:bg-[var(--os-surface-hover)] hover:text-[var(--os-text)]"
        >
          <Search size={19} />
        </button>

        <button
          type="button"
          aria-label="Notifications"
          className="os-focus-ring relative flex h-10 w-10 items-center justify-center rounded-xl text-[var(--os-text-secondary)] transition-colors hover:bg-[var(--os-surface-hover)] hover:text-[var(--os-text)]"
        >
          <Bell size={19} />

          <span className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full bg-[var(--os-danger)]" />
        </button>

        <div className="ml-1 hidden h-9 w-px bg-[var(--os-border)] sm:block" />

        <button
          type="button"
          aria-label="Open profile"
          className="ml-1 flex h-10 items-center gap-2 rounded-xl px-2 transition-colors hover:bg-[var(--os-surface-hover)]"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--os-accent-soft)] text-xs font-semibold text-[var(--os-accent)]">
            {initials}
          </span>

          <span className="hidden max-w-[140px] truncate text-sm font-medium text-[var(--os-text)] md:block">
            {displayName}
          </span>
        </button>
      </div>
    </header>
  )
}

export default Topbar
