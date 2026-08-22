import { useEffect, useState } from 'react'
import { Mail, ShieldCheck, UserRound, Users } from 'lucide-react'

import Card from '../components/ui/Card'
import { useWorkspace } from '../context/useWorkspace'
import { getWorkspaceMembers } from '../services/memberService'
import type { WorkspaceMember } from '../types/workspace'

function initials(member: WorkspaceMember) {
  const source = member.displayName || member.email || 'Member'
  return source
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || 'M'
}

function roleLabel(role: string) {
  return role.replace(/[-_]/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function Team() {
  const { workspace, loading: workspaceLoading } = useWorkspace()
  const [members, setMembers] = useState<WorkspaceMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (workspaceLoading || !workspace?.id) return

    setLoading(true)
    setError('')

    getWorkspaceMembers(workspace.id)
      .then((result) => setMembers(result))
      .catch((loadError: unknown) => {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load workspace members.')
      })
      .finally(() => setLoading(false))
  }, [workspace?.id, workspaceLoading])

  return (
    <div className="mx-auto w-full max-w-[1400px] p-4 sm:p-6 lg:p-8">
      <section className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--os-accent)]">People & Access</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-[var(--os-text)]">Team</h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--os-text-secondary)]">Registered members of the active workspace. These members will be available for task, project, goal, and other operational assignments across Startup OS.</p>
      </section>

      {error && <div role="alert" className="mb-5 rounded-xl border border-[rgba(255,100,124,0.25)] bg-[rgba(255,100,124,0.08)] px-4 py-3 text-sm text-[var(--os-danger)]">{error}</div>}

      <div className="mb-5 grid gap-4 sm:grid-cols-2">
        <Card className="p-5"><div className="flex items-center gap-3"><Users size={20} className="text-[var(--os-accent)]" /><div><p className="text-xs text-[var(--os-text-muted)]">Active Members</p><p className="mt-1 text-2xl font-semibold text-[var(--os-text)]">{members.length}</p></div></div></Card>
        <Card className="p-5"><div className="flex items-center gap-3"><ShieldCheck size={20} className="text-[var(--os-success)]" /><div><p className="text-xs text-[var(--os-text-muted)]">Workspace</p><p className="mt-1 truncate text-base font-semibold text-[var(--os-text)]">{workspace?.name || 'Loading...'}</p></div></div></Card>
      </div>

      {loading || workspaceLoading ? (
        <Card className="p-8 text-center text-sm text-[var(--os-text-secondary)]">Loading team members...</Card>
      ) : members.length === 0 ? (
        <Card className="p-10 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--os-accent-soft)] text-[var(--os-accent)]"><UserRound size={22} /></div>
          <h2 className="mt-4 text-lg font-semibold text-[var(--os-text)]">No active members yet</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[var(--os-text-secondary)]">Registered workspace members will appear here and can then be selected as assignees throughout Startup OS.</p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {members.map((member) => (
            <Card key={member.id} className="p-5 transition-colors hover:border-[var(--os-border-strong)]">
              <div className="flex items-start gap-4">
                {member.photoURL ? (
                  <img src={member.photoURL} alt="" className="h-12 w-12 shrink-0 rounded-xl object-cover" />
                ) : (
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--os-accent-soft)] text-sm font-bold text-[var(--os-accent)]">{initials(member)}</div>
                )}
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-base font-semibold text-[var(--os-text)]">{member.displayName || 'Unnamed member'}</h2>
                  <p className="mt-1 text-xs font-medium text-[var(--os-accent)]">{member.designation || roleLabel(member.role)}</p>
                </div>
              </div>
              <div className="mt-5 space-y-3">
                {member.email && <div className="flex min-w-0 items-center gap-2 text-sm text-[var(--os-text-secondary)]"><Mail size={15} className="shrink-0 text-[var(--os-text-muted)]" /><span className="truncate">{member.email}</span></div>}
                <div className="flex items-center justify-between gap-3 border-t border-[var(--os-border)] pt-3"><span className="text-xs text-[var(--os-text-muted)]">Role</span><span className="rounded-full bg-[var(--os-surface-hover)] px-2.5 py-1 text-xs font-medium capitalize text-[var(--os-text-secondary)]">{roleLabel(member.role)}</span></div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default Team
