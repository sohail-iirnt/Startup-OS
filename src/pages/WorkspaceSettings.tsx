import { useEffect, useState } from 'react'
import {
  Building2,
  CheckCircle2,
  Copy,
  Fingerprint,
  Plus,
  ShieldCheck,
  UserRound,
} from 'lucide-react'

import Card from '../components/ui/Card'
import SectionHeader from '../components/ui/SectionHeader'
import Button from '../components/ui/Button'
import WorkspaceBrandingCard from '../components/workspace/WorkspaceBrandingCard'
import { useWorkspace } from '../context/useWorkspace'
import { useAuth } from '../context/useAuth'
import {
  createWorkspace,
  getWorkspaceMember,
} from '../services/workspaceService'
import type { WorkspaceMember } from '../types/workspace'

function WorkspaceSettings() {
  const { workspace, loading, refreshWorkspace } = useWorkspace()
  const { user } = useAuth()

  const [member, setMember] = useState<WorkspaceMember | null>(null)
  const [memberLoading, setMemberLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [workspaceName, setWorkspaceName] = useState('')
  const [description, setDescription] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadMembership() {
      if (!user || !workspace?.id) {
        if (!cancelled) {
          setMember(null)
          setMemberLoading(false)
        }
        return
      }

      setMemberLoading(true)

      try {
        const result = await getWorkspaceMember(workspace.id, user.uid)
        if (!cancelled) {
          setMember(result)
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'Unable to load workspace permissions.',
          )
        }
      } finally {
        if (!cancelled) {
          setMemberLoading(false)
        }
      }
    }

    void loadMembership()

    return () => {
      cancelled = true
    }
  }, [user, workspace?.id])

  const canCreateWorkspace =
    member?.status === 'active' &&
    (member.role === 'owner' || member.role === 'admin')

  async function copyWorkspaceId() {
    if (!workspace?.id) {
      return
    }

    try {
      await navigator.clipboard.writeText(workspace.id)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setError('Unable to copy the Workspace ID. Please copy it manually.')
    }
  }

  function closeCreateWorkspace() {
    if (creating) {
      return
    }

    setCreateOpen(false)
    setWorkspaceName('')
    setDescription('')
    setError('')
  }

  async function handleCreateWorkspace() {
    if (!user || !canCreateWorkspace || creating) {
      return
    }

    const normalizedName = workspaceName.trim()

    if (!normalizedName) {
      setError('Please enter a workspace name.')
      return
    }

    setCreating(true)
    setError('')

    try {
      await createWorkspace(user.uid, normalizedName, description)
      await refreshWorkspace()
      setCreateOpen(false)
      setWorkspaceName('')
      setDescription('')
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : 'Unable to create the workspace.',
      )
    } finally {
      setCreating(false)
    }
  }

  if (loading || memberLoading) {
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
              Startup OS could not load the current workspace. Please refresh and try again.
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
      .map((part) => part.charAt(0).toUpperCase())
      .join('') || 'WS'

  return (
    <div className="mx-auto w-full max-w-[1200px] p-4 sm:p-6 lg:p-8">
      <section className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-sm font-medium text-[var(--os-accent)]">
            Workspace
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-[var(--os-text)] sm:text-4xl">
            Workspace settings
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--os-text-secondary)] sm:text-base">
            Manage your active workspace and control how new members join it.
          </p>
        </div>

        {canCreateWorkspace && (
          <Button type="button" onClick={() => setCreateOpen(true)}>
            <Plus size={16} />
            Create Workspace
          </Button>
        )}
      </section>

      {error && (
        <div
          role="alert"
          className="mb-6 rounded-xl border border-[rgba(255,100,124,0.25)] bg-[var(--os-danger-soft)] px-4 py-3 text-sm text-[var(--os-danger)]"
        >
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
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
                  <Building2 size={17} className="shrink-0 text-[var(--os-text-muted)]" />
                  <div className="min-w-0">
                    <p className="text-xs text-[var(--os-text-muted)]">Workspace name</p>
                    <p className="mt-0.5 truncate text-sm font-medium text-[var(--os-text)]">
                      {workspace.name}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 rounded-xl border border-[var(--os-accent-border)] bg-[var(--os-accent-soft)] px-4 py-4">
                <div className="flex min-w-0 items-center gap-3">
                  <Fingerprint size={18} className="shrink-0 text-[var(--os-accent)]" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--os-accent)]">
                      Workspace ID
                    </p>
                    <p className="mt-1 truncate font-mono text-xs text-[var(--os-text)]">
                      {workspace.id}
                    </p>
                    <p className="mt-1 text-xs text-[var(--os-text-secondary)]">
                      Give this ID to members during registration.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  aria-label="Copy workspace ID"
                  onClick={() => void copyWorkspaceId()}
                  className="os-focus-ring flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--os-surface)] text-[var(--os-text-muted)] transition-colors hover:text-[var(--os-accent)]"
                >
                  {copied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                </button>
              </div>

              <div className="flex items-center justify-between gap-4 rounded-xl border border-[var(--os-border)] px-4 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <UserRound size={17} className="shrink-0 text-[var(--os-text-muted)]" />
                  <div className="min-w-0">
                    <p className="text-xs text-[var(--os-text-muted)]">Your role</p>
                    <p className="mt-0.5 text-sm font-medium capitalize text-[var(--os-text)]">
                      {member?.role || 'Member'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <SectionHeader
            title="Workspace access"
            description="Use the Workspace ID to route registrations to this workspace."
          />

          <div className="mt-6 rounded-2xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--os-success)]/10 text-[var(--os-success)]">
                <ShieldCheck size={19} />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--os-text)]">Approval protected</p>
                <p className="mt-0.5 text-xs text-[var(--os-text-muted)]">
                  New registrations remain pending until an authorized approver accepts them.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-dashed border-[var(--os-border)] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--os-text-muted)]">
              Your permission
            </p>
            <p className="mt-2 text-sm leading-6 text-[var(--os-text-secondary)]">
              {canCreateWorkspace
                ? 'As an owner or admin, you can create another workspace. A new Workspace ID is generated automatically and becomes the active workspace after creation.'
                : 'Only workspace owners and admins can create additional workspaces.'}
            </p>
          </div>
        </Card>
      </div>

      <WorkspaceBrandingCard />

      {createOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-workspace-title"
        >
          <div className="w-full max-w-lg rounded-2xl border border-[var(--os-border)] bg-[var(--os-surface)] p-6 shadow-[var(--os-shadow-lg)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--os-accent)]">
                  Workspace creation
                </p>
                <h2 id="create-workspace-title" className="mt-1 text-xl font-semibold text-[var(--os-text)]">
                  Create a new workspace
                </h2>
                <p className="mt-2 text-sm leading-6 text-[var(--os-text-secondary)]">
                  Startup OS will generate a unique Workspace ID automatically. You can give that ID to members who should request access to this workspace.
                </p>
              </div>
              <button
                type="button"
                onClick={closeCreateWorkspace}
                disabled={creating}
                className="os-focus-ring flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[var(--os-text-muted)] hover:bg-[var(--os-surface-hover)] hover:text-[var(--os-text)]"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <label htmlFor="workspace-name" className="mb-2 block text-xs font-semibold uppercase tracking-[0.1em] text-[var(--os-text-secondary)]">
                  Workspace name
                </label>
                <input
                  id="workspace-name"
                  value={workspaceName}
                  onChange={(event) => setWorkspaceName(event.target.value)}
                  placeholder="e.g. III Robotics"
                  disabled={creating}
                  autoFocus
                  className="os-focus-ring h-12 w-full rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] px-4 text-sm text-[var(--os-text)] placeholder:text-[var(--os-text-muted)]"
                />
              </div>

              <div>
                <label htmlFor="workspace-description" className="mb-2 block text-xs font-semibold uppercase tracking-[0.1em] text-[var(--os-text-secondary)]">
                  Description <span className="font-normal normal-case tracking-normal text-[var(--os-text-muted)]">(optional)</span>
                </label>
                <textarea
                  id="workspace-description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="What is this workspace used for?"
                  disabled={creating}
                  rows={3}
                  className="os-focus-ring w-full resize-none rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] px-4 py-3 text-sm text-[var(--os-text)] placeholder:text-[var(--os-text-muted)]"
                />
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="secondary" onClick={closeCreateWorkspace} disabled={creating}>
                Cancel
              </Button>
              <Button type="button" onClick={() => void handleCreateWorkspace()} disabled={creating}>
                <Plus size={16} />
                {creating ? 'Creating...' : 'Create Workspace'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default WorkspaceSettings