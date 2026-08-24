import { useEffect, useMemo, useState } from 'react'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { BarChart3, CheckCircle2, FolderKanban, ListTodo, Users, Wallet } from 'lucide-react'
import Card from '../components/ui/Card'
import SectionHeader from '../components/ui/SectionHeader'
import { useWorkspace } from '../context/useWorkspace'
import { db } from '../lib/firebase'

type Counts = { projects: number; tasks: number; completedTasks: number; members: number; income: number; expense: number }

export default function Analytics() {
  const { workspace, loading } = useWorkspace()
  const [counts, setCounts] = useState<Counts>({ projects: 0, tasks: 0, completedTasks: 0, members: 0, income: 0, expense: 0 })
  const [error, setError] = useState('')

  useEffect(() => {
    if (loading || !workspace?.id) return undefined
    const id = workspace.id
    const unsubs: (() => void)[] = []
    const listen = (name: string, field: keyof Counts, mapper?: (d: Record<string, unknown>) => number) => {
      const ref = query(collection(db, name), where('workspaceId', '==', id))
      return onSnapshot(ref, snap => setCounts(prev => ({ ...prev, [field]: mapper ? snap.docs.reduce((sum, item) => sum + mapper(item.data() as Record<string, unknown>), 0) : snap.size })), e => { console.error(e); setError('Some analytics data could not be loaded.') })
    }
    unsubs.push(listen('projects', 'projects'))
    unsubs.push(listen('tasks', 'tasks'))
    unsubs.push(listen('tasks', 'completedTasks', d => String(d.status ?? '') === 'completed' ? 1 : 0))
    const membersRef = collection(db, 'workspaces', id, 'members')
    unsubs.push(onSnapshot(query(membersRef, where('status', '==', 'active')), snap => setCounts(prev => ({ ...prev, members: snap.size })), e => { console.error(e); setError('Some analytics data could not be loaded.') }))
    unsubs.push(listen('financeEntries', 'income', d => d.type === 'income' ? Number(d.amount ?? 0) : 0))
    unsubs.push(listen('financeEntries', 'expense', d => d.type === 'expense' ? Number(d.amount ?? 0) : 0))
    return () => unsubs.forEach(unsub => unsub())
  }, [workspace?.id, loading])

  const net = useMemo(() => counts.income - counts.expense, [counts.income, counts.expense])
  const completion = counts.tasks ? Math.round((counts.completedTasks / counts.tasks) * 100) : 0
  const cards = [{ label: 'Projects', value: counts.projects, icon: FolderKanban }, { label: 'Tasks', value: counts.tasks, icon: ListTodo }, { label: 'Completed', value: `${completion}%`, icon: CheckCircle2 }, { label: 'Members', value: counts.members, icon: Users }, { label: 'Revenue', value: `₹${counts.income.toLocaleString('en-IN')}`, icon: Wallet }, { label: 'Net cash flow', value: `₹${net.toLocaleString('en-IN')}`, icon: BarChart3 }]

  return <div className="mx-auto w-full max-w-[1600px] p-4 sm:p-6 lg:p-8"><SectionHeader title="Analytics" description="A live operational snapshot of the current workspace."/>{error && <p role="alert" className="mt-5 rounded-xl bg-[var(--os-danger-soft)] p-3 text-sm text-[var(--os-danger)]">{error}</p>}<div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{cards.map(({ label, value, icon: Icon }) => <Card key={label} className="p-5"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--os-accent-soft)] text-[var(--os-accent)]"><Icon size={18}/></span><div><p className="text-xs text-[var(--os-text-muted)]">{label}</p><p className="mt-1 text-2xl font-semibold text-[var(--os-text)]">{value}</p></div></div></Card>)}</div><Card className="mt-6 p-6"><h2 className="text-sm font-semibold text-[var(--os-text)]">Operational health</h2><div className="mt-5 grid gap-5 md:grid-cols-3"><div><div className="flex justify-between text-xs"><span className="text-[var(--os-text-muted)]">Task completion</span><span className="font-semibold text-[var(--os-text)]">{completion}%</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--os-surface-hover)]"><div className="h-full rounded-full bg-[var(--os-success)]" style={{ width: `${completion}%` }}/></div></div><div><p className="text-xs text-[var(--os-text-muted)]">Income</p><p className="mt-1 text-lg font-semibold text-[var(--os-text)]">₹{counts.income.toLocaleString('en-IN')}</p></div><div><p className="text-xs text-[var(--os-text-muted)]">Expenses</p><p className="mt-1 text-lg font-semibold text-[var(--os-text)]">₹{counts.expense.toLocaleString('en-IN')}</p></div></div></Card></div>
}
