import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Archive, ArchiveRestore, BookOpen, CalendarDays, Check, Clock3, ExternalLink, FileText, Filter, FolderOpen, Pencil, Plus, Search, Star, Tag, Trash2, X } from 'lucide-react'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import SectionHeader from '../components/ui/SectionHeader'
import ThemeSelect from '../components/ui/ThemeSelect'
import { useAuth } from '../context/useAuth'
import { useWorkspace } from '../context/useWorkspace'
import { createKnowledgeDocument, deleteKnowledgeDocument, subscribeToKnowledgeDocuments, toggleKnowledgeDocumentFavorite, updateKnowledgeDocument } from '../services/knowledgeDocumentService'
import type { CreateKnowledgeDocumentInput, KnowledgeDocument, KnowledgeDocumentPriority, KnowledgeDocumentStatus } from '../types/knowledgeDocument'

const categories = ['General', 'Policy', 'Finance', 'Legal', 'Operations', 'Product', 'Reference', 'Sales', 'HR', 'Marketing']
const categoryOptions = categories.map(value => ({ value, label: value }))
const priorityOptions = [{ value: 'low', label: 'Low priority' }, { value: 'normal', label: 'Normal priority' }, { value: 'high', label: 'High priority' }]
const statusOptions = [{ value: 'active', label: 'Active' }, { value: 'archived', label: 'Archived' }]
const sortOptions = [{ value: 'recent', label: 'Recently added' }, { value: 'oldest', label: 'Oldest first' }, { value: 'title', label: 'Title A–Z' }, { value: 'review', label: 'Review date' }]

type DocumentForm = CreateKnowledgeDocumentInput

const emptyForm: DocumentForm = { title: '', description: '', category: 'General', url: '', tags: [], priority: 'normal', status: 'active', favorite: false, reviewDate: null }

function dateInput(date: Date | null) { return date ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` : '' }
function parseDate(value: string) { if (!value) return null; const date = new Date(`${value}T12:00:00`); return Number.isNaN(date.getTime()) ? null : date }
function formatDate(date: Date | null) { return date ? date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Not scheduled' }
function isDue(date: Date | null) { if (!date) return false; const today = new Date(); today.setHours(0, 0, 0, 0); const target = new Date(date); target.setHours(0, 0, 0, 0); return target.getTime() <= today.getTime() }

export default function Documents() {
  const { user } = useAuth()
  const { workspace, loading: workspaceLoading, hasPermission } = useWorkspace()
  const canManage = hasPermission('documents.manage')
  const [items, setItems] = useState<KnowledgeDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [queryText, setQueryText] = useState('')
  const [category, setCategory] = useState('all')
  const [status, setStatus] = useState<'all' | KnowledgeDocumentStatus>('all')
  const [priority, setPriority] = useState<'all' | KnowledgeDocumentPriority>('all')
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const [sort, setSort] = useState('recent')
  const [editorOpen, setEditorOpen] = useState(false)
  const [editing, setEditing] = useState<KnowledgeDocument | null>(null)
  const [selected, setSelected] = useState<KnowledgeDocument | null>(null)
  const [target, setTarget] = useState<KnowledgeDocument | null>(null)
  const [form, setForm] = useState<DocumentForm>(emptyForm)
  const [tagDraft, setTagDraft] = useState('')

  useEffect(() => {
    const workspaceId = workspace?.id
    if (workspaceLoading || !workspaceId) return undefined
    setLoading(true)
    const unsubscribe = subscribeToKnowledgeDocuments(workspaceId, next => {
      setItems(next)
      setLoading(false)
      setError('')
    }, listenError => {
      setLoading(false)
      setError(listenError.message || 'Documents could not be loaded.')
    })
    return unsubscribe
  }, [workspace?.id, workspaceLoading])

  const filtered = useMemo(() => {
    const q = queryText.trim().toLowerCase()
    const result = items.filter(item => {
      const haystack = [item.title, item.description, item.category, item.url, ...item.tags].join(' ').toLowerCase()
      return (!q || haystack.includes(q)) && (category === 'all' || item.category === category) && (status === 'all' || item.status === status) && (priority === 'all' || item.priority === priority) && (!favoritesOnly || item.favorite)
    })
    return result.sort((a, b) => {
      if (sort === 'title') return a.title.localeCompare(b.title)
      if (sort === 'oldest') return (a.createdAt?.getTime() ?? 0) - (b.createdAt?.getTime() ?? 0)
      if (sort === 'review') return (a.reviewDate?.getTime() ?? Number.MAX_SAFE_INTEGER) - (b.reviewDate?.getTime() ?? Number.MAX_SAFE_INTEGER)
      return (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0)
    })
  }, [items, queryText, category, status, priority, favoritesOnly, sort])

  const stats = useMemo(() => ({ total: items.length, active: items.filter(item => item.status === 'active').length, favorites: items.filter(item => item.favorite).length, due: items.filter(item => item.status === 'active' && isDue(item.reviewDate)).length }), [items])
  const categoriesInUse = useMemo(() => new Set(items.map(item => item.category)).size, [items])

  function openCreate() { setEditing(null); setForm(emptyForm); setTagDraft(''); setEditorOpen(true); setError('') }
  function openEdit(item: KnowledgeDocument) { setEditing(item); setForm({ title: item.title, description: item.description, category: item.category, url: item.url, tags: item.tags, priority: item.priority, status: item.status, favorite: item.favorite, reviewDate: item.reviewDate }); setTagDraft(''); setEditorOpen(true); setSelected(null); setError('') }
  function closeEditor() { if (!saving) { setEditorOpen(false); setEditing(null); setForm(emptyForm); setTagDraft('') } }
  function addTag() { const tag = tagDraft.trim().replace(/^#/, ''); if (!tag || form.tags.includes(tag)) return; setForm(current => ({ ...current, tags: [...current.tags, tag] })); setTagDraft('') }
  function removeTag(tag: string) { setForm(current => ({ ...current, tags: current.tags.filter(item => item !== tag) })) }

  async function save(event: FormEvent) {
    event.preventDefault()
    const workspaceId = workspace?.id
    if (!workspaceId || !user?.uid || !canManage || !form.title.trim()) return
    setSaving(true); setError('')
    try {
      if (editing) await updateKnowledgeDocument(editing.id, form)
      else await createKnowledgeDocument(workspaceId, user.uid, form)
      closeEditor()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not save the document.')
    } finally { setSaving(false) }
  }

  async function remove() {
    if (!target || !canManage) return
    setDeleting(true); setError('')
    try { await deleteKnowledgeDocument(target.id); setTarget(null); if (selected?.id === target.id) setSelected(null) }
    catch (err: unknown) { setError(err instanceof Error ? err.message : 'Could not delete the document.') }
    finally { setDeleting(false) }
  }

  async function toggleFavorite(item: KnowledgeDocument) {
    if (!canManage) return
    try { await toggleKnowledgeDocumentFavorite(item.id, !item.favorite) }
    catch (err: unknown) { setError(err instanceof Error ? err.message : 'Could not update favorite.') }
  }

  return <div className="mx-auto w-full max-w-[1600px] p-4 sm:p-6 lg:p-8">
    <SectionHeader title="Documents & Knowledge" description="A central knowledge base for policies, references, operating notes, links and important company information." />

    <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Stat icon={<BookOpen size={18} />} label="Knowledge items" value={String(stats.total)} hint={`${categoriesInUse} categories in use`} />
      <Stat icon={<FolderOpen size={18} />} label="Active" value={String(stats.active)} hint="Available to the workspace" />
      <Stat icon={<Star size={18} />} label="Favorites" value={String(stats.favorites)} hint="Quick-access references" />
      <Stat icon={<Clock3 size={18} />} label="Review due" value={String(stats.due)} hint="Due today or overdue" danger={stats.due > 0} />
    </div>

    {error && <div className="mt-5 rounded-2xl border border-[var(--os-danger)]/25 bg-[var(--os-danger-soft)] px-4 py-3 text-sm text-[var(--os-danger)]">{error}</div>}

    <Card className="mt-5 p-3 sm:p-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
        <label className="relative min-w-0 flex-1"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--os-text-muted)]" /><input value={queryText} onChange={event => setQueryText(event.target.value)} placeholder="Search title, notes, category, URL or tags…" className="os-focus-ring box-border h-11 w-full rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] py-2.5 pl-9 pr-3 text-sm text-[var(--os-text)]" /></label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:flex">
          <ThemeSelect value={category} onChange={setCategory} options={[{ value: 'all', label: 'All categories' }, ...categoryOptions]} className="min-w-0 sm:min-w-[155px]" />
          <ThemeSelect value={status} onChange={value => setStatus(value as 'all' | KnowledgeDocumentStatus)} options={[{ value: 'all', label: 'All status' }, ...statusOptions]} className="min-w-0 sm:min-w-[130px]" />
          <ThemeSelect value={priority} onChange={value => setPriority(value as 'all' | KnowledgeDocumentPriority)} options={[{ value: 'all', label: 'All priorities' }, ...priorityOptions]} className="min-w-0 sm:min-w-[145px]" />
          <ThemeSelect value={sort} onChange={setSort} options={sortOptions} className="min-w-0 sm:min-w-[145px]" />
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[var(--os-border)] pt-3">
        <button type="button" onClick={() => setFavoritesOnly(value => !value)} className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${favoritesOnly ? 'border-[var(--os-accent)] bg-[var(--os-accent-soft)] text-[var(--os-accent)]' : 'border-[var(--os-border)] text-[var(--os-text-secondary)] hover:bg-[var(--os-surface-hover)]'}`}><Star size={13} fill={favoritesOnly ? 'currentColor' : 'none'} /> Favorites only</button>
        {(queryText || category !== 'all' || status !== 'all' || priority !== 'all' || favoritesOnly) && <button type="button" onClick={() => { setQueryText(''); setCategory('all'); setStatus('all'); setPriority('all'); setFavoritesOnly(false) }} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-[var(--os-text-muted)] hover:bg-[var(--os-surface-hover)]"><X size={13} /> Clear filters</button>}
        <span className="ml-auto text-xs text-[var(--os-text-muted)]">Showing {filtered.length} of {items.length}</span>
      </div>
    </Card>

    <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--os-accent)]">Workspace knowledge</p><p className="mt-1 text-sm text-[var(--os-text-muted)]">Click any card to inspect the full entry.</p></div>{canManage && <Button type="button" onClick={openCreate}><Plus size={16} /> Add knowledge</Button>}</div>

    {loading ? <Card className="mt-4 p-12 text-center text-sm text-[var(--os-text-muted)]">Loading knowledge base…</Card> : filtered.length === 0 ? <Card className="mt-4 p-12 text-center"><BookOpen size={34} className="mx-auto text-[var(--os-text-muted)]" /><p className="mt-4 text-sm font-semibold text-[var(--os-text)]">No matching knowledge items</p><p className="mt-1 text-xs text-[var(--os-text-muted)]">Try clearing the filters or add a new company reference.</p>{canManage && <Button type="button" className="mt-5" onClick={openCreate}><Plus size={15} /> Add knowledge</Button>}</Card> : <div className="mt-4 grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">{filtered.map(item => <KnowledgeCard key={item.id} item={item} canManage={canManage} onOpen={() => setSelected(item)} onEdit={() => openEdit(item)} onDelete={() => setTarget(item)} onFavorite={() => void toggleFavorite(item)} />)}</div>}

    {editorOpen && <Editor form={form} editing={editing} saving={saving} tagDraft={tagDraft} setTagDraft={setTagDraft} onChange={setForm} onAddTag={addTag} onRemoveTag={removeTag} onSubmit={save} onClose={closeEditor} />}
    {selected && <Detail item={selected} canManage={canManage} onClose={() => setSelected(null)} onEdit={() => openEdit(selected)} onDelete={() => setTarget(selected)} onFavorite={() => void toggleFavorite(selected)} />}
    <ConfirmDialog open={Boolean(target)} title="Delete knowledge item?" description={target ? `“${target.title}” will be permanently removed from this workspace.` : ''} confirmLabel="Delete item" loading={deleting} onCancel={() => !deleting && setTarget(null)} onConfirm={() => void remove()} />
  </div>
}

function Stat({ icon, label, value, hint, danger }: { icon: React.ReactNode; label: string; value: string; hint: string; danger?: boolean }) { return <Card className="p-4"><div className="flex items-start justify-between gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--os-accent-soft)] text-[var(--os-accent)]">{icon}</span><span className={`text-2xl font-bold ${danger ? 'text-[var(--os-danger)]' : 'text-[var(--os-text)]'}`}>{value}</span></div><p className="mt-3 text-xs font-semibold uppercase tracking-wide text-[var(--os-text-muted)]">{label}</p><p className="mt-1 text-xs text-[var(--os-text-secondary)]">{hint}</p></Card> }

function KnowledgeCard({ item, canManage, onOpen, onEdit, onDelete, onFavorite }: { item: KnowledgeDocument; canManage: boolean; onOpen: () => void; onEdit: () => void; onDelete: () => void; onFavorite: () => void }) { const due = item.status === 'active' && isDue(item.reviewDate); return <article role="button" tabIndex={0} onClick={onOpen} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onOpen() } }} className="group cursor-pointer overflow-hidden rounded-2xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] p-5 shadow-[var(--os-shadow-sm)] outline-none transition hover:-translate-y-0.5 hover:border-[var(--os-border-strong)] hover:shadow-[var(--os-shadow-md)] focus-visible:ring-2 focus-visible:ring-[var(--os-accent)]"><div className="flex items-start gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--os-accent-soft)] text-[var(--os-accent)]"><FileText size={19} /></span><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><div className="min-w-0"><h3 className="truncate font-semibold text-[var(--os-text)]">{item.title}</h3><p className="mt-1 text-xs text-[var(--os-text-muted)]">{item.category} · {item.status === 'archived' ? 'Archived' : 'Active'}</p></div><button type="button" aria-label={item.favorite ? 'Remove favorite' : 'Add favorite'} onClick={event => { event.stopPropagation(); onFavorite() }} className={`shrink-0 rounded-lg p-2 ${item.favorite ? 'text-[var(--os-accent)]' : 'text-[var(--os-text-muted)] hover:bg-[var(--os-surface-hover)]'}`}><Star size={16} fill={item.favorite ? 'currentColor' : 'none'} /></button></div></div></div><p className="mt-4 line-clamp-3 min-h-[60px] text-sm leading-5 text-[var(--os-text-secondary)]">{item.description || 'No description added.'}</p><div className="mt-4 flex flex-wrap gap-1.5">{item.tags.slice(0, 4).map(tag => <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-[var(--os-surface-hover)] px-2.5 py-1 text-[10px] font-semibold text-[var(--os-text-secondary)]"><Tag size={10} />{tag}</span>)}{item.tags.length > 4 && <span className="rounded-full bg-[var(--os-surface-hover)] px-2.5 py-1 text-[10px] font-semibold text-[var(--os-text-muted)]">+{item.tags.length - 4}</span>}</div><div className="mt-5 flex items-center justify-between gap-3 border-t border-[var(--os-border)] pt-4"><span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold ${due ? 'text-[var(--os-danger)]' : 'text-[var(--os-text-muted)]'}`}><CalendarDays size={13} /> {item.reviewDate ? `Review ${formatDate(item.reviewDate)}` : 'No review date'}</span><div className="flex items-center gap-1 opacity-80 transition group-hover:opacity-100">{item.url && <ExternalLink size={14} className="text-[var(--os-accent)]" />}{canManage && <><button type="button" onClick={event => { event.stopPropagation(); onEdit() }} className="rounded-lg p-2 text-[var(--os-text-muted)] hover:bg-[var(--os-surface-hover)]" aria-label="Edit"><Pencil size={14} /></button><button type="button" onClick={event => { event.stopPropagation(); onDelete() }} className="rounded-lg p-2 text-[var(--os-text-muted)] hover:bg-[var(--os-danger-soft)] hover:text-[var(--os-danger)]" aria-label="Delete"><Trash2 size={14} /></button></>}</div></div></article> }

function Editor({ form, editing, saving, tagDraft, setTagDraft, onChange, onAddTag, onRemoveTag, onSubmit, onClose }: { form: DocumentForm; editing: KnowledgeDocument | null; saving: boolean; tagDraft: string; setTagDraft: (value: string) => void; onChange: React.Dispatch<React.SetStateAction<DocumentForm>>; onAddTag: () => void; onRemoveTag: (tag: string) => void; onSubmit: (event: FormEvent) => void; onClose: () => void }) { return <div className="fixed inset-0 z-[160] overflow-y-auto bg-black/45 p-4 sm:p-6"><div className="mx-auto flex min-h-full max-w-3xl items-center justify-center"><Card className="w-full overflow-hidden shadow-[var(--os-shadow-lg)]"><div className="flex items-center justify-between border-b border-[var(--os-border)] px-5 py-4 sm:px-6"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--os-accent)]">Knowledge base</p><h2 className="mt-1 text-lg font-semibold text-[var(--os-text)]">{editing ? 'Edit knowledge item' : 'Add knowledge item'}</h2></div><button type="button" onClick={onClose} className="rounded-lg p-2 text-[var(--os-text-muted)] hover:bg-[var(--os-surface-hover)]"><X size={18} /></button></div><form onSubmit={onSubmit} className="space-y-5 p-5 sm:p-6"><div className="grid gap-4 sm:grid-cols-2"><Field label="Title *"><input required value={form.title} onChange={event => onChange(current => ({ ...current, title: event.target.value }))} placeholder="e.g. Client onboarding SOP" className={inputClass} /></Field><Field label="Category"><ThemeSelect value={form.category} onChange={value => onChange(current => ({ ...current, category: value }))} options={categoryOptions} /></Field></div><Field label="Description / notes"><textarea rows={5} value={form.description} onChange={event => onChange(current => ({ ...current, description: event.target.value }))} placeholder="Capture the important context, process, decision or reference…" className={`${inputClass} h-auto py-3`} /></Field><Field label="Source URL"><div className="relative"><ExternalLink size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--os-text-muted)]" /><input type="url" value={form.url} onChange={event => onChange(current => ({ ...current, url: event.target.value }))} placeholder="https://…" className={`${inputClass} pl-9`} /></div></Field><div className="grid gap-4 sm:grid-cols-3"><Field label="Priority"><ThemeSelect value={form.priority} onChange={value => onChange(current => ({ ...current, priority: value as KnowledgeDocumentPriority }))} options={priorityOptions} /></Field><Field label="Status"><ThemeSelect value={form.status} onChange={value => onChange(current => ({ ...current, status: value as KnowledgeDocumentStatus }))} options={statusOptions} /></Field><Field label="Review date"><input type="date" value={dateInput(form.reviewDate)} onChange={event => onChange(current => ({ ...current, reviewDate: parseDate(event.target.value) }))} className={inputClass} /></Field></div><Field label="Tags"><div className="flex gap-2"><input value={tagDraft} onChange={event => setTagDraft(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); onAddTag() } }} placeholder="Type a tag and press Enter" className={`${inputClass} flex-1`} /><Button type="button" variant="secondary" onClick={onAddTag}>Add</Button></div><div className="mt-2 flex flex-wrap gap-2">{form.tags.map(tag => <button type="button" key={tag} onClick={() => onRemoveTag(tag)} className="inline-flex items-center gap-1 rounded-full bg-[var(--os-accent-soft)] px-2.5 py-1 text-[11px] font-semibold text-[var(--os-accent)]">{tag}<X size={11} /></button>)}</div></Field><label className="flex cursor-pointer items-center gap-3 rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-hover)] p-3"><input type="checkbox" checked={form.favorite} onChange={event => onChange(current => ({ ...current, favorite: event.target.checked }))} className="h-4 w-4 accent-[var(--os-accent)]" /><span><span className="block text-sm font-semibold text-[var(--os-text)]">Pin as favorite</span><span className="text-xs text-[var(--os-text-muted)]">Keep this reference easy to find.</span></span></label><div className="flex flex-col-reverse gap-2 border-t border-[var(--os-border)] pt-4 sm:flex-row sm:justify-end"><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? 'Saving…' : editing ? 'Save changes' : 'Create knowledge'}</Button></div></form></Card></div></div> }

function Detail({ item, canManage, onClose, onEdit, onDelete, onFavorite }: { item: KnowledgeDocument; canManage: boolean; onClose: () => void; onEdit: () => void; onDelete: () => void; onFavorite: () => void }) { const due = item.status === 'active' && isDue(item.reviewDate); return <div className="fixed inset-0 z-[150] overflow-y-auto bg-black/45 p-4 sm:p-6" onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}><div className="mx-auto flex min-h-full max-w-2xl items-center justify-center"><Card className="w-full overflow-hidden shadow-[var(--os-shadow-lg)]"><div className="border-b border-[var(--os-border)] bg-[var(--os-surface-hover)] p-5 sm:p-6"><div className="flex items-start justify-between gap-4"><div className="flex items-start gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--os-accent-soft)] text-[var(--os-accent)]"><FileText size={19} /></span><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--os-accent)]">{item.category}</p><h2 className="mt-1 text-xl font-bold text-[var(--os-text)]">{item.title}</h2></div></div><button type="button" onClick={onClose} className="rounded-lg p-2 text-[var(--os-text-muted)] hover:bg-[var(--os-surface)]"><X size={18} /></button></div></div><div className="space-y-5 p-5 sm:p-6"><div className="flex flex-wrap gap-2">{item.tags.map(tag => <span key={tag} className="rounded-full bg-[var(--os-surface-hover)] px-2.5 py-1 text-[11px] font-semibold text-[var(--os-text-secondary)]">#{tag}</span>)}<span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${item.priority === 'high' ? 'bg-[var(--os-danger-soft)] text-[var(--os-danger)]' : 'bg-[var(--os-surface-hover)] text-[var(--os-text-secondary)]'}`}>{item.priority} priority</span></div><div><p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--os-text-muted)]">Notes</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[var(--os-text-secondary)]">{item.description || 'No description added.'}</p></div><div className="grid gap-3 sm:grid-cols-2"><Info label="Status" value={item.status === 'active' ? 'Active' : 'Archived'} /><Info label="Review" value={item.reviewDate ? `${formatDate(item.reviewDate)}${due ? ' · Due' : ''}` : 'Not scheduled'} danger={due} /><Info label="Created" value={formatDate(item.createdAt)} /><Info label="Last updated" value={formatDate(item.updatedAt)} /></div>{item.url && <a href={item.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-xl border border-[var(--os-border)] p-3 text-sm font-semibold text-[var(--os-accent)] hover:bg-[var(--os-surface-hover)]"><ExternalLink size={15} /> Open source reference<span className="ml-auto truncate text-xs font-normal text-[var(--os-text-muted)]">{item.url}</span></a>}<div className="flex flex-col gap-2 border-t border-[var(--os-border)] pt-4 sm:flex-row sm:items-center"><button type="button" onClick={onFavorite} className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--os-border)] px-4 py-2.5 text-sm font-semibold text-[var(--os-text-secondary)] hover:bg-[var(--os-surface-hover)]"><Star size={15} fill={item.favorite ? 'currentColor' : 'none'} />{item.favorite ? 'Favorited' : 'Add favorite'}</button><div className="sm:ml-auto flex gap-2">{canManage && <><Button type="button" variant="secondary" onClick={onEdit}><Pencil size={14} /> Edit</Button><Button type="button" variant="secondary" onClick={onDelete}><Trash2 size={14} /> Delete</Button></>}</div></div></div></Card></div></div> }

function Info({ label, value, danger }: { label: string; value: string; danger?: boolean }) { return <div className="rounded-xl bg-[var(--os-surface-hover)] p-3"><p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--os-text-muted)]">{label}</p><p className={`mt-1 text-sm font-semibold ${danger ? 'text-[var(--os-danger)]' : 'text-[var(--os-text)]'}`}>{value}</p></div> }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block"><span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--os-text-muted)]">{label}</span>{children}</label> }
const inputClass = 'os-focus-ring box-border min-h-11 w-full rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] px-3.5 py-2.5 text-sm text-[var(--os-text)] outline-none'
