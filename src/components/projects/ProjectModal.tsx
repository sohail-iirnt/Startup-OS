import { useState } from 'react'
import { X } from 'lucide-react'
import Button from '../ui/Button'
import Input from '../ui/Input'
import type { Client } from '../../types/client'
import type { WorkspaceMember } from '../../types/workspace'
import type { CreateProjectInput, Project } from '../../types/project'

const emptyForm: CreateProjectInput = {
  name: '',
  clientId: '',
  clientName: '',
  ownerId: '',
  ownerName: '',
  type: 'software',
  status: 'planning',
  priority: 'medium',
  startDate: '',
  deadline: '',
  description: '',
  budget: 0,
  projectValue: 0,
  notes: '',
}

function getInitialForm(project?: Project | null): CreateProjectInput {
  if (!project) return emptyForm

  const toInput = (date: Date | null) =>
    date ? date.toISOString().slice(0, 10) : ''

  return {
    name: project.name,
    clientId: project.clientId,
    clientName: project.clientName,
    ownerId: project.ownerId || '',
    ownerName: project.ownerName || '',
    type: project.type,
    status: project.status,
    priority: project.priority,
    startDate: toInput(project.startDate),
    deadline: toInput(project.deadline),
    description: project.description,
    budget: project.budget,
    projectValue: project.projectValue,
    notes: project.notes,
  }
}

type Props = {
  open: boolean
  project?: Project | null
  clients: Client[]
  members?: WorkspaceMember[]
  saving?: boolean
  onClose: () => void
  onSubmit: (input: CreateProjectInput) => Promise<void>
}

function ProjectModal({
  open,
  project = null,
  clients,
  members = [],
  saving = false,
  onClose,
  onSubmit,
}: Props) {
  const [form, setForm] = useState<CreateProjectInput>(() =>
    getInitialForm(project),
  )
  const [localError, setLocalError] = useState('')

  if (!open) return null

  function update<K extends keyof CreateProjectInput>(
    key: K,
    value: CreateProjectInput[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLocalError('')

    if (!form.name.trim()) {
      setLocalError('Project name is required.')
      return
    }

    if (!form.clientId) {
      setLocalError('Please select a client.')
      return
    }

    try {
      await onSubmit({
        ...form,
        name: form.name.trim(),
        clientName: form.clientName.trim(),
        ownerName: form.ownerName.trim(),
      })
    } catch (error) {
      setLocalError(
        error instanceof Error
          ? error.message
          : 'Unable to save project.',
      )
    }
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-[var(--os-border-strong)] bg-[var(--os-surface)] shadow-[var(--os-shadow-lg)]">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--os-border)] bg-[var(--os-surface)] p-5">
          <div>
            <h2 className="text-lg font-semibold text-[var(--os-text)]">
              {project ? 'Edit Project' : 'New Project'}
            </h2>
            <p className="mt-1 text-sm text-[var(--os-text-secondary)]">
              Plan, deliver, and track the work your business is doing.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Close"
            className="os-focus-ring flex h-9 w-9 items-center justify-center rounded-lg text-[var(--os-text-muted)] hover:bg-[var(--os-surface-hover)] hover:text-[var(--os-text)]"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-5 p-5">
          {localError && (
            <div
              role="alert"
              className="rounded-xl border border-[rgba(255,100,124,0.25)] bg-[rgba(255,100,124,0.08)] px-4 py-3 text-sm text-[var(--os-danger)]"
            >
              {localError}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Project Name *"
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              placeholder="e.g. III Robotics Website"
            />

            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--os-text-secondary)]">
                Client *
              </label>
              <select
                value={form.clientId}
                onChange={(e) => {
                  const client = clients.find(
                    (item) => item.id === e.target.value,
                  )
                  update('clientId', e.target.value)
                  update('clientName', client?.name ?? '')
                }}
                className="os-focus-ring h-11 w-full rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] px-3 text-sm text-[var(--os-text)]"
              >
                <option value="">Select client</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                    {client.companyName
                      ? ` — ${client.companyName}`
                      : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--os-text-secondary)]">
                Project Owner
              </label>
              <select
                value={form.ownerId}
                onChange={(e) => {
                  const member = members.find(
                    (item) => item.id === e.target.value,
                  )
                  update('ownerId', e.target.value)
                  update(
                    'ownerName',
                    member?.displayName || member?.email || '',
                  )
                }}
                className="os-focus-ring h-11 w-full rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] px-3 text-sm text-[var(--os-text)]"
              >
                <option value="">Unassigned</option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.displayName || member.email || 'Workspace member'}
                    {member.designation
                      ? ` — ${member.designation}`
                      : ''}
                  </option>
                ))}
              </select>
              <p className="mt-1.5 text-[11px] text-[var(--os-text-muted)]">
                Assign a registered team member responsible for this project.
              </p>
            </div>

            <Select
              label="Type"
              value={form.type}
              onChange={(v) =>
                update('type', v as CreateProjectInput['type'])
              }
              options={[
                ['website', 'Website'],
                ['web-app', 'Web App'],
                ['mobile-app', 'Mobile App'],
                ['branding', 'Branding'],
                ['software', 'Software'],
                ['other', 'Other'],
              ]}
            />
            <Select
              label="Status"
              value={form.status}
              onChange={(v) =>
                update('status', v as CreateProjectInput['status'])
              }
              options={[
                ['planning', 'Planning'],
                ['in-development', 'In Development'],
                ['on-hold', 'On Hold'],
                ['testing', 'Testing'],
                ['completed', 'Completed'],
                ['cancelled', 'Cancelled'],
              ]}
            />
            <Select
              label="Priority"
              value={form.priority}
              onChange={(v) =>
                update('priority', v as CreateProjectInput['priority'])
              }
              options={[
                ['low', 'Low'],
                ['medium', 'Medium'],
                ['high', 'High'],
                ['urgent', 'Urgent'],
              ]}
            />
            <Input
              label="Start Date"
              type="date"
              value={form.startDate}
              onChange={(e) => update('startDate', e.target.value)}
            />
            <Input
              label="Deadline"
              type="date"
              value={form.deadline}
              onChange={(e) => update('deadline', e.target.value)}
            />
            <Input
              label="Budget (₹)"
              type="number"
              min="0"
              value={form.budget}
              onChange={(e) => update('budget', Number(e.target.value))}
            />
            <Input
              label="Project Value (₹)"
              type="number"
              min="0"
              value={form.projectValue}
              onChange={(e) =>
                update('projectValue', Number(e.target.value))
              }
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--os-text-secondary)]">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              rows={3}
              className="os-focus-ring w-full resize-y rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] px-3 py-2.5 text-sm text-[var(--os-text)] outline-none"
              placeholder="What is being delivered?"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--os-text-secondary)]">
              Notes
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => update('notes', e.target.value)}
              rows={3}
              className="os-focus-ring w-full resize-y rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] px-3 py-2.5 text-sm text-[var(--os-text)] outline-none"
              placeholder="Internal notes, requirements, risks..."
            />
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-[var(--os-border)] pt-5 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" disabled={saving} onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {project ? 'Save Changes' : 'Create Project'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: [string, string][]
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-[var(--os-text-secondary)]">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="os-focus-ring h-11 w-full rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] px-3 text-sm text-[var(--os-text)]"
      >
        {options.map(([key, labelText]) => (
          <option key={key} value={key}>
            {labelText}
          </option>
        ))}
      </select>
    </div>
  )
}

export default ProjectModal
