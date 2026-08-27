import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { ArrowDownRight, ArrowUpRight, CircleDollarSign, Eye, Pencil, Trash2, Wallet } from 'lucide-react'
import Button from '../ui/Button'
import Card from '../ui/Card'
import ConfirmDialog from '../ui/ConfirmDialog'
import SectionHeader from '../ui/SectionHeader'
import ThemeSelect from '../ui/ThemeSelect'
import { useAuth } from '../../context/useAuth'
import { useWorkspace } from '../../context/useWorkspace'
import { db } from '../../lib/firebase'
import { createProjectFinanceEntry, deleteProjectFinanceEntry, updateProjectFinanceEntry } from '../../services/financeService'
import type { Project } from '../../types/project'

type ProjectEntryType = 'income' | 'expense'
type ProjectEntry = { id: string; type: ProjectEntryType; amount: number; category: string; description: string; date: Date; method: string; party: string }
type ProjectEntryForm = { type: ProjectEntryType; amount: string; category: string; description: string; date: string; method: string; party: string }

const incomeCategories = ['Project Payment', 'Milestone Payment', 'Advance', 'Additional Work', 'Other']
const expenseCategories = ['Development', 'Design', 'Hosting', 'Software', 'Marketing', 'Contractor', 'Operations', 'Other']
const today = () => new Date().toISOString().slice(0, 10)
const input = 'w-full rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] px-4 py-3 text-sm text-[var(--os-text)] outline-none focus:border-[var(--os-accent)]'
const money = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)
function asDate(value: unknown): Date { if (value && typeof value === 'object' && 'toDate' in value && typeof (value as { toDate?: unknown }).toDate === 'function') return (value as { toDate: () => Date }).toDate(); if (value instanceof Date) return value; const parsed = new Date(String(value ?? '')); return Number.isNaN(parsed.getTime()) ? new Date() : parsed }

export default function ProjectFinance({ project }: { project: Project }) {
  const { user } = useAuth()
  const { workspace, workspaceLoading, hasPermission } = useWorkspace()
  const canManage = hasPermission('finance.manage')
  const [entries, setEntries] = useState<ProjectEntry[]>([])
  const [form, setForm] = useState<ProjectEntryForm>({ type: 'income', amount: '', category: 'Project Payment', description: '', date: today(), method: 'online', party: project.clientName || '' })
  const [editing, setEditing] = useState<ProjectEntry | null>(null)
  const [detail, setDetail] = useState<ProjectEntry | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ProjectEntry | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (workspaceLoading || !workspace?.id) return undefined
    const workspaceId = workspace.id
    return onSnapshot(query(collection(db, 'financeEntries'), where('workspaceId', '==', workspaceId)), (snapshot) => {
      const next = snapshot.docs
        .filter((item) => item.data().projectId === project.id)
        .map((item) => {
          const data = item.data()
          return { id: item.id, type: data.type === 'expense' ? 'expense' : 'income', amount: Number(data.amount ?? 0), category: String(data.category ?? 'General'), description: String(data.description ?? ''), date: asDate(data.date), method: String(data.method ?? ''), party: String(data.party ?? '') }
        })
        .sort((a, b) => b.date.getTime() - a.date.getTime())
      setEntries(next)
    }, () => setError('Project financial data could not be loaded.'))
  }, [project.id, workspace?.id, workspaceLoading])

  const totals = useMemo(() => {
    const income = entries.filter((entry) => entry.type === 'income').reduce((sum, entry) => sum + entry.amount, 0)
    const expenses = entries.filter((entry) => entry.type === 'expense').reduce((sum, entry) => sum + entry.amount, 0)
    const profit = income - expenses
    const budget = Number(project.budget || 0)
    const projectValue = Number(project.projectValue || 0)
    const collectionRate = projectValue > 0 ? Math.round((income / projectValue) * 100) : 0
    const budgetUsed = budget > 0 ? Math.round((expenses / budget) * 100) : 0
    return { income, expenses, profit, budget, remaining: budget - expenses, budgetUsed, margin: income > 0 ? Math.round((profit / income) * 100) : 0, collectionRate }
  }, [entries, project.budget, project.projectValue])

  const categories = form.type === 'income' ? incomeCategories : expenseCategories
  const projectValue = Number(project.projectValue || 0)
  const collectionRemaining = projectValue - totals.income
  const financialHealth = totals.budget <= 0
    ? 'Budget not set'
    : totals.remaining < 0
      ? 'Over budget'
      : totals.budgetUsed >= 90
        ? 'Budget watch'
        : totals.profit < 0
          ? 'Loss making'
          : 'Healthy'

  function resetForm() {
    setEditing(null)
    setForm({ type: 'income', amount: '', category: 'Project Payment', description: '', date: today(), method: 'online', party: project.clientName || '' })
  }

  function startEdit(entry: ProjectEntry) {
    setEditing(entry)
    setForm({ type: entry.type, amount: String(entry.amount), category: entry.category, description: entry.description, date: entry.date.toISOString().slice(0, 10), method: entry.method || 'online', party: entry.party })
  }

  async function save(event: FormEvent) {
    event.preventDefault()
    if (!workspace?.id || !user?.uid || !canManage || Number(form.amount) <= 0) return
    setSaving(true)
    setError('')
    try {
      const category = form.category.trim()
      if (!category) throw new Error('Category is required.')
      const data = { workspaceId: workspace.id, projectId: project.id, projectName: project.name, clientId: project.clientId || '', clientName: project.clientName || '', type: form.type, amount: Number(form.amount), category, description: form.description.trim(), date: new Date(`${form.date}T12:00:00`), method: form.method, party: form.party.trim(), createdBy: user.uid }
      if (editing) await updateProjectFinanceEntry(editing.id, data)
      else await createProjectFinanceEntry(data)
      resetForm()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not save project transaction.')
    } finally {
      setSaving(false)
    }
  }

  async function remove() {
    if (!deleteTarget || !canManage) return
    setDeleting(true)
    setError('')
    try {
      await deleteProjectFinanceEntry(deleteTarget.id)
      setDeleteTarget(null)
      setDetail(null)
    } catch {
      setError('Could not delete project transaction.')
    } finally {
      setDeleting(false)
    }
  }

  return <Card className="mt-4 min-w-0 p-5">
    <SectionHeader title="Project Financials" description="Track revenue, delivery costs, budget usage, and project profitability from the same finance ledger." />
    {error && <div role="alert" className="mt-4 rounded-xl bg-[var(--os-danger-soft)] p-3 text-sm text-[var(--os-danger)]">{error}</div>}
    <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
      <Metric label="Project Value" value={money(projectValue)} icon={<CircleDollarSign size={16} />} />
      <Metric label="Income" value={money(totals.income)} icon={<ArrowUpRight size={16} />} />
      <Metric label="Expenses" value={money(totals.expenses)} icon={<ArrowDownRight size={16} />} />
      <Metric label="Project Profit" value={money(totals.profit)} icon={<CircleDollarSign size={16} />} />
      <Metric label="Budget Remaining" value={money(totals.remaining)} icon={<Wallet size={16} />} />
      <Metric label="Margin" value={totals.income ? `${totals.margin}%` : '—'} icon={<CircleDollarSign size={16} />} />
    </div>
    <div className="mt-5 grid gap-4 lg:grid-cols-3">
      <div className="rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] p-4">
        <div className="flex items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--os-text-muted)]">Budget utilization</p><p className="mt-1 text-sm text-[var(--os-text-secondary)]">{totals.budget ? `${totals.budgetUsed}% of ${money(totals.budget)} used` : 'No project budget set'}</p></div><span className={`text-sm font-bold ${totals.budgetUsed > 100 ? 'text-[var(--os-danger)]' : 'text-[var(--os-text)]'}`}>{totals.budget ? `${totals.budgetUsed}%` : '—'}</span></div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--os-surface-hover)]"><div className={`h-full rounded-full ${totals.budgetUsed > 100 ? 'bg-[var(--os-danger)]' : 'bg-[var(--os-accent)]'}`} style={{ width: `${Math.min(100, totals.budgetUsed)}%` }} /></div>
        {totals.budget && totals.remaining < 0 && <p className="mt-2 text-xs font-medium text-[var(--os-danger)]">Budget exceeded by {money(Math.abs(totals.remaining))}.</p>}
      </div>
      <div className="rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] p-4">
        <div className="flex items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--os-text-muted)]">Revenue collection</p><p className="mt-1 text-sm text-[var(--os-text-secondary)]">{projectValue ? `${Math.min(100, Math.max(0, totals.collectionRate))}% of project value recorded` : 'No project value set'}</p></div><span className="text-sm font-bold text-[var(--os-text)]">{projectValue ? money(Math.max(0, collectionRemaining)) : '—'}</span></div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--os-surface-hover)]"><div className="h-full rounded-full bg-[var(--os-success)]" style={{ width: `${projectValue ? Math.min(100, Math.max(0, totals.collectionRate)) : 0}%` }} /></div>
        <p className="mt-2 text-xs text-[var(--os-text-muted)]">{projectValue ? 'Outstanding against project value' : 'Add a project value to track collection progress.'}</p>
      </div>
      <div className="rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--os-text-muted)]">Financial health</p>
        <p className={`mt-2 text-lg font-bold ${financialHealth === 'Healthy' ? 'text-[var(--os-success)]' : financialHealth === 'Loss making' || financialHealth === 'Over budget' ? 'text-[var(--os-danger)]' : 'text-[var(--os-warning)]'}`}>{financialHealth}</p>
        <p className="mt-1 text-xs text-[var(--os-text-secondary)]">{entries.length} linked transaction{entries.length === 1 ? '' : 's'} · {totals.margin}% realized margin</p>
      </div>
    </div>
    {canManage && <div className="mt-5 rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2"><div><p className="text-sm font-semibold text-[var(--os-text)]">{editing ? 'Edit project transaction' : 'Record project transaction'}</p><p className="mt-1 text-xs text-[var(--os-text-secondary)]">Linked automatically to this project, client, and main Finance ledger.</p></div>{editing && <Button type="button" variant="secondary" onClick={resetForm}>Cancel</Button>}</div>
      <form onSubmit={save} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="flex gap-2 sm:col-span-2 xl:col-span-4">{(['income', 'expense'] as ProjectEntryType[]).map((type) => <button key={type} type="button" onClick={() => setForm((current) => ({ ...current, type, category: type === 'income' ? 'Project Payment' : 'Development' }))} className={`rounded-xl border px-4 py-2.5 text-xs font-semibold capitalize ${form.type === type ? 'border-[var(--os-accent)] bg-[var(--os-accent-soft)] text-[var(--os-accent)]' : 'border-[var(--os-border)] text-[var(--os-text-secondary)]'}`}>{type}</button>)}</div>
        <input required type="number" min="0.01" step="0.01" value={form.amount} onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))} placeholder="Amount ₹" className={input} />
        <ThemeSelect value={form.category} onChange={(value) => setForm((current) => ({ ...current, category: value }))} options={categories.map((value) => ({ value, label: value }))} />
        <input type="date" required value={form.date} onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))} className={input} />
        <ThemeSelect value={form.method} onChange={(value) => setForm((current) => ({ ...current, method: value }))} options={[{ value: 'cash', label: 'Cash' }, { value: 'online', label: 'Online' }]} />
        <input value={form.party} onChange={(event) => setForm((current) => ({ ...current, party: event.target.value }))} placeholder={form.type === 'income' ? 'Received from' : 'Paid to'} className={input} />
        <input value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} placeholder="Description / notes" className={`${input} sm:col-span-2`} />
        <Button type="submit" disabled={saving} className="sm:col-span-2">{saving ? 'Saving…' : editing ? 'Save changes' : 'Add transaction'}</Button>
      </form>
    </div>}
    <div className="mt-5">
      <div className="mb-3 flex items-center justify-between gap-3"><div><p className="text-sm font-semibold text-[var(--os-text)]">Project ledger</p><p className="mt-1 text-xs text-[var(--os-text-secondary)]">{entries.length} linked transaction{entries.length === 1 ? '' : 's'}</p></div></div>
      {entries.length ? <div className="space-y-2">{entries.map((entry) => <button key={entry.id} type="button" onClick={() => setDetail(entry)} className="flex w-full min-w-0 items-center justify-between gap-3 rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] p-4 text-left hover:bg-[var(--os-surface-hover)]"><div className="min-w-0"><p className="truncate text-sm font-semibold text-[var(--os-text)]">{entry.description || entry.category}</p><p className="mt-1 truncate text-xs text-[var(--os-text-muted)]">{entry.category} · {entry.party || '—'} · {entry.date.toLocaleDateString('en-IN')} · {entry.method || '—'}</p></div><div className="flex shrink-0 items-center gap-2"><span className={`text-sm font-bold ${entry.type === 'income' ? 'text-[var(--os-success)]' : 'text-[var(--os-danger)]'}`}>{entry.type === 'income' ? '+' : '-'}{money(entry.amount)}</span><Eye size={15} className="text-[var(--os-text-muted)]" /></div></button>)}</div> : <div className="rounded-xl border border-dashed border-[var(--os-border)] p-8 text-center"><Wallet className="mx-auto text-[var(--os-text-muted)]" size={24} /><p className="mt-2 text-sm font-medium text-[var(--os-text)]">No project transactions yet</p><p className="mt-1 text-xs text-[var(--os-text-secondary)]">Record project income or delivery expenses to start measuring profitability.</p></div>}
    </div>
    {detail && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4" onClick={() => setDetail(null)}><Card className="max-h-[90vh] w-full max-w-xl overflow-y-auto p-6" onClick={(event) => event.stopPropagation()}><div className="flex items-start justify-between gap-4"><div><p className="text-xs uppercase tracking-wider text-[var(--os-text-muted)]">{detail.type}</p><h2 className="mt-1 text-xl font-bold text-[var(--os-text)]">{detail.description || detail.category}</h2></div><button type="button" aria-label="Close transaction details" onClick={() => setDetail(null)} className="text-[var(--os-text-muted)]">✕</button></div><div className="mt-6 grid grid-cols-2 gap-3">{[['Amount', money(detail.amount)], ['Category', detail.category], ['Date', detail.date.toLocaleDateString('en-IN')], ['Method', detail.method || '—'], ['Party', detail.party || '—']].map(([label, value]) => <div key={label} className="rounded-xl border border-[var(--os-border)] p-3"><p className="text-xs text-[var(--os-text-muted)]">{label}</p><p className="mt-1 break-words text-sm font-semibold text-[var(--os-text)]">{value}</p></div>)}</div>{canManage && <div className="mt-5 flex flex-wrap justify-end gap-2"><Button type="button" variant="secondary" onClick={() => { startEdit(detail); setDetail(null) }}><Pencil size={14} /> Edit</Button><Button type="button" variant="danger" onClick={() => setDeleteTarget(detail)}><Trash2 size={14} /> Delete</Button></div>}</Card></div>}
    <ConfirmDialog open={Boolean(deleteTarget)} title="Delete project transaction?" description="This financial record will be permanently removed from this project and the main Finance ledger." confirmLabel={deleting ? 'Deleting…' : 'Delete transaction'} loading={deleting} onConfirm={() => void remove()} onCancel={() => !deleting && setDeleteTarget(null)} />
  </Card>
}

function Metric({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) { return <div className="rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] p-3"><div className="flex items-center justify-between gap-2"><span className="text-[var(--os-accent)]">{icon}</span><span className="truncate text-sm font-semibold text-[var(--os-text)]">{value}</span></div><p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--os-text-muted)]">{label}</p></div> }
