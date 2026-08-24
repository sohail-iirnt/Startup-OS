import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { addDoc, collection, deleteDoc, doc, onSnapshot, query, serverTimestamp, updateDoc, where } from 'firebase/firestore'
import { CheckCircle2, Flag, Plus, Search, Target, Trash2, TrendingUp } from 'lucide-react'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import SectionHeader from '../components/ui/SectionHeader'
import { useAuth } from '../context/useAuth'
import { useWorkspace } from '../context/useWorkspace'
import { db } from '../lib/firebase'

type Goal = {
  id: string
  title: string
  description: string
  category: string
  ownerId: string
  metric: string
  target: number
  current: number
  deadline?: Date
  status: 'active' | 'completed' | 'paused'
  createdAt?: Date
}

function toDate(value: unknown) {
  if (value && typeof value === 'object' && 'toDate' in value && typeof (value as { toDate?: unknown }).toDate === 'function') return (value as { toDate: () => Date }).toDate()
  if (value instanceof Date) return value
  if (typeof value === 'string' || typeof value === 'number') return new Date(value)
  return undefined
}

function percent(goal: Goal) {
  if (goal.target <= 0) return 0
  return Math.min(100, Math.max(0, Math.round((goal.current / goal.target) * 100)))
}

export default function Goals() {
  const { user } = useAuth()
  const { workspace, loading, hasPermission } = useWorkspace()
  const canManage = hasPermission('goals.manage')
  const [goals, setGoals] = useState<Goal[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | Goal['status']>('all')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [targetGoal, setTargetGoal] = useState<Goal | null>(null)
  const [progressGoal, setProgressGoal] = useState<Goal | null>(null)
  const [progressValue, setProgressValue] = useState('')
  const [form, setForm] = useState({ title: '', description: '', category: 'Business', metric: 'Units', target: '', deadline: '' })

  useEffect(() => {
    if (loading || !workspace?.id) return undefined
    return onSnapshot(query(collection(db, 'goals'), where('workspaceId', '==', workspace.id)), snapshot => {
      setGoals(snapshot.docs.map(item => {
        const d = item.data()
        return {
          id: item.id,
          title: String(d.title ?? ''),
          description: String(d.description ?? ''),
          category: String(d.category ?? 'Business'),
          ownerId: String(d.ownerId ?? ''),
          metric: String(d.metric ?? 'Units'),
          target: Number(d.target ?? 0),
          current: Number(d.current ?? 0),
          deadline: toDate(d.deadline),
          status: d.status === 'completed' || d.status === 'paused' ? d.status : 'active',
          createdAt: toDate(d.createdAt),
        }
      }).sort((a, b) => (a.deadline?.getTime() ?? Number.MAX_SAFE_INTEGER) - (b.deadline?.getTime() ?? Number.MAX_SAFE_INTEGER)))
    }, e => { console.error(e); setError('Goals could not be loaded.') })
  }, [workspace?.id, loading])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return goals.filter(goal => {
      const matchesSearch = !q || `${goal.title} ${goal.description} ${goal.category} ${goal.metric}`.toLowerCase().includes(q)
      return matchesSearch && (statusFilter === 'all' || goal.status === statusFilter)
    })
  }, [goals, search, statusFilter])

  async function createGoal(event: FormEvent) {
    event.preventDefault()
    if (!workspace?.id || !user?.uid || !canManage || !form.title.trim()) return
    const target = Number(form.target)
    if (!Number.isFinite(target) || target <= 0) { setError('Target must be greater than zero.'); return }
    setSaving(true); setError('')
    try {
      await addDoc(collection(db, 'goals'), {
        workspaceId: workspace.id,
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        metric: form.metric.trim() || 'Units',
        target,
        current: 0,
        ownerId: user.uid,
        status: 'active',
        deadline: form.deadline ? new Date(`${form.deadline}T23:59:59`) : null,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      setForm({ title: '', description: '', category: 'Business', metric: 'Units', target: '', deadline: '' })
    } catch (e) { console.error(e); setError('Could not create the goal.') } finally { setSaving(false) }
  }

  async function saveProgress() {
    if (!progressGoal || !canManage) return
    const current = Number(progressValue)
    if (!Number.isFinite(current) || current < 0) { setError('Progress must be zero or greater.'); return }
    setSaving(true); setError('')
    try {
      await updateDoc(doc(db, 'goals', progressGoal.id), { current, status: current >= progressGoal.target ? 'completed' : 'active', updatedAt: serverTimestamp() })
      setProgressGoal(null)
    } catch (e) { console.error(e); setError('Could not update goal progress.') } finally { setSaving(false) }
  }

  async function removeGoal() {
    if (!targetGoal || !canManage) return
    setDeleting(true); setError('')
    try { await deleteDoc(doc(db, 'goals', targetGoal.id)); setTargetGoal(null) } catch (e) { console.error(e); setError('Could not delete the goal.') } finally { setDeleting(false) }
  }

  return <>
    <div className="mx-auto w-full max-w-[1600px] p-4 sm:p-6 lg:p-8">
      <SectionHeader title="Goals & Targets" description="Turn the company's priorities into measurable outcomes with visible progress and deadlines." />
      <div className="mt-6 grid gap-6 xl:grid-cols-[380px_1fr]">
        {canManage && <Card className="p-6"><SectionHeader title="Create goal" description="Define one outcome, one measurable target and a deadline." /><form onSubmit={createGoal} className="mt-5 space-y-3">
          <input required placeholder="Goal title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="w-full rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] px-4 py-3 text-sm text-[var(--os-text)] outline-none" />
          <textarea rows={4} placeholder="Why does this goal matter?" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="w-full resize-none rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] px-4 py-3 text-sm text-[var(--os-text)] outline-none" />
          <div className="grid grid-cols-2 gap-3"><select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] px-3 py-3 text-sm text-[var(--os-text)]"><option>Business</option><option>Revenue</option><option>Product</option><option>Marketing</option><option>Operations</option><option>Personal</option></select><input placeholder="Metric (e.g. INR)" value={form.metric} onChange={e => setForm(f => ({ ...f, metric: e.target.value }))} className="rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] px-3 py-3 text-sm text-[var(--os-text)] outline-none" /></div>
          <div className="grid grid-cols-2 gap-3"><input required min="1" type="number" placeholder="Target" value={form.target} onChange={e => setForm(f => ({ ...f, target: e.target.value }))} className="rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] px-3 py-3 text-sm text-[var(--os-text)] outline-none" /><input type="date" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} className="rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] px-3 py-3 text-sm text-[var(--os-text)] outline-none" /></div>
          <Button type="submit" disabled={saving} className="w-full"><Plus size={17} />{saving ? 'Saving…' : 'Create goal'}</Button>
        </form></Card>}

        <Card className="p-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-wider text-[var(--os-accent)]">Live targets</p><h2 className="mt-1 text-xl font-semibold text-[var(--os-text)]">{filtered.length} goals</h2></div><div className="flex gap-2"><label className="relative block sm:w-64"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--os-text-muted)]" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search goals…" className="w-full rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] py-3 pl-9 pr-3 text-sm text-[var(--os-text)] outline-none" /></label><select value={statusFilter} onChange={e => setStatusFilter(e.target.value as typeof statusFilter)} className="rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] px-3 text-sm text-[var(--os-text)]"><option value="all">All</option><option value="active">Active</option><option value="completed">Completed</option><option value="paused">Paused</option></select></div></div>
          {error && <p className="mt-4 rounded-xl bg-[var(--os-danger-soft)] p-3 text-sm text-[var(--os-danger)]">{error}</p>}
          <div className="mt-5 grid gap-3 lg:grid-cols-2">{filtered.length ? filtered.map(goal => { const progress = percent(goal); return <article key={goal.id} className="rounded-2xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] p-5"><div className="flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--os-accent-soft)] text-[var(--os-accent)]"><Target size={18} /></span><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-3"><h3 className="font-semibold text-[var(--os-text)]">{goal.title}</h3>{canManage && <button type="button" onClick={() => setTargetGoal(goal)} className="rounded-lg p-2 text-[var(--os-text-muted)] hover:bg-[var(--os-danger-soft)] hover:text-[var(--os-danger)]"><Trash2 size={15} /></button>}</div><p className="mt-1 text-xs text-[var(--os-text-muted)]">{goal.category} · {goal.metric} · {goal.status}</p></div></div>{goal.description && <p className="mt-4 text-sm leading-6 text-[var(--os-text-secondary)]">{goal.description}</p>}<div className="mt-5"><div className="flex items-center justify-between text-xs"><span className="text-[var(--os-text-muted)]">{goal.current.toLocaleString()} / {goal.target.toLocaleString()} {goal.metric}</span><span className="font-semibold text-[var(--os-text)]">{progress}%</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--os-surface-hover)]"><div className="h-full rounded-full bg-[var(--os-accent)] transition-all" style={{ width: `${progress}%` }} /></div></div><div className="mt-4 flex items-center justify-between border-t border-[var(--os-border)] pt-3"><span className="flex items-center gap-1.5 text-xs text-[var(--os-text-muted)]">{goal.status === 'completed' ? <CheckCircle2 size={14} className="text-[var(--os-success)]" /> : <TrendingUp size={14} className="text-[var(--os-accent)]" />}{goal.deadline ? `Due ${goal.deadline.toLocaleDateString()}` : 'No deadline'}</span>{canManage && goal.status !== 'completed' && <button type="button" onClick={() => { setProgressGoal(goal); setProgressValue(String(goal.current)) }} className="rounded-lg bg-[var(--os-accent-soft)] px-3 py-2 text-xs font-semibold text-[var(--os-accent)]">Update progress</button>}</div></article> }) : <div className="col-span-full rounded-2xl border border-dashed border-[var(--os-border)] p-10 text-center"><Flag className="mx-auto text-[var(--os-text-muted)]" size={30} /><p className="mt-3 text-sm font-medium text-[var(--os-text)]">No goals yet</p><p className="mt-1 text-xs text-[var(--os-text-muted)]">Create the first measurable company target.</p></div>}</div>
        </Card>
      </div>
    </div>
    {progressGoal && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"><Card className="w-full max-w-md p-6"><h2 className="text-lg font-semibold text-[var(--os-text)]">Update progress</h2><p className="mt-1 text-sm text-[var(--os-text-secondary)]">{progressGoal.title}</p><input autoFocus type="number" min="0" value={progressValue} onChange={e => setProgressValue(e.target.value)} className="mt-5 w-full rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] px-4 py-3 text-sm text-[var(--os-text)] outline-none" /><div className="mt-5 flex justify-end gap-2"><Button variant="secondary" type="button" onClick={() => !saving && setProgressGoal(null)}>Cancel</Button><Button type="button" disabled={saving} onClick={() => void saveProgress()}>{saving ? 'Saving…' : 'Save progress'}</Button></div></Card></div>}
    <ConfirmDialog open={Boolean(targetGoal)} title="Delete this goal?" description={targetGoal ? `“${targetGoal.title}” will be permanently removed.` : ''} confirmLabel="Delete goal" loading={deleting} onCancel={() => !deleting && setTargetGoal(null)} onConfirm={() => void removeGoal()} />
  </>
}
