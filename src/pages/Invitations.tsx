import { useEffect, useMemo, useState } from 'react'
import { Check, CheckCircle2, Clock3, Copy, Mail, RefreshCw, ShieldCheck, UserPlus, X, XCircle } from 'lucide-react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { useWorkspace } from '../context/useWorkspace'
import { getWorkspaceInvitations, revokeWorkspaceInvitation } from '../services/invitationService'
import type { InvitationStatus, WorkspaceInvitation } from '../types/invitation'

function label(value: string) { return value.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) }
function statusOf(item: WorkspaceInvitation): InvitationStatus { return item.status === 'pending' && item.expiresAt.getTime() <= Date.now() ? 'expired' : item.status }
function date(value: Date) { return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(value) }

function Invitations() {
  const { workspace, loading: workspaceLoading } = useWorkspace()
  const [items, setItems] = useState<WorkspaceInvitation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<'all' | InvitationStatus>('all')
  const [search, setSearch] = useState('')
  const [busy, setBusy] = useState('')
  const [copied, setCopied] = useState('')

  async function load() {
    if (!workspace?.id) return
    setLoading(true); setError('')
    try { setItems(await getWorkspaceInvitations(workspace.id)) }
    catch (e: unknown) { setError(e instanceof Error ? e.message : 'Unable to load invitations.') }
    finally { setLoading(false) }
  }

  useEffect(() => { if (!workspaceLoading && workspace?.id) void load() }, [workspace?.id, workspaceLoading])

  const counts = useMemo(() => items.reduce((a, item) => { a[statusOf(item)] += 1; return a }, { pending: 0, accepted: 0, expired: 0, revoked: 0 } as Record<InvitationStatus, number>), [items])
  const filtered = useMemo(() => items.filter((item) => {
    const status = statusOf(item); const q = search.trim().toLowerCase()
    return (filter === 'all' || status === filter) && (!q || (item.email || 'open invitation').toLowerCase().includes(q) || label(item.role).toLowerCase().includes(q))
  }), [items, filter, search])

  async function revoke(item: WorkspaceInvitation) {
    if (!workspace?.id || statusOf(item) !== 'pending') return
    setBusy(item.id); setError('')
    try { await revokeWorkspaceInvitation(workspace.id, item.id); setItems((current) => current.map((x) => x.id === item.id ? { ...x, status: 'revoked', revokedAt: new Date() } : x)) }
    catch (e: unknown) { setError(e instanceof Error ? e.message : 'Unable to revoke invitation.') }
    finally { setBusy('') }
  }

  async function copy(item: WorkspaceInvitation) {
    if (!workspace?.id) return
    const url = new URL('/register', window.location.origin); url.searchParams.set('workspaceId', workspace.id); url.searchParams.set('inviteToken', item.token); if (item.email) url.searchParams.set('email', item.email)
    try { await navigator.clipboard.writeText(url.toString()); setCopied(item.id); window.setTimeout(() => setCopied(''), 1800) } catch { setError('Unable to copy invitation link.') }
  }

  const statusStyle: Record<InvitationStatus, string> = { pending: 'bg-[var(--os-info-soft)] text-[var(--os-info)]', accepted: 'bg-[var(--os-success-soft)] text-[var(--os-success)]', expired: 'bg-[var(--os-warning-soft)] text-[var(--os-warning)]', revoked: 'bg-[var(--os-danger-soft)] text-[var(--os-danger)]' }
  const StatusIcon = ({ status }: { status: InvitationStatus }) => status === 'accepted' ? <CheckCircle2 size={13} /> : status === 'revoked' ? <XCircle size={13} /> : <Clock3 size={13} />

  return <div className="mx-auto w-full max-w-[1400px] p-4 sm:p-6 lg:p-8">
    <section className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--os-accent)]">People & Access</p><h1 className="mt-1 text-3xl font-semibold tracking-tight text-[var(--os-text)]">Invitations</h1><p className="mt-2 text-sm text-[var(--os-text-secondary)]">Manage and track workspace invitations from creation through onboarding.</p></div><Button variant="secondary" onClick={() => void load()} disabled={loading}><RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh</Button></section>
    {error && <div role="alert" className="mb-5 rounded-xl border border-[rgba(255,100,124,0.25)] bg-[var(--os-danger-soft)] px-4 py-3 text-sm text-[var(--os-danger)]">{error}</div>}
    <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{(['pending','accepted','expired','revoked'] as InvitationStatus[]).map((status) => <button key={status} type="button" onClick={() => setFilter(filter === status ? 'all' : status)} className="text-left"><Card className={`p-5 hover:border-[var(--os-border-strong)] ${filter === status ? 'border-[var(--os-accent-border)]' : ''}`}><p className="text-xs capitalize text-[var(--os-text-muted)]">{status}</p><p className="mt-1 text-2xl font-semibold text-[var(--os-text)]">{counts[status]}</p></Card></button>)}</div>
    <Card className="overflow-hidden"><div className="flex flex-col gap-3 border-b border-[var(--os-border)] p-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-sm font-semibold text-[var(--os-text)]">Invitation history</h2><p className="mt-1 text-xs text-[var(--os-text-secondary)]">{filtered.length} invitation{filtered.length === 1 ? '' : 's'}</p></div><div className="flex gap-2"><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search email or role..." className="os-focus-ring h-10 w-56 rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] px-3 text-sm text-[var(--os-text)]" /><select value={filter} onChange={(e) => setFilter(e.target.value as 'all' | InvitationStatus)} className="os-focus-ring h-10 rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] px-3 text-sm text-[var(--os-text)]"><option value="all">All</option><option value="pending">Pending</option><option value="accepted">Accepted</option><option value="expired">Expired</option><option value="revoked">Revoked</option></select></div></div>
      {loading || workspaceLoading ? <div className="p-10 text-center text-sm text-[var(--os-text-secondary)]">Loading invitations...</div> : filtered.length === 0 ? <div className="p-10 text-center"><UserPlus className="mx-auto text-[var(--os-accent)]" /><h3 className="mt-3 font-semibold text-[var(--os-text)]">No invitations found</h3><p className="mt-1 text-sm text-[var(--os-text-secondary)]">Create invitations from the Team page.</p></div> : <div className="overflow-x-auto"><table className="w-full min-w-[850px] text-left"><thead><tr className="border-b border-[var(--os-border)] bg-[var(--os-surface-raised)]">{['Member','Role','Status','Created','Expires','Actions'].map((h) => <th key={h} className="px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--os-text-muted)]">{h}</th>)}</tr></thead><tbody>{filtered.map((item) => { const status = statusOf(item); return <tr key={item.id} className="border-b border-[var(--os-border)] last:border-0 hover:bg-[var(--os-surface-hover)]"><td className="px-5 py-4"><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--os-accent-soft)] text-[var(--os-accent)]"><Mail size={15} /></div><div><p className="text-sm font-medium text-[var(--os-text)]">{item.email || 'Open invitation'}</p><p className="text-xs text-[var(--os-text-muted)]">Created by {item.createdBy}</p></div></div></td><td className="px-5 py-4"><span className="rounded-full bg-[var(--os-surface-hover)] px-2.5 py-1 text-xs text-[var(--os-text-secondary)]">{label(item.role)}</span></td><td className="px-5 py-4"><span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${statusStyle[status]}`}><StatusIcon status={status} />{label(status)}</span></td><td className="px-5 py-4 text-xs text-[var(--os-text-secondary)]">{date(item.createdAt)}</td><td className="px-5 py-4 text-xs text-[var(--os-text-secondary)]">{date(item.expiresAt)}</td><td className="px-5 py-4"><div className="flex gap-2">{status === 'pending' && <><button type="button" onClick={() => void copy(item)} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[var(--os-border)] px-3 text-xs font-semibold text-[var(--os-text-secondary)]">{copied === item.id ? <Check size={14} /> : <Copy size={14} />}{copied === item.id ? 'Copied' : 'Copy'}</button><button type="button" onClick={() => void revoke(item)} disabled={busy === item.id} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[var(--os-danger-soft)] px-3 text-xs font-semibold text-[var(--os-danger)]"><X size={14} />{busy === item.id ? 'Revoking...' : 'Revoke'}</button></>}{status === 'accepted' && <span className="inline-flex items-center gap-1 text-xs text-[var(--os-success)]"><ShieldCheck size={14} /> Onboarded</span>}{status === 'expired' && <span className="text-xs text-[var(--os-warning)]">Needs new invitation</span>}</div></td></tr>})}</tbody></table></div>}
    </Card>
  </div>
}
export default Invitations
