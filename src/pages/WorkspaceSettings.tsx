import {
  Building2,
  CheckCircle2,
  Copy,
  Fingerprint,
  UserRound,
} from 'lucide-react'

import Card from '../components/ui/Card'
import SectionHeader from '../components/ui/SectionHeader'
import { useWorkspace } from '../context/useWorkspace'

function WorkspaceSettings() {
  const {
    workspace,
    loading,
  } = useWorkspace()

  function copyWorkspaceId() {
    if (!workspace?.id) {
      return
    }

    void navigator.clipboard.writeText(
      workspace.id,
    )
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-[1200px] p-4 sm:p-6 lg:p-8">
        <div className="mb-8">
          <div className="h-4 w-32 animate-pulse rounded bg-[var(--os-surface-raised)]" />

          <div className="mt-3 h-9 w-64 animate-pulse rounded bg-[var(--os-surface-raised)]" />

          <div className="mt-3 h-5 w-[420px] max-w-full animate-pulse rounded bg-[var(--os-surface-raised)]" />
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div className="h-[320px] animate-pulse rounded-2xl border border-[var(--os-border)] bg-[var(--os-surface)]" />

          <div className="h-[320px] animate-pulse rounded-2xl border border-[var(--os-border)] bg-[var(--os-surface)]" />
        </div>
      </div>
    )
  }

  if (!workspace) {
    return (
      <div className="mx-auto w-full max-w-[1200px] p-4 sm:p-6 lg:p-8">
        <Card className="p-8">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--os-danger)]/10 text-[var(--os-danger)]">
              <Building2 size={22} />
            </div>

            <h1 className="mt-4 text-lg font-semibold text-[var(--os-text)]">
              Workspace unavailable
            </h1>

            <p className="mt-2 max-w-md text-sm leading-6 text-[var(--os-text-secondary)]">
              Startup OS could not load the current
              workspace. Please refresh and try again.
            </p>
          </div>
        </Card>
      </div>
    )
  }

  const workspaceInitials =
    workspace.name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) =>
        part.charAt(0).toUpperCase(),
      )
      .join('') || 'WS'

  return (
    <div className="mx-auto w-full max-w-[1200px] p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <section className="mb-8">
        <p className="mb-2 text-sm font-medium text-[var(--os-accent)]">
          Workspace
        </p>

        <h1 className="text-3xl font-semibold tracking-tight text-[var(--os-text)] sm:text-4xl">
          Workspace settings
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--os-text-secondary)] sm:text-base">
          Manage and review the workspace currently
          connected to your Startup OS account.
        </p>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* Workspace Overview */}
        <Card className="p-6">
          <SectionHeader
            title="Workspace overview"
            description="Core information about your active workspace."
          />

          <div className="mt-6">
            <div className="flex items-start gap-4 rounded-2xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] p-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--os-accent-soft)] text-sm font-bold text-[var(--os-accent)]">
                {workspaceInitials}
              </div>

              <div className="min-w-0">
                <h2 className="truncate text-lg font-semibold text-[var(--os-text)]">
                  {workspace.name}
                </h2>

                <p className="mt-1 text-sm text-[var(--os-text-muted)]">
                  Active workspace
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <div className="flex items-center justify-between gap-4 rounded-xl border border-[var(--os-border)] px-4 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <Building2
                    size={17}
                    className="shrink-0 text-[var(--os-text-muted)]"
                  />

                  <div className="min-w-0">
                    <p className="text-xs text-[var(--os-text-muted)]">
                      Workspace name
                    </p>

                    <p className="mt-0.5 truncate text-sm font-medium text-[var(--os-text)]">
                      {workspace.name}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 rounded-xl border border-[var(--os-border)] px-4 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <Fingerprint
                    size={17}
                    className="shrink-0 text-[var(--os-text-muted)]"
                  />

                  <div className="min-w-0">
                    <p className="text-xs text-[var(--os-text-muted)]">
                      Workspace ID
                    </p>

                    <p className="mt-0.5 truncate font-mono text-xs text-[var(--os-text-secondary)]">
                      {workspace.id}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  aria-label="Copy workspace ID"
                  onClick={
                    copyWorkspaceId
                  }
                  className="os-focus-ring flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[var(--os-text-muted)] transition-colors hover:bg-[var(--os-surface-hover)] hover:text-[var(--os-accent)]"
                >
                  <Copy size={15} />
                </button>
              </div>

              <div className="flex items-center justify-between gap-4 rounded-xl border border-[var(--os-border)] px-4 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <UserRound
                    size={17}
                    className="shrink-0 text-[var(--os-text-muted)]"
                  />

                  <div className="min-w-0">
                    <p className="text-xs text-[var(--os-text-muted)]">
                      Owner
                    </p>

                    <p className="mt-0.5 truncate font-mono text-xs text-[var(--os-text-secondary)]">
                      {workspace.ownerId}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Status */}
        <Card className="p-6">
          <SectionHeader
            title="Workspace status"
            description="Current operational state."
          />

          <div className="mt-6 rounded-2xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--os-success)]/10 text-[var(--os-success)]">
                <CheckCircle2 size={19} />
              </div>

              <div>
                <p className="text-sm font-semibold text-[var(--os-text)]">
                  Active
                </p>

                <p className="mt-0.5 text-xs text-[var(--os-text-muted)]">
                  Workspace is ready to use
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-dashed border-[var(--os-border)] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--os-text-muted)]">
              Coming next
            </p>

            <p className="mt-2 text-sm leading-6 text-[var(--os-text-secondary)]">
              Workspace members, permissions, profile
              settings, and additional workspaces will
              be managed here as Startup OS grows.
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default WorkspaceSettings