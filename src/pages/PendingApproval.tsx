import { Clock3, LogOut, RefreshCw, ShieldCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import { useAuth } from '../context/useAuth'
import { useWorkspace } from '../context/useWorkspace'
import { logout } from '../services/authService'
import { subscribeToWorkspaceMember } from '../services/workspaceService'

function PendingApproval() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { workspace, member, refreshWorkspace } = useWorkspace()
  const [checking, setChecking] = useState(false)
  const [liveMember, setLiveMember] = useState(member)

  useEffect(() => {
    setLiveMember(member)
  }, [member])

  useEffect(() => {
    if (!workspace?.id || !user?.uid) return undefined
    return subscribeToWorkspaceMember(
      workspace.id,
      user.uid,
      (nextMember) => {
        setLiveMember(nextMember)
        if (nextMember?.status === 'active') navigate('/dashboard', { replace: true })
      },
      (error) => console.error('Pending approval listener failed:', error),
    )
  }, [workspace?.id, user?.uid, navigate])

  async function handleRefresh() {
    setChecking(true)
    try {
      await refreshWorkspace()
    } finally {
      setChecking(false)
    }
  }

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  const currentStatus = liveMember?.status ?? member?.status
  const statusMessage =
    currentStatus === 'rejected'
      ? 'Your request was not approved. Please contact the workspace administrator if you believe this is a mistake.'
      : currentStatus === 'suspended'
        ? 'Your workspace membership is currently suspended. Please contact a workspace administrator.'
        : 'Your account is registered, but a workspace administrator must approve your membership before you can access Startup OS.'

  return (
    <main className="min-h-screen bg-[var(--os-bg)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-2xl items-center justify-center">
        <Card className="w-full p-8 text-center sm:p-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--os-accent-soft)] text-[var(--os-accent)]">
            {currentStatus === 'pending' ? <Clock3 size={28} /> : <ShieldCheck size={28} />}
          </div>
          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--os-accent)]">Startup OS · Access Control</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--os-text)] sm:text-3xl">
            {currentStatus === 'pending' ? 'Waiting for approval' : 'Workspace access required'}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-[var(--os-text-secondary)]">{statusMessage}</p>

          <div className="mt-6 rounded-2xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] p-5 text-left">
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--os-text-muted)]">Account</span>
              <span className="truncate text-sm font-medium text-[var(--os-text)]">{user?.displayName || user?.email || 'Registered user'}</span>
            </div>
            {workspace && <div className="mt-3 flex items-center justify-between gap-4 border-t border-[var(--os-border)] pt-3"><span className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--os-text-muted)]">Workspace</span><span className="truncate text-sm font-medium text-[var(--os-text)]">{workspace.name}</span></div>}
            <div className="mt-3 flex items-center justify-between gap-4 border-t border-[var(--os-border)] pt-3">
              <span className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--os-text-muted)]">Request status</span>
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${currentStatus === 'pending' ? 'bg-[var(--os-warning-soft)] text-[var(--os-warning)]' : currentStatus === 'active' ? 'bg-[var(--os-success-soft)] text-[var(--os-success)]' : 'bg-[var(--os-accent-soft)] text-[var(--os-accent)]'}`}>
                {currentStatus || 'pending'}
              </span>
            </div>
          </div>

          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Button type="button" onClick={handleRefresh} disabled={checking}>
              <RefreshCw size={15} className={checking ? 'animate-spin' : ''} />
              {checking ? 'Checking...' : currentStatus === 'pending' ? 'Pending · Check approval status' : 'Check approval status'}
            </Button>
            <Button type="button" variant="secondary" onClick={handleLogout}><LogOut size={15} />Sign out</Button>
          </div>
          {currentStatus === 'pending' && <p className="mt-4 text-xs text-[var(--os-text-muted)]">Status is monitored live. You do not need to refresh this page.</p>}
        </Card>
      </div>
    </main>
  )
}

export default PendingApproval
