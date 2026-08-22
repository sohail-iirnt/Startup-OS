import { Clock3, LogOut, ShieldCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import { useAuth } from '../context/useAuth'
import { useWorkspace } from '../context/useWorkspace'
import { logout } from '../services/authService'

function PendingApproval() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { workspace, member, refreshWorkspace } = useWorkspace()

  async function handleRefresh() {
    await refreshWorkspace()
  }

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  const statusMessage =
    member?.status === 'rejected'
      ? 'Your request was not approved. Please contact the workspace administrator if you believe this is a mistake.'
      : member?.status === 'suspended'
        ? 'Your workspace membership is currently suspended. Please contact a workspace administrator.'
        : 'Your account is registered, but a workspace administrator must approve your membership before you can access Startup OS.'

  return (
    <main className="min-h-screen bg-[var(--os-bg)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-2xl items-center justify-center">
        <Card className="w-full p-8 text-center sm:p-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--os-accent-soft)] text-[var(--os-accent)]">
            {member?.status === 'pending' ? <Clock3 size={28} /> : <ShieldCheck size={28} />}
          </div>

          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--os-accent)]">
            Startup OS · Access Control
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--os-text)] sm:text-3xl">
            {member?.status === 'pending' ? 'Waiting for approval' : 'Workspace access required'}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-[var(--os-text-secondary)]">
            {statusMessage}
          </p>

          <div className="mt-6 rounded-2xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] p-5 text-left">
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--os-text-muted)]">
                Account
              </span>
              <span className="truncate text-sm font-medium text-[var(--os-text)]">
                {user?.displayName || user?.email || 'Registered user'}
              </span>
            </div>
            {workspace && (
              <div className="mt-3 flex items-center justify-between gap-4 border-t border-[var(--os-border)] pt-3">
                <span className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--os-text-muted)]">
                  Workspace
                </span>
                <span className="truncate text-sm font-medium text-[var(--os-text)]">
                  {workspace.name}
                </span>
              </div>
            )}
            {member && (
              <div className="mt-3 flex items-center justify-between gap-4 border-t border-[var(--os-border)] pt-3">
                <span className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--os-text-muted)]">
                  Request status
                </span>
                <span className="rounded-full bg-[var(--os-accent-soft)] px-2.5 py-1 text-xs font-semibold capitalize text-[var(--os-accent)]">
                  {member.status}
                </span>
              </div>
            )}
          </div>

          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Button type="button" onClick={handleRefresh}>
              Check approval status
            </Button>
            <Button type="button" variant="secondary" onClick={handleLogout}>
              <LogOut size={15} />
              Sign out
            </Button>
          </div>
        </Card>
      </div>
    </main>
  )
}

export default PendingApproval
