import { useEffect, useState } from 'react'
import { CheckCircle2, Clock3, ListTodo, Plus, Search, UserRound } from 'lucide-react'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import TaskModal from '../components/tasks/TaskModal'
import { useAuth } from '../context/useAuth'
import { useWorkspace } from '../context/useWorkspace'
import { getWorkspaceMembers } from '../services/memberService'
import { createTask, deleteTask, subscribeToTasks, updateTask } from '../services/taskService'
import type { CreateTaskInput, Task, TaskPriority, TaskStatus } from '../types/task'
import type { WorkspaceMember } from '../types/workspace'

const statusLabels: Record<TaskStatus, string> = { todo: 'To Do', in_progress: 'In Progress', blocked: 'Blocked', completed: 'Completed', cancelled: 'Cancelled' }
const priorityClasses: Record<TaskPriority, string> = { low: 'text-[var(--os-text-muted)]', medium: 'text-[var(--os-info)]', high: 'text-[var(--os-warning)]', urgent: 'text-[var(--os-danger)]' }
function getMemberName(member: WorkspaceMember | undefined, currentUserId: string | undefined, currentUserName: string | null | undefined, currentUserEmail: string | null | undefined) { return member?.displayName?.trim() || member?.email?.trim() || (member?.userId === currentUserId ? currentUserName?.trim() || currentUserEmail?.trim() || 'You' : 'Workspace member') }

function Tasks() {
  const { user } = useAuth(); const { workspace, loading: workspaceLoading, hasPermission } = useWorkspace()
  const canAssign = hasPermission('tasks.create') || hasPermission('members.manage') || hasPermission('members.approve')
  const canCreate = hasPermission('tasks.create')
  const canDelete = hasPermission('tasks.delete')
  const [tasks, setTasks] = useState<Task[]>([]); const [members, setMembers] = useState<WorkspaceMember[]>([]); const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false); const [deletingId, setDeletingId] = useState<string | null>(null); const [error, setError] = useState(''); const [search, setSearch] = useState(''); const [modalOpen, setModalOpen] = useState(false); const [editingTask, setEditingTask] = useState<Task | null>(null); const [modalInstance, setModalInstance] = useState(0); const [taskToDelete, setTaskToDelete] = useState<Task | null>(null)

  useEffect(() => {
    if (workspaceLoading || !workspace?.id || !user?.uid) return undefined
    const workspaceId = workspace.id
    let active = true; let unsubscribe: (() => void) | undefined
    async function start() {
      try {
        if (canAssign) setMembers(await getWorkspaceMembers(workspaceId))
        unsubscribe = await subscribeToTasks(workspaceId, (next) => { if (active) { setTasks(next); setLoading(false) } }, (listenError) => { if (active) { setError(listenError.message); setLoading(false) } })
      } catch (loadError) { if (active) { setError(loadError instanceof Error ? loadError.message : 'Unable to load tasks.'); setLoading(false) } }
    }
    void start(); return () => { active = false; unsubscribe?.() }
  }, [workspace?.id, workspaceLoading, user?.uid, canAssign])

  function openCreate() { setEditingTask(null); setModalInstance((current) => current + 1); setModalOpen(true) }
  function openEdit(task: Task) { setEditingTask(task); setModalInstance((current) => current + 1); setModalOpen(true) }
  async function handleSave(input: CreateTaskInput) { if (!workspace?.id || !user?.uid) throw new Error('Workspace or user is not available.'); setSaving(true); try { if (editingTask) await updateTask(editingTask.id, workspace.id, input); else await createTask(workspace.id, user.uid, input); setModalOpen(false) } finally { setSaving(false) } }
  async function confirmDelete() { if (!taskToDelete || !workspace?.id || deletingId) return; setDeletingId(taskToDelete.id); setError(''); try { await deleteTask(taskToDelete.id, workspace.id); setTaskToDelete(null) } catch (deleteError) { setError(deleteError instanceof Error ? deleteError.message : 'Unable to delete task.') } finally { setDeletingId(null) } }

  const normalizedSearch = search.trim().toLowerCase(); const filteredTasks = tasks.filter((task) => task.title.toLowerCase().includes(normalizedSearch) || (task.description ?? '').toLowerCase().includes(normalizedSearch)); const active = tasks.filter((task) => task.status !== 'completed' && task.status !== 'cancelled').length; const completed = tasks.filter((task) => task.status === 'completed').length; const overdue = tasks.filter((task) => task.dueDate && task.dueDate < new Date() && task.status !== 'completed' && task.status !== 'cancelled').length

  return <div className="mx-auto w-full max-w-[1400px] p-4 sm:p-6 lg:p-8"><section className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--os-accent)]">Execution</p><h1 className="mt-1 text-3xl font-semibold tracking-tight text-[var(--os-text)]">{canAssign ? 'Tasks' : 'My Tasks'}</h1><p className="mt-2 max-w-2xl text-sm text-[var(--os-text-secondary)]">{canAssign ? 'Turn projects into assigned, trackable work for your registered workspace members.' : 'Tasks assigned to you. Update your own work without seeing workspace-wide task data.'}</p></div>{canCreate && <Button type="button" onClick={openCreate}><Plus size={16} /> New Task</Button>}</section>
    {error && <div role="alert" className="mb-5 rounded-xl border border-[rgba(255,100,124,0.25)] bg-[rgba(255,100,124,0.08)] px-4 py-3 text-sm text-[var(--os-danger)]">{error}</div>}
    <div className="mb-5 grid gap-4 sm:grid-cols-3"><Card className="p-5"><div className="flex items-center gap-3"><ListTodo className="text-[var(--os-accent)]" size={20} /><div><p className="text-xs text-[var(--os-text-muted)]">Active Tasks</p><p className="mt-1 text-2xl font-semibold text-[var(--os-text)]">{active}</p></div></div></Card><Card className="p-5"><div className="flex items-center gap-3"><CheckCircle2 className="text-[var(--os-success)]" size={20} /><div><p className="text-xs text-[var(--os-text-muted)]">Completed</p><p className="mt-1 text-2xl font-semibold text-[var(--os-text)]">{completed}</p></div></div></Card><Card className="p-5"><div className="flex items-center gap-3"><Clock3 className="text-[var(--os-danger)]" size={20} /><div><p className="text-xs text-[var(--os-text-muted)]">Overdue</p><p className="mt-1 text-2xl font-semibold text-[var(--os-text)]">{overdue}</p></div></div></Card></div>
    <Card className="mb-5 p-3"><div className="flex items-center gap-3 px-2"><Search size={17} className="text-[var(--os-text-muted)]" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search tasks..." className="h-10 min-w-0 flex-1 bg-transparent text-sm text-[var(--os-text)] outline-none placeholder:text-[var(--os-text-muted)]" /></div></Card>
    {loading || workspaceLoading ? <Card className="p-8 text-center text-sm text-[var(--os-text-secondary)]">Loading tasks...</Card> : filteredTasks.length === 0 ? <Card className="p-10 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--os-accent-soft)] text-[var(--os-accent)]"><ListTodo size={22} /></div><h2 className="mt-4 text-lg font-semibold text-[var(--os-text)]">No tasks yet</h2><p className="mx-auto mt-2 max-w-md text-sm text-[var(--os-text-secondary)]">{canCreate ? 'Create the first task and assign it to a registered workspace member.' : 'Tasks assigned to you will appear here automatically.'}</p>{canCreate && <div className="mt-5"><Button type="button" onClick={openCreate}><Plus size={16} /> New Task</Button></div>}</Card> : <div className="space-y-3">{filteredTasks.map((task) => { const member = members.find((item) => item.userId === task.assigneeId); const assigneeName = task.assigneeId ? getMemberName(member, user?.uid, user?.displayName, user?.email) : 'Unassigned'; return <Card key={task.id} className="p-4 transition-colors hover:border-[var(--os-border-strong)]"><div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><button type="button" onClick={() => openEdit(task)} className="min-w-0 text-left"><div className="flex flex-wrap items-center gap-2"><h2 className="truncate text-base font-semibold text-[var(--os-text)]">{task.title}</h2><span className={`text-[11px] font-semibold uppercase tracking-wide ${priorityClasses[task.priority]}`}>{task.priority}</span></div><p className="mt-1 line-clamp-2 text-sm text-[var(--os-text-secondary)]">{task.description || 'No description added.'}</p></button><div className="flex flex-wrap items-center gap-3 text-xs text-[var(--os-text-muted)]"><span className="inline-flex items-center gap-1.5" title={assigneeName}><UserRound size={14} />{assigneeName}</span><span className="rounded-full bg-[var(--os-surface-hover)] px-2.5 py-1 font-medium text-[var(--os-text-secondary)]">{statusLabels[task.status]}</span>{task.dueDate && <span>Due {task.dueDate.toLocaleDateString('en-IN')}</span>}{canDelete && <Button type="button" variant="secondary" onClick={() => setTaskToDelete(task)} disabled={deletingId === task.id}>Delete</Button>}</div></div></Card> })}</div>}
    {workspace && <TaskModal key={`task-modal-${modalInstance}`} workspaceId={workspace.id} task={editingTask} open={modalOpen} saving={saving} canAssign={canAssign} currentUserName={user?.displayName || user?.email || 'You'} currentUserId={user?.uid} onClose={() => setModalOpen(false)} onSubmit={handleSave} />}
    <ConfirmDialog open={Boolean(taskToDelete)} title="Delete task?" description={taskToDelete ? <>You are about to permanently delete <strong className="font-semibold text-[var(--os-text)]">“{taskToDelete.title}”</strong>. This action cannot be undone.</> : ''} confirmLabel="Delete Task" cancelLabel="Keep Task" loading={Boolean(deletingId)} onConfirm={() => void confirmDelete()} onCancel={() => !deletingId && setTaskToDelete(null)} />
  </div>
}
export default Tasks
