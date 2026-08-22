import { useState } from 'react'
import { X } from 'lucide-react'

import Button from '../ui/Button'
import MemberSelector from '../members/MemberSelector'
import type { CreateTaskInput, Task, TaskPriority, TaskStatus } from '../../types/task'

const emptyForm: CreateTaskInput = {
  title: '',
  projectId: null,
  clientId: null,
  assigneeId: null,
  status: 'todo',
  priority: 'medium',
  description: '',
  dueDate: null,
}

function getInitialForm(task: Task | null): CreateTaskInput {
  if (!task) return emptyForm
  return {
    title: task.title,
    projectId: task.projectId ?? null,
    clientId: task.clientId ?? null,
    assigneeId: task.assigneeId ?? null,
    status: task.status,
    priority: task.priority,
    description: task.description ?? '',
    dueDate: task.dueDate ?? null,
  }
}

type TaskModalProps = {
  workspaceId: string
  task: Task | null
  open: boolean
  saving: boolean
  onClose: () => void
  onSubmit: (input: CreateTaskInput) => Promise<void>
}

function TaskModal({ workspaceId, task, open, saving, onClose, onSubmit }: TaskModalProps) {
  const [form, setForm] = useState<CreateTaskInput>(() => getInitialForm(task))
  const [error, setError] = useState('')

  if (!open) return null

  function setField<K extends keyof CreateTaskInput>(field: K, value: CreateTaskInput[K]) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    if (!form.title.trim()) {
      setError('Task title is required.')
      return
    }
    try {
      await onSubmit(form)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to save task.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[var(--os-border)] bg-[var(--os-surface)] shadow-[var(--os-shadow-lg)]">
        <div className="flex items-center justify-between border-b border-[var(--os-border)] px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-[var(--os-text)]">{task ? 'Edit Task' : 'New Task'}</h2>
            <p className="mt-0.5 text-xs text-[var(--os-text-muted)]">Create and assign work inside Startup OS.</p>
          </div>
          <button type="button" onClick={onClose} disabled={saving} className="os-focus-ring rounded-lg p-2 text-[var(--os-text-muted)] hover:bg-[var(--os-surface-hover)] hover:text-[var(--os-text)]">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-5">
          {error && <div className="rounded-xl border border-[rgba(255,100,124,0.25)] bg-[rgba(255,100,124,0.08)] px-4 py-3 text-sm text-[var(--os-danger)]">{error}</div>}

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-[var(--os-text-secondary)]">Task Title</label>
            <input autoFocus value={form.title} onChange={(event) => setField('title', event.target.value)} placeholder="e.g. Prepare III ROBOTICS website launch checklist" className="os-focus-ring h-11 w-full rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] px-3.5 text-sm text-[var(--os-text)] outline-none placeholder:text-[var(--os-text-muted)]" />
          </div>

          <MemberSelector workspaceId={workspaceId} value={form.assigneeId} onChange={(value) => setField('assigneeId', value)} disabled={saving} />

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-[var(--os-text-secondary)]">Status</span>
              <select value={form.status} onChange={(event) => setField('status', event.target.value as TaskStatus)} className="os-focus-ring h-11 w-full rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] px-3.5 text-sm text-[var(--os-text)] outline-none">
                <option value="todo">To Do</option><option value="in_progress">In Progress</option><option value="blocked">Blocked</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-[var(--os-text-secondary)]">Priority</span>
              <select value={form.priority} onChange={(event) => setField('priority', event.target.value as TaskPriority)} className="os-focus-ring h-11 w-full rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] px-3.5 text-sm text-[var(--os-text)] outline-none">
                <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option>
              </select>
            </label>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-[var(--os-text-secondary)]">Due Date</span>
            <input type="date" value={form.dueDate ? form.dueDate.toISOString().slice(0, 10) : ''} onChange={(event) => setField('dueDate', event.target.value ? new Date(`${event.target.value}T23:59:59`) : null)} className="os-focus-ring h-11 w-full rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] px-3.5 text-sm text-[var(--os-text)] outline-none" />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-[var(--os-text-secondary)]">Description</span>
            <textarea rows={5} value={form.description} onChange={(event) => setField('description', event.target.value)} placeholder="What needs to be completed?" className="os-focus-ring w-full resize-y rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] px-3.5 py-3 text-sm text-[var(--os-text)] outline-none placeholder:text-[var(--os-text-muted)]" />
          </label>

          <div className="flex justify-end gap-2 border-t border-[var(--os-border)] pt-4">
            <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving...' : task ? 'Save Changes' : 'Create Task'}</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default TaskModal
