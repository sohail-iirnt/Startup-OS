import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { addDoc, collection, deleteDoc, doc, onSnapshot, query, serverTimestamp, where } from 'firebase/firestore'
import { Lightbulb, Plus, Search, Trash2 } from 'lucide-react'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import SectionHeader from '../components/ui/SectionHeader'
import { useAuth } from '../context/useAuth'
import { useWorkspace } from '../context/useWorkspace'
import { db } from '../lib/firebase'

type Idea = { id: string; title: string; description: string; status: string; priority: string; category: string; createdAt?: Date }

export default function Ideas() {
  const { user } = useAuth()
  const { workspace, loading, hasPermission } = useWorkspace()
  const canManage = hasPermission('ideas.manage')
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [target, setTarget] = useState<Idea | null>(null)
  const [form, setForm] = useState({ title: '', description: '', category: 'Product', priority: 'medium' })

  useEffect(() => {
    if (loading || !workspace?.id) return undefined
    return onSnapshot(query(collection(db, 'ideas'), where('workspaceId', '==', workspace.id)), snapshot => setIdeas(snapshot.docs.map(item => { const d = item.data(); const raw = d.createdAt; return { id: item.id, title: String(d.title ?? ''), description: String(d.description ?? ''), status: String(d.status ?? 'new'), priority: String(d.priority ?? 'medium'), category: String(d.category ?? 'Product'), createdAt: raw?.toDate?.() } }).sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0))), e => { console.error(e); setError('Ideas could not be loaded.') })
  }, [workspace?.id, loading])

  const filtered = useMemo(() => { const q = search.trim().toLowerCase(); return ideas.filter(i => !q || `${i.title} ${i.description} ${i.category} ${i.status}`.toLowerCase().includes(q)) }, [ideas, search])

  async function createIdea(event: FormEvent) {
    event.preventDefault(); if (!workspace?.id || !user?.uid || !canManage || !form.title.trim()) return
    setSaving(true); setError('')
    try { await addDoc(collection(db, 'ideas'), { workspaceId: workspace.id, title: form.title.trim(), description: form.description.trim(), category: form.category, priority: form.priority, status: 'new', createdBy: user.uid, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }); setForm({ title: '', description: '', category: 'Product', priority: 'medium' }) } catch (e) { console.error(e); setError('Could not save the idea.') } finally { setSaving(false) }
  }

  async function removeIdea() { if (!target || !canManage) return; setDeleting(true); try { await deleteDoc(doc(db, 'ideas', target.id)); setTarget(null) } catch (e) { console.error(e); setError('Could not delete the idea.') } finally { setDeleting(false) } }

  return <>
    <div className="mx-auto w-full max-w-[1600px] p-4 sm:p-6 lg:p-8"><SectionHeader title="Idea Vault" description="Capture opportunities, product ideas and experiments before they disappear." /><div className="mt-6 grid gap-6 xl:grid-cols-[380px_1fr]">{canManage && <Card className="p-6"><SectionHeader title="Capture idea" description="Keep the first version simple; refine it later." /><form onSubmit={createIdea} className="mt-5 space-y-3"><input required placeholder="Idea title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="w-full rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] px-4 py-3 text-sm text-[var(--os-text)] outline-none" /><textarea rows={5} placeholder="Problem, opportunity or concept…" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="w-full resize-none rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] px-4 py-3 text-sm text-[var(--os-text)] outline-none" /><div className="grid grid-cols-2 gap-3"><select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] px-3 py-3 text-sm text-[var(--os-text)]"><option>Product</option><option>Marketing</option><option>Operations</option><option>Technology</option><option>Business</option></select><select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))} className="rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] px-3 py-3 text-sm text-[var(--os-text)]"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></div><Button type="submit" disabled={saving} className="w-full"><Plus size={17}/>{saving ? 'Saving…' : 'Save idea'}</Button></form></Card>}
    <Card className="p-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-wider text-[var(--os-accent)]">Live vault</p><h2 className="mt-1 text-xl font-semibold text-[var(--os-text)]">{filtered.length} ideas</h2></div><label className="relative block sm:w-72"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--os-text-muted)]"/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search ideas…" className="w-full rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] py-3 pl-9 pr-3 text-sm text-[var(--os-text)] outline-none"/></label></div>{error && <p className="mt-4 rounded-xl bg-[var(--os-danger-soft)] p-3 text-sm text-[var(--os-danger)]">{error}</p>}<div className="mt-5 grid gap-3 lg:grid-cols-2">{filtered.length ? filtered.map(idea => <article key={idea.id} className="rounded-2xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] p-5"><div className="flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--os-accent-soft)] text-[var(--os-accent)]"><Lightbulb size={18}/></span><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-3"><h3 className="font-semibold text-[var(--os-text)]">{idea.title}</h3>{canManage && <button type="button" onClick={() => setTarget(idea)} className="rounded-lg p-2 text-[var(--os-text-muted)] hover:bg-[var(--os-danger-soft)] hover:text-[var(--os-danger)]"><Trash2 size={15}/></button>}</div><p className="mt-1 text-xs text-[var(--os-text-muted)]">{idea.category} · {idea.priority} priority · {idea.status}</p></div></div>{idea.description && <p className="mt-4 text-sm leading-6 text-[var(--os-text-secondary)]">{idea.description}</p>}</article>) : <div className="col-span-full rounded-2xl border border-dashed border-[var(--os-border)] p-10 text-center"><Lightbulb className="mx-auto text-[var(--os-text-muted)]" size={30}/><p className="mt-3 text-sm font-medium text-[var(--os-text)]">No ideas yet</p><p className="mt-1 text-xs text-[var(--os-text-muted)]">Capture the next opportunity for the company.</p></div>}</div></Card></div></div>
    <ConfirmDialog open={Boolean(target)} title="Delete this idea?" description={target ? `“${target.title}” will be permanently removed.` : ''} confirmLabel="Delete idea" loading={deleting} onCancel={() => !deleting && setTarget(null)} onConfirm={() => void removeIdea()} />
  </>
}
