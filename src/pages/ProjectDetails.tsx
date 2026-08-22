import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Edit3,
  FolderKanban,
  ListChecks,
  Plus,
  Trash2,
  UserRound,
} from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'

import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import ProjectModal from '../components/projects/ProjectModal'
import TaskModal from '../components/tasks/TaskModal'
import { useAuth } from '../context/useAuth'
import { useWorkspace } from '../context/useWorkspace'
import { getClients } from '../services/clientService'
import { getWorkspaceMembers } from '../services/memberService'
import {
  deleteProject,
  getProject,
  updateProject,
} from '../services/projectService'
import {
  createTask,
  deleteTask,
  getTasks,
  updateTask,
} from '../services/taskService'
import type { Client } from '../types/client'
import type {
  CreateProjectInput,
  Project,
  ProjectPriority,
  ProjectStatus,
} from '../types/project'
import type { CreateTaskInput, Task, TaskPriority, TaskStatus } from '../types/task'
import type { WorkspaceMember } from '../types/workspace'

const statusLabels: Record<ProjectStatus, string> = {
  planning: 'Planning',
  'in-development': 'In Development',
  'on-hold': 'On Hold',
  testing: 'Testing',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

const statusClasses: Record<ProjectStatus, string> = {
  planning: 'bg-[rgba(139,124,255,0.12)] text-[var(--os-accent)]',
  'in-development': 'bg-[rgba(90,169,255,0.12)] text-[var(--os-info)]',
  'on-hold': 'bg-[rgba(255,255,255,0.08)] text-[var(--os-text-secondary)]',
  testing: 'bg-[rgba(245,185,66,0.12)] text-[var(--os-warning)]',
  completed: 'bg-[rgba(66,211,146,0.12)] text-[var(--os-success)]',
  cancelled: 'bg-[rgba(255,100,124,0.12)] text-[var(--os-danger)]',
}

const priorityLabels: Record<ProjectPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
}

const taskStatusLabels: Record<TaskStatus, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  blocked: 'Blocked',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

const taskStatusClasses: Record<TaskStatus, string> = {
  todo: 'bg-[rgba(255,255,255,0.08)] text-[var(--os-text-secondary)]',
  in_progress: 'bg-[rgba(90,169,255,0.12)] text-[var(--os-info)]',
  blocked: 'bg-[rgba(255,100,124,0.12)] text-[var(--os-danger)]',
  completed: 'bg-[rgba(66,211,146,0.12)] text-[var(--os-success)]',
  cancelled: 'bg-[rgba(255,255,255,0.06)] text-[var(--os-text-muted)]',
}

const taskPriorityClasses: Record<TaskPriority, string> = {
  low: 'text-[var(--os-text-muted)]',
  medium: 'text-[var(--os-text-secondary)]',
  high: 'text-[var(--os-warning)]',
  urgent: 'text-[var(--os-danger)]',
}

function money(value: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value)
}

function dateText(date: Date | null | undefined) {
  return date
    ? new Intl.DateTimeFormat('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(date)
    : 'Not set'
}

function taskDateText(date: Date | null | undefined) {
  return date ? dateText(date) : 'No due date'
}

function Item({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] p-4">
      <div className="flex items-center gap-2 text-[var(--os-accent)]">
        {icon}
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--os-text-muted)]">
          {label}
        </span>
      </div>
      <p className="mt-2 break-words text-sm font-medium capitalize text-[var(--os-text)]">
        {value}
      </p>
    </div>
  )
}

function ProjectDetails() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { workspace, loading: workspaceLoading } = useWorkspace()

  const [project, setProject] = useState<Project | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [members, setMembers] = useState<WorkspaceMember[]>([])
  const [loading, setLoading] = useState(true)
  const [tasksLoading, setTasksLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [taskModalOpen, setTaskModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [saving, setSaving] = useState(false)
  const [taskSaving, setTaskSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deletingTask, setDeletingTask] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null)
  const [modalInstance, setModalInstance] = useState(0)
  const [taskModalInstance, setTaskModalInstance] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (workspaceLoading) return

      if (!workspace?.id || !projectId) {
        if (!cancelled) {
          setProject(null)
          setLoading(false)
          setError('Project could not be found.')
        }
        return
      }

      setLoading(true)
      setError('')

      try {
        const [result, clientResult, taskResult, memberResult] =
          await Promise.all([
            getProject(projectId, workspace.id),
            getClients(workspace.id),
            getTasks(workspace.id),
            getWorkspaceMembers(workspace.id),
          ])

        if (cancelled) return

        setProject(result)
        setClients(clientResult)
        setTasks(
          taskResult.filter((task) => task.projectId === projectId),
        )
        setMembers(memberResult)

        if (!result) {
          setError('Project could not be found in this workspace.')
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'Failed to load project details.',
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
        if (!cancelled) setTasksLoading(false)
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [projectId, workspace?.id, workspaceLoading])

  const memberNames = useMemo(() => {
    return new Map(
      members.map((member) => [
        member.id,
        member.displayName || member.email || 'Unnamed member',
      ]),
    )
  }, [members])

  const taskStats = useMemo(() => {
    const completed = tasks.filter(
      (task) => task.status === 'completed',
    ).length
    const active = tasks.filter(
      (task) =>
        task.status !== 'completed' &&
        task.status !== 'cancelled',
    ).length
    const blocked = tasks.filter(
      (task) => task.status === 'blocked',
    ).length

    return {
      total: tasks.length,
      completed,
      active,
      blocked,
      progress:
        tasks.length > 0
          ? Math.round((completed / tasks.length) * 100)
          : 0,
    }
  }, [tasks])

  function openEdit() {
    if (!project) return
    setError('')
    setModalInstance((value) => value + 1)
    setModalOpen(true)
  }

  function openCreateTask() {
    if (!workspace?.id || !project || !user?.uid) {
      setError('Workspace or user is not available.')
      return
    }

    setError('')
    setEditingTask(null)
    setTaskModalInstance((value) => value + 1)
    setTaskModalOpen(true)
  }

  function openEditTask(task: Task) {
    setError('')
    setEditingTask(task)
    setTaskModalInstance((value) => value + 1)
    setTaskModalOpen(true)
  }

  async function save(input: CreateProjectInput) {
    if (!project || !workspace?.id) {
      throw new Error('Workspace is not available.')
    }

    setSaving(true)
    setError('')

    try {
      const updated = await updateProject(
        project.id,
        workspace.id,
        input,
      )
      setProject(updated)
      setModalOpen(false)
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'Failed to update project.',
      )
      throw saveError
    } finally {
      setSaving(false)
    }
  }

  async function saveTask(input: CreateTaskInput) {
    if (!workspace?.id || !user?.uid || !project) {
      throw new Error('Workspace or user is not available.')
    }

    setTaskSaving(true)
    setError('')

    try {
      const taskInput: CreateTaskInput = {
        ...input,
        projectId: project.id,
        clientId: input.clientId ?? project.clientId ?? null,
      }

      if (editingTask) {
        const updated = await updateTask(
          editingTask.id,
          workspace.id,
          taskInput,
        )
        setTasks((current) =>
          current.map((task) =>
            task.id === updated.id ? updated : task,
          ),
        )
      } else {
        const created = await createTask(
          workspace.id,
          user.uid,
          taskInput,
        )
        setTasks((current) => [created, ...current])
      }

      setTaskModalOpen(false)
      setEditingTask(null)
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'Failed to save task.',
      )
      throw saveError
    } finally {
      setTaskSaving(false)
    }
  }

  async function confirmDelete() {
    if (!project || !workspace?.id) return

    setDeleting(true)
    setError('')

    try {
      await deleteProject(project.id, workspace.id)
      navigate('/projects', { replace: true })
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : 'Failed to delete project.',
      )
      setDeleting(false)
      setConfirmOpen(false)
    }
  }

  async function confirmDeleteTask() {
    if (!taskToDelete || !workspace?.id) return

    setDeletingTask(true)
    setError('')

    try {
      await deleteTask(taskToDelete.id, workspace.id)
      setTasks((current) =>
        current.filter((task) => task.id !== taskToDelete.id),
      )
      setTaskToDelete(null)
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : 'Failed to delete task.',
      )
    } finally {
      setDeletingTask(false)
    }
  }

  if (loading || workspaceLoading) {
    return (
      <div className="mx-auto w-full max-w-[1400px] p-4 sm:p-6 lg:p-8">
        <Card className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-5 w-32 rounded bg-[var(--os-surface-hover)]" />
            <div className="h-10 w-2/3 rounded bg-[var(--os-surface-hover)]" />
            <div className="grid gap-4 md:grid-cols-3">
              <div className="h-24 rounded-xl bg-[var(--os-surface-hover)]" />
              <div className="h-24 rounded-xl bg-[var(--os-surface-hover)]" />
              <div className="h-24 rounded-xl bg-[var(--os-surface-hover)]" />
            </div>
          </div>
        </Card>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="mx-auto w-full max-w-[1400px] p-4 sm:p-6 lg:p-8">
        <Card className="p-8 text-center">
          <FolderKanban
            size={30}
            className="mx-auto text-[var(--os-accent)]"
          />
          <h1 className="mt-4 text-xl font-semibold text-[var(--os-text)]">
            Project not found
          </h1>
          <p className="mt-2 text-sm text-[var(--os-text-secondary)]">
            {error || 'This project is no longer available.'}
          </p>
          <Button
            type="button"
            className="mt-6"
            onClick={() => navigate('/projects')}
          >
            <ArrowLeft size={16} />
            Back to Projects
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-[1400px] p-4 sm:p-6 lg:p-8">
      <button
        type="button"
        onClick={() => navigate('/projects')}
        className="os-focus-ring mb-6 inline-flex items-center gap-2 rounded-lg text-sm font-medium text-[var(--os-text-secondary)] hover:text-[var(--os-text)]"
      >
        <ArrowLeft size={16} />
        Back to Projects
      </button>

      {error && (
        <div
          role="alert"
          className="mb-6 rounded-xl border border-[rgba(255,100,124,0.25)] bg-[rgba(255,100,124,0.08)] px-4 py-3 text-sm text-[var(--os-danger)]"
        >
          {error}
        </div>
      )}

      <section className="mb-6 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[var(--os-accent-soft)] text-[var(--os-accent)]">
            <FolderKanban size={25} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-3xl font-semibold tracking-tight text-[var(--os-text)] sm:text-4xl">
                {project.name}
              </h1>
              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusClasses[project.status]}`}
              >
                {statusLabels[project.status]}
              </span>
            </div>
            <p className="mt-2 text-sm text-[var(--os-text-secondary)]">
              {project.clientName || 'No client assigned'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={openEdit}
            disabled={deleting}
          >
            <Edit3 size={15} />
            Edit Project
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setConfirmOpen(true)}
            disabled={deleting || saving}
          >
            <Trash2 size={15} />
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Item
          icon={<UserRound size={16} />}
          label="Client"
          value={project.clientName || 'Not assigned'}
        />
        <Item
          icon={<FolderKanban size={16} />}
          label="Type"
          value={project.type.replace('-', ' ')}
        />
        <Item
          icon={<CircleDollarSign size={16} />}
          label="Project Value"
          value={money(project.projectValue)}
        />
        <Item
          icon={<CircleDollarSign size={16} />}
          label="Budget"
          value={money(project.budget)}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <h2 className="text-sm font-semibold text-[var(--os-text)]">
            Project Snapshot
          </h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Item
              icon={<CalendarDays size={16} />}
              label="Start Date"
              value={dateText(project.startDate)}
            />
            <Item
              icon={<CalendarDays size={16} />}
              label="Deadline"
              value={dateText(project.deadline)}
            />
            <Item
              icon={<FolderKanban size={16} />}
              label="Priority"
              value={priorityLabels[project.priority]}
            />
            <Item
              icon={<CircleDollarSign size={16} />}
              label="Value vs Budget"
              value={money(project.projectValue - project.budget)}
            />
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-sm font-semibold text-[var(--os-text)]">
            Timeline
          </h2>
          <div className="mt-5 space-y-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--os-text-muted)]">
                Created
              </p>
              <p className="mt-1 text-sm text-[var(--os-text-secondary)]">
                {dateText(project.createdAt)}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--os-text-muted)]">
                Last Updated
              </p>
              <p className="mt-1 text-sm text-[var(--os-text-secondary)]">
                {dateText(project.updatedAt)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="mt-4 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <ListChecks size={18} className="text-[var(--os-accent)]" />
              <h2 className="text-sm font-semibold text-[var(--os-text)]">
                Project Tasks
              </h2>
            </div>
            <p className="mt-1 text-xs text-[var(--os-text-secondary)]">
              Work assigned to your registered workspace members.
            </p>
          </div>
          <Button type="button" onClick={openCreateTask}>
            <Plus size={15} />
            Add Task
          </Button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-4">
          <MiniStat label="Total" value={String(taskStats.total)} />
          <MiniStat label="Active" value={String(taskStats.active)} />
          <MiniStat label="Completed" value={String(taskStats.completed)} />
          <MiniStat label="Blocked" value={String(taskStats.blocked)} />
        </div>

        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="font-medium text-[var(--os-text-secondary)]">
              Project task progress
            </span>
            <span className="font-semibold text-[var(--os-text)]">
              {taskStats.progress}%
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[var(--os-surface-hover)]">
            <div
              className="h-full rounded-full bg-[var(--os-accent)] transition-all"
              style={{ width: `${taskStats.progress}%` }}
            />
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {tasksLoading ? (
            [1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-20 animate-pulse rounded-xl bg-[var(--os-surface-hover)]"
              />
            ))
          ) : tasks.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--os-border)] bg-[var(--os-surface-raised)] p-6 text-center">
              <CheckCircle2
                size={22}
                className="mx-auto text-[var(--os-text-muted)]"
              />
              <p className="mt-3 text-sm font-medium text-[var(--os-text)]">
                No tasks assigned to this project yet.
              </p>
              <p className="mt-1 text-xs text-[var(--os-text-secondary)]">
                Add the first task and assign it to a registered team member.
              </p>
            </div>
          ) : (
            tasks.map((task) => (
              <div
                key={task.id}
                className="rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] p-4"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-sm font-semibold text-[var(--os-text)]">
                        {task.title}
                      </h3>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${taskStatusClasses[task.status]}`}
                      >
                        {taskStatusLabels[task.status]}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[var(--os-text-secondary)]">
                      <span className={taskPriorityClasses[task.priority]}>
                        {task.priority.charAt(0).toUpperCase() +
                          task.priority.slice(1)}{' '}
                        priority
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <UserRound size={13} />
                        {task.assigneeId
                          ? memberNames.get(task.assigneeId) ||
                            'Workspace member'
                          : 'Unassigned'}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarDays size={13} />
                        {taskDateText(task.dueDate)}
                      </span>
                    </div>
                  </div>

                  <div className="flex shrink-0 gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => openEditTask(task)}
                    >
                      <Edit3 size={13} />
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setTaskToDelete(task)}
                    >
                      <Trash2 size={13} />
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      <Card className="mt-4 p-5">
        <h2 className="text-sm font-semibold text-[var(--os-text)]">
          Description
        </h2>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[var(--os-text-secondary)]">
          {project.description || 'No project description added.'}
        </p>
      </Card>

      <Card className="mt-4 p-5">
        <h2 className="text-sm font-semibold text-[var(--os-text)]">
          Notes
        </h2>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[var(--os-text-secondary)]">
          {project.notes || 'No notes added.'}
        </p>
      </Card>

      <ProjectModal
        key={`project-details-modal-${modalInstance}`}
        open={modalOpen}
        project={project}
        clients={clients}
        saving={saving}
        onClose={() => !saving && setModalOpen(false)}
        onSubmit={save}
      />

      {workspace?.id && (
        <TaskModal
          key={`project-task-modal-${taskModalInstance}`}
          workspaceId={workspace.id}
          task={editingTask}
          open={taskModalOpen}
          saving={taskSaving}
          onClose={() => {
            if (!taskSaving) {
              setTaskModalOpen(false)
              setEditingTask(null)
            }
          }}
          onSubmit={saveTask}
        />
      )}

      <ConfirmDialog
        open={confirmOpen}
        title="Delete project?"
        description={
          <>
            You are about to permanently delete{' '}
            <strong>{project.name}</strong>. This cannot be undone.
          </>
        }
        confirmLabel="Delete Project"
        loading={deleting}
        onCancel={() => !deleting && setConfirmOpen(false)}
        onConfirm={confirmDelete}
      />

      <ConfirmDialog
        open={Boolean(taskToDelete)}
        title="Delete task?"
        description={
          taskToDelete ? (
            <>
              You are about to permanently delete{' '}
              <strong>{taskToDelete.title}</strong>. This cannot be undone.
            </>
          ) : (
            ''
          )
        }
        confirmLabel="Delete Task"
        loading={deletingTask}
        onCancel={() => !deletingTask && setTaskToDelete(null)}
        onConfirm={confirmDeleteTask}
      />
    </div>
  )
}

function MiniStat({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] p-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--os-text-muted)]">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold text-[var(--os-text)]">
        {value}
      </p>
    </div>
  )
}

export default ProjectDetails
