import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, Check, Clock3, MessageSquareText, X } from 'lucide-react'
import Card from '../components/ui/Card'
import ThemeSelect from '../components/ui/ThemeSelect'
import { useAuth } from '../context/useAuth'
import { useWorkspace } from '../context/useWorkspace'
import { subscribeToWorkspaceMembers } from '../services/workspaceService'
import { cancelLeaveRequest, createLeaveRequest, reviewLeaveRequest, subscribeToLeaveRequests } from '../services/leaveService'
import type { LeaveRequest, LeaveStatus, LeaveType } from '../types/leave'
import type { WorkspaceMember } from '../types/workspace'

const types: { value: LeaveType; label: string }[] = [
  { value: 'casual', label: 'Casual leave' },
  { value: 'sick', label: 'Sick leave' },
  { value: 'earned', label: 'Earned leave' },
  { value: 'traveling', label: 'Traveling leave' },
  { value: 'unpaid', label: 'Unpaid leave' },
  { value: 'other', label: 'Other / Custom' },
]
const labels: Record<LeaveStatus, string> = { pending: 'Pending', approved: 'Approved', rejected: 'Rejected', cancelled: 'Cancelled' }

export default function Leave() {
  const { user } = useAuth(); const { workspace, hasPermission } = useWorkspace(); const workspaceId = workspace?.id; const userId = user?.uid
  const canManage = hasPermission('leave.manage'); const canView = hasPermission('leave.view')
  const [items, setItems] = useState<LeaveRequest[]>([]); const [members, setMembers] = useState<WorkspaceMember[]>([])
  const [type, setType] = useState<LeaveType>('casual'); const [customType, setCustomType] = useState(''); const [mode, setMode] = useState<'single' | 'range'>('single')
  const [startDate, setStartDate] = useState(''); const [endDate, setEndDate] = useState(''); const [reason, setReason] = useState(''); const [reviewNote, setReviewNote] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false); const [error, setError] = useState('')

  useEffect(() => { if (!workspaceId || !userId || !canView) return undefined; return subscribeToLeaveRequests(workspaceId, userId, canManage, setItems, e => setError(e.message)) }, [workspaceId, userId, canView, canManage])
  useEffect(() => { if (!workspaceId || !canManage) return undefined; return subscribeToWorkspaceMembers(workspaceId, setMembers, e => setError(e.message)) }, [workspaceId, canManage])
  const stats = useMemo(() => ({ pending: items.filter(i => i.status === 'pending').length, approved: items.filter(i => i.status === 'approved').length, rejected: items.filter(i => i.status === 'rejected').length }), [items])

  function resetForm() { setStartDate(''); setEndDate(''); setReason(''); setCustomType(''); setType('casual'); setMode('single') }
  async function submit() {
    if (!workspaceId || !userId || !startDate || !reason.trim() || (mode === 'range' && (!endDate || endDate < startDate)) || (type === 'other' && !customType.trim())) return
    const finalEnd = mode === 'single' ? startDate : endDate
    setSaving(true); setError('')
    try { await createLeaveRequest({ workspaceId, userId, type, customType, startDate, endDate: finalEnd, reason: reason.trim() }); resetForm() }
    catch (e) { setError(e instanceof Error ? e.message : 'Unable to submit leave request.') } finally { setSaving(false) }
  }
  async function review(item: LeaveRequest, status: Extract<LeaveStatus, 'approved' | 'rejected'>) {
    if (!userId || !reviewNote[item.id]?.trim()) { setError('Please add a remark before approving or rejecting a leave request.'); return }
    setSaving(true); setError(''); try { await reviewLeaveRequest(item.id, status, userId, reviewNote[item.id]) } catch (e) { setError(e instanceof Error ? e.message : 'Unable to update leave request.') } finally { setSaving(false) }
  }
  function displayType(item: LeaveRequest) { return item.type === 'other' ? item.customType || 'Other / Custom' : types.find(t => t.value === item.type)?.label || item.type }
  if (!canView) return <div className="mx-auto w-full max-w-[1400px] p-6"><Card className="p-8 text-center text-sm text-[var(--os-text-secondary)]">You do not have permission to view leave management.</Card></div>

  return <div className="mx-auto w-full max-w-[1500px] p-4 sm:p-6 lg:p-8">
    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--os-accent)]">People & Operations</p>
    <h1 className="mt-1 text-3xl font-semibold tracking-tight text-[var(--os-text)]">Leave Management</h1>
    <p className="mt-2 max-w-2xl text-sm text-[var(--os-text-secondary)]">Request leave, track approval status and see the exact remark left by your approver.</p>
    {error && <div role="alert" className="mt-5 rounded-xl border border-[var(--os-danger)]/20 bg-[var(--os-danger-soft)] px-4 py-3 text-sm text-[var(--os-danger)]">{error}</div>}

    <div className="mt-6 grid gap-3 sm:grid-cols-3"><Card className="p-4"><p className="text-xs text-[var(--os-text-muted)]">Pending</p><p className="mt-1 text-2xl font-semibold text-[var(--os-text)]">{stats.pending}</p></Card><Card className="p-4"><p className="text-xs text-[var(--os-text-muted)]">Approved</p><p className="mt-1 text-2xl font-semibold text-[var(--os-text)]">{stats.approved}</p></Card><Card className="p-4"><p className="text-xs text-[var(--os-text-muted)]">Rejected</p><p className="mt-1 text-2xl font-semibold text-[var(--os-text)]">{stats.rejected}</p></Card></div>

    <div className="mt-6 grid min-w-0 gap-6 xl:grid-cols-[minmax(300px,380px)_minmax(0,1fr)]">
      <Card className="min-w-0 p-5 sm:p-6">
        <h2 className="text-sm font-semibold text-[var(--os-text)]">Request leave</h2><p className="mt-1 text-xs leading-5 text-[var(--os-text-muted)]">Choose one day or a date range, then add the reason.</p>
        <div className="mt-5 space-y-4">
          <div className="grid grid-cols-2 gap-2 rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] p-1"><button type="button" onClick={() => { setMode('single'); setEndDate('') }} className={`h-9 rounded-lg text-xs font-semibold ${mode === 'single' ? 'bg-[var(--os-accent-soft)] text-[var(--os-accent)]' : 'text-[var(--os-text-muted)]'}`}>Single day</button><button type="button" onClick={() => setMode('range')} className={`h-9 rounded-lg text-xs font-semibold ${mode === 'range' ? 'bg-[var(--os-accent-soft)] text-[var(--os-accent)]' : 'text-[var(--os-text-muted)]'}`}>Date range</button></div>
          <ThemeSelect value={type} onChange={v => setType(v as LeaveType)} options={types} placeholder="Leave type" />
          {type === 'other' && <input value={customType} onChange={e => setCustomType(e.target.value)} placeholder="Type your leave type" className="os-focus-ring h-11 w-full rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] px-3 text-sm text-[var(--os-text)]" />}
          <div className={mode === 'range' ? 'grid grid-cols-1 gap-3 sm:grid-cols-2' : ''}>
            <label className="block"><span className="mb-1.5 block text-[11px] font-medium text-[var(--os-text-muted)]">{mode === 'single' ? 'Leave date' : 'From date'}</span><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="os-focus-ring h-11 w-full min-w-0 rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] px-3 text-sm text-[var(--os-text)]" /></label>
            {mode === 'range' && <label className="block"><span className="mb-1.5 block text-[11px] font-medium text-[var(--os-text-muted)]">To date</span><input type="date" value={endDate} min={startDate || undefined} onChange={e => setEndDate(e.target.value)} className="os-focus-ring h-11 w-full min-w-0 rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] px-3 text-sm text-[var(--os-text)]" /></label>}
          </div>
          <label className="block"><span className="mb-1.5 block text-[11px] font-medium text-[var(--os-text-muted)]">Reason of leave</span><textarea value={reason} onChange={e => setReason(e.target.value)} rows={5} placeholder="Explain the reason for your leave…" className="os-focus-ring w-full resize-y rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] px-3 py-2.5 text-sm text-[var(--os-text)]" /></label>
          <button type="button" disabled={saving || !startDate || (mode === 'range' && (!endDate || endDate < startDate)) || !reason.trim() || (type === 'other' && !customType.trim())} onClick={() => void submit()} className="h-11 w-full rounded-xl bg-[var(--os-accent)] text-sm font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-50">{saving ? 'Submitting…' : 'Submit leave request'}</button>
        </div>
      </Card>

      <Card className="min-w-0 overflow-hidden"><div className="border-b border-[var(--os-border)] px-5 py-4 sm:px-6"><h2 className="text-sm font-semibold text-[var(--os-text)]">{canManage ? 'All workspace leave requests' : 'My leave requests'}</h2><p className="mt-1 text-xs text-[var(--os-text-muted)]">{canManage ? 'Review every employee request and leave a visible decision remark.' : 'Your approver decision and remark stay visible here.'}</p></div>
        <div className="divide-y divide-[var(--os-border)]">{items.length === 0 ? <div className="p-10 text-center text-sm text-[var(--os-text-secondary)]">No leave requests yet.</div> : items.map(item => { const person = members.find(m => m.userId === item.userId); return <div key={item.id} className="min-w-0 p-5 sm:p-6">
          <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><CalendarDays size={16} className="shrink-0 text-[var(--os-accent)]"/><p className="break-words text-sm font-semibold text-[var(--os-text)]">{displayType(item)}</p><span className="rounded-full bg-[var(--os-accent-soft)] px-2.5 py-1 text-[10px] font-semibold text-[var(--os-accent)]">{labels[item.status]}</span></div><p className="mt-2 break-words text-xs text-[var(--os-text-muted)]">{person?.displayName || (item.userId === userId ? 'You' : item.userId)} · {item.startDate === item.endDate ? item.startDate : `${item.startDate} → ${item.endDate}`}</p><p className="mt-3 break-words text-sm leading-6 text-[var(--os-text-secondary)]">{item.reason}</p></div>{item.status === 'pending' && item.userId === userId && <button type="button" disabled={saving} onClick={() => void cancelLeaveRequest(item.id)} className="inline-flex h-9 shrink-0 items-center justify-center gap-1 rounded-lg border border-[var(--os-border)] px-3 text-xs font-semibold text-[var(--os-text)]"><X size={14}/> Cancel</button>}</div>
          {item.status !== 'pending' && item.reviewNote && <div className="mt-4 rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] p-4"><div className="flex items-center gap-2 text-xs font-semibold text-[var(--os-text)]"><MessageSquareText size={14} className="text-[var(--os-accent)]"/> Approver remark</div><p className="mt-2 break-words text-sm leading-6 text-[var(--os-text-secondary)]">{item.reviewNote}</p>{item.reviewedBy && <p className="mt-2 text-[10px] text-[var(--os-text-muted)]">Reviewed by {item.reviewedBy}</p>}</div>}
          {canManage && item.status === 'pending' && <div className="mt-5 rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] p-4"><div className="mb-3 flex items-center gap-2 text-xs font-semibold text-[var(--os-text)]"><Clock3 size={14} className="text-[var(--os-accent)]"/> Decision & remark</div><div className="flex flex-col gap-3 xl:flex-row"><input value={reviewNote[item.id] || ''} onChange={e => setReviewNote(prev => ({ ...prev, [item.id]: e.target.value }))} placeholder="Required remark for the sender…" className="os-focus-ring h-10 min-w-0 flex-1 rounded-lg border border-[var(--os-border)] bg-[var(--os-surface)] px-3 text-xs text-[var(--os-text)]"/><div className="flex gap-2"><button type="button" disabled={saving || !reviewNote[item.id]?.trim()} onClick={() => void review(item, 'approved')} className="inline-flex h-10 flex-1 items-center justify-center gap-1 rounded-lg bg-[var(--os-success)] px-4 text-xs font-semibold text-white disabled:opacity-50"><Check size={14}/> Approve</button><button type="button" disabled={saving || !reviewNote[item.id]?.trim()} onClick={() => void review(item, 'rejected')} className="inline-flex h-10 flex-1 items-center justify-center gap-1 rounded-lg border border-[var(--os-danger)]/30 px-4 text-xs font-semibold text-[var(--os-danger)] disabled:opacity-50">Reject</button></div></div></div>}
        </div> })}</div>
      </Card>
    </div>
  </div>
}
