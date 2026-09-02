import { useState } from 'react'
import { X } from 'lucide-react'

import Button from '../ui/Button'
import Input from '../ui/Input'
import type { Client, CreateClientInput } from '../../types/client'

const emptyForm: CreateClientInput = {
  type: 'company',
  name: '',
  companyName: '',
  email: '',
  phone: '',
  website: '',
  address: '',
  status: 'lead',
  source: '',
  notes: '',
}

function getInitialForm(client?: Client | null): CreateClientInput {
  if (!client) return emptyForm
  return {
    type: client.type,
    name: client.name,
    companyName: client.companyName ?? '',
    email: client.email ?? '',
    phone: client.phone ?? '',
    website: client.website ?? '',
    address: client.address ?? '',
    status: client.status,
    source: client.source ?? '',
    notes: client.notes ?? '',
  }
}

type ClientModalProps = {
  open: boolean
  client?: Client | null
  saving?: boolean
  onClose: () => void
  onSubmit: (input: CreateClientInput) => Promise<void>
}

function ClientModal({ open, client = null, saving = false, onClose, onSubmit }: ClientModalProps) {
  const [form, setForm] = useState<CreateClientInput>(() => getInitialForm(client))
  const [localError, setLocalError] = useState('')

  if (!open) return null

  function update<K extends keyof CreateClientInput>(key: K, value: CreateClientInput[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLocalError('')
    if (!form.name.trim()) {
      setLocalError('Client name is required.')
      return
    }
    try {
      await onSubmit(form)
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : 'Unable to save client.')
    }
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[var(--os-border-strong)] bg-[var(--os-surface)] shadow-[var(--os-shadow-lg)]">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--os-border)] bg-[var(--os-surface)] p-5">
          <div>
            <h2 className="text-lg font-semibold text-[var(--os-text)]">{client ? 'Edit Client' : 'Add Client'}</h2>
            <p className="mt-1 text-sm text-[var(--os-text-secondary)]">Keep your client relationship data organized in one place.</p>
          </div>
          <button type="button" onClick={onClose} disabled={saving} aria-label="Close" className="os-focus-ring flex h-9 w-9 items-center justify-center rounded-lg text-[var(--os-text-muted)] hover:bg-[var(--os-surface-hover)] hover:text-[var(--os-text)]">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-5">
          {localError && <div role="alert" className="rounded-xl border border-[rgba(255,100,124,0.25)] bg-[rgba(255,100,124,0.08)] px-4 py-3 text-sm text-[var(--os-danger)]">{localError}</div>}

          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Client Name *" value={form.name} onChange={(event) => update('name', event.target.value)} placeholder="e.g. Anusha Khan" />
            <Input label="Company / Business" value={form.companyName} onChange={(event) => update('companyName', event.target.value)} placeholder="e.g. ABC Enterprises" />
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--os-text-secondary)]">Client Type</label>
              <select value={form.type} onChange={(event) => update('type', event.target.value as CreateClientInput['type'])} className="os-focus-ring h-11 w-full rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] px-3 text-sm text-[var(--os-text)]">
                <option value="individual">Individual</option>
                <option value="company">Company</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--os-text-secondary)]">Status</label>
              <select value={form.status} onChange={(event) => update('status', event.target.value as CreateClientInput['status'])} className="os-focus-ring h-11 w-full rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] px-3 text-sm text-[var(--os-text)]">
                <option value="lead">Lead</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <Input label="Email" type="email" value={form.email} onChange={(event) => update('email', event.target.value)} placeholder="client@example.com" />
            <Input label="Phone" value={form.phone} onChange={(event) => update('phone', event.target.value)} placeholder="+91 ..." />
            <Input label="Website" value={form.website} onChange={(event) => update('website', event.target.value)} placeholder="https://..." />
            <Input label="Source" value={form.source} onChange={(event) => update('source', event.target.value)} placeholder="Referral, Instagram, Website..." />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--os-text-secondary)]">Address</label>
            <textarea value={form.address} onChange={(event) => update('address', event.target.value)} rows={2} className="os-focus-ring w-full resize-y rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] px-3 py-2.5 text-sm text-[var(--os-text)] outline-none" placeholder="Business or client address" />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--os-text-secondary)]">Notes</label>
            <textarea value={form.notes} onChange={(event) => update('notes', event.target.value)} rows={4} className="os-focus-ring w-full resize-y rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] px-3 py-2.5 text-sm text-[var(--os-text)] outline-none" placeholder="Relationship notes, preferences, follow-ups..." />
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-[var(--os-border)] pt-5 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" disabled={saving} onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={saving}>{client ? 'Save Changes' : 'Create Client'}</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ClientModal