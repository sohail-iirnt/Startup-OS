import { useMemo, useState } from 'react'
import { addDoc, collection, deleteDoc, onSnapshot, query, where } from 'firebase/firestore'
import { ArrowDownRight, ArrowUpRight, CircleDollarSign, Plus, Trash2, Wallet } from 'lucide-react'

import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import SectionHeader from '../components/ui/SectionHeader'
import StatCard from '../components/ui/StatCard'
import { useAuth } from '../context/useAuth'
import { useWorkspace } from '../context/useWorkspace'
import { db } from '../lib/firebase'
import { useEffect } from 'react'

type FinanceEntry = { id: string; type: 'income' | 'expense'; amount: number; category: string; description: string; date: Date }

function toDate(value: unknown) {
  if (value instanceof Date) return value
  if (value && typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') return value.toDate() as Date
  return new Date()
}

function money(value: number) { return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value) }

export default function Finance() {
  const { user } = useAuth()
  const { workspace, loading: workspaceLoading } = useWorkspace()
  const [entries, setEntries] = useState<FinanceEntry[]>([])
  const [form, setForm] = useState({ type: 'income' as 'income' | 'expense', amount: '', category: '', description: '', date: new Date().toISOString().slice(0, 10) })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (workspaceLoading || !workspace?.id) return undefined
    return onSnapshot(query(collection(db, 'financeEntries'), where('workspaceId', '==', workspace.id)), snapshot => {
      setEntries(snapshot.docs.map(doc => { const d = doc.data(); return { id: doc.id, type: d.type === 'expense' ? 'expense' : 'income', amount: Number(d.amount ?? 0), category: String(d.category ?? 'General'), description: String(d.description ?? ''), date: toDate(d.date) } }).sort((a, b) => b.date.getTime() - a.date.getTime()))
    }, snapshotError => { console.error(snapshotError); setError('Finance data could not be loaded.') })
  }, [workspace?.id, workspaceLoading])

  const income = useMemo(() => entries.filter(e => e.type === 'income').reduce((n, e) => n + e.amount, 0), [entries])
  const expenses = useMemo(() => entries.filter(e => e.type === 'expense').reduce((n, e) => n + e.amount, 0), [entries])
  const profit = income - expenses

  async function addEntry(event: React.FormEvent) {
    event.preventDefault()
    if (!workspace?.id || !user?.uid || Number(form.amount) <= 0 || !form.category.trim()) return
    setSaving(true); setError('')
    try {
      await addDoc(collection(db, 'financeEntries'), { workspaceId: workspace.id, type: form.type, amount: Number(form.amount), category: form.category.trim(), description: form.description.trim(), date: new Date(`${form.date}T12:00:00`), createdBy: user.uid })
      setForm({ type: 'income', amount: '', category: '', description: '', date: new Date().toISOString().slice(0, 10) })
    } catch (e) { console.error(e); setError('Could not save the transaction.') } finally { setSaving(false) }
  }

  async function removeEntry(id: string) { if (!confirm('Delete this transaction?')) return; try { await deleteDoc(collection(db, 'financeEntries').doc(id) as never) } catch (e) { console.error(e); setError('Could not delete the transaction.') } }

  return <div className="mx-auto w-full max-w-[1600px] p-4 sm:p-6 lg:p-8">
    <div className="mb-8"><p className="mb-2 text-sm font-medium text-[var(--os-accent)]">Financial Command Center</p><h1 className="text-3xl font-semibold tracking-tight text-[var(--os-text)] sm:text-4xl">Finance</h1><p className="mt-2 text-sm text-[var(--os-text-secondary)]">Track real income and expenses so Startup OS can grow into a complete financial intelligence layer.</p></div>
    {error && <div role="alert" className="mb-6 rounded-xl border border-[rgba(255,100,124,0.25)] bg-[rgba(255,100,124,0.08)] px-4 py-3 text-sm text-[var(--os-danger)]">{error}</div>}
    <div className="grid gap-4 sm:grid-cols-3"><StatCard label="Income" value={money(income)} description="Recorded income" icon={<ArrowUpRight size={19} />} /><StatCard label="Expenses" value={money(expenses)} description="Recorded expenses" icon={<ArrowDownRight size={19} />} /><StatCard label="Net Position" value={money(profit)} description="Income minus expenses" icon={<CircleDollarSign size={19} />} /></div>
    <div className="mt-6 grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
      <Card className="p-6"><SectionHeader title="Record transaction" description="Start building the workspace financial ledger." /><form onSubmit={addEntry} className="mt-5 space-y-3">
        <div className="grid grid-cols-2 gap-2">{(['income','expense'] as const).map(type => <button key={type} type="button" onClick={() => setForm(f => ({ ...f, type }))} className={`rounded-xl border px-4 py-2.5 text-sm font-medium capitalize ${form.type === type ? 'border-[var(--os-accent)] bg-[var(--os-accent-soft)] text-[var(--os-accent)]' : 'border-[var(--os-border)] text-[var(--os-text-secondary)]'}`}>{type}</button>)}</div>
        <input required type="number" min="1" step="0.01" placeholder="Amount (₹)" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} className="os-input w-full" />
        <input required placeholder="Category" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="os-input w-full" />
        <input placeholder="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="os-input w-full" />
        <input required type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="os-input w-full" />
        <Button type="submit" disabled={saving} className="w-full"><Plus size={17} />{saving ? 'Saving…' : 'Add transaction'}</Button>
      </form></Card>
      <Card className="p-6"><SectionHeader title="Recent transactions" description={`${entries.length} recorded entries`} />{entries.length === 0 ? <div className="mt-6 rounded-2xl border border-dashed border-[var(--os-border)] p-8 text-center"><Wallet className="mx-auto text-[var(--os-text-muted)]" size={28}/><p className="mt-3 text-sm font-medium text-[var(--os-text)]">No transactions yet</p><p className="mt-1 text-xs text-[var(--os-text-muted)]">Add the first income or expense to begin.</p></div> : <div className="mt-5 space-y-2">{entries.slice(0, 12).map(e => <div key={e.id} className="flex items-center justify-between gap-3 rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] p-3.5"><div className="min-w-0"><p className="truncate text-sm font-medium text-[var(--os-text)]">{e.description || e.category}</p><p className="mt-1 text-xs text-[var(--os-text-muted)]">{e.category} · {e.date.toLocaleDateString('en-IN')}</p></div><div className="flex items-center gap-3"><span className={`text-sm font-semibold ${e.type === 'income' ? 'text-[var(--os-success)]' : 'text-[var(--os-danger)]'}`}>{e.type === 'income' ? '+' : '-'}{money(e.amount)}</span>{workspace?.id && <button type="button" aria-label="Delete transaction" onClick={() => removeEntry(e.id)} className="rounded-lg p-2 text-[var(--os-text-muted)] hover:bg-[var(--os-surface-hover)] hover:text-[var(--os-danger)]"><Trash2 size={15}/></button>}</div></div>)}</div>}</Card>
    </div>
  </div>
}
