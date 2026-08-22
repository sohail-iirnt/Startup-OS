import { useEffect, useState } from 'react'
import { ArrowLeft, Building2, Edit3, Globe2, Mail, MapPin, Phone, Trash2, UserRound } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'

import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import ClientModal from '../components/clients/ClientModal'
import { useWorkspace } from '../context/useWorkspace'
import { deleteClient, getClient, updateClient } from '../services/clientService'
import type { Client, CreateClientInput, ClientStatus } from '../types/client'

const statusLabels: Record<ClientStatus, string> = { lead: 'Lead', active: 'Active', inactive: 'Inactive', archived: 'Archived' }
const statusClasses: Record<ClientStatus, string> = {
  lead: 'bg-[rgba(245,185,66,0.12)] text-[var(--os-warning)]',
  active: 'bg-[rgba(66,211,146,0.12)] text-[var(--os-success)]',
  inactive: 'bg-[rgba(255,255,255,0.08)] text-[var(--os-text-secondary)]',
  archived: 'bg-[rgba(255,100,124,0.12)] text-[var(--os-danger)]',
}

function ClientDetails() {
  const { clientId } = useParams<{ clientId: string }>()
  const navigate = useNavigate()
  const { workspace, loading: workspaceLoading } = useWorkspace()
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [modalInstance, setModalInstance] = useState(0)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (workspaceLoading) return
      if (!workspace?.id || !clientId) {
        setClient(null)
        setLoading(false)
        setError('Client could not be found.')
        return
      }
      setLoading(true)
      try {
        const result = await getClient(clientId, workspace.id)
        if (cancelled) return
        setClient(result)
        if (!result) setError('Client could not be found in this workspace.')
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : 'Failed to load client.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => { cancelled = true }
  }, [clientId, workspace?.id, workspaceLoading])

  function openEdit() {
    if (!client) return
    setModalInstance((current) => current + 1)
    setModalOpen(true)
  }

  async function handleSave(input: CreateClientInput) {
    if (!client || !workspace?.id) throw new Error('Workspace is not available.')
    setSaving(true)
    try {
      const updated = await updateClient(client.id, workspace.id, input)
      setClient(updated)
      setModalOpen(false)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to update client.')
      throw saveError
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!client || !workspace?.id) return
    setDeleting(true)
    try {
      await deleteClient(client.id, workspace.id)
      navigate('/clients', { replace: true })
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Failed to delete client.')
      setDeleting(false)
      setDeleteOpen(false)
    }
  }

  if (loading || workspaceLoading) {
    return <div className="mx-auto w-full max-w-[1400px] p-4 sm:p-6 lg:p-8"><Card className="h-72 animate-pulse bg-[var(--os-surface-hover)]" /></div>
  }

  if (!client) {
    return <div className="mx-auto w-full max-w-[1400px] p-4 sm:p-6 lg:p-8"><Card className="p-8 text-center"><h1 className="text-xl font-semibold text-[var(--os-text)]">Client not found</h1><p className="mt-2 text-sm text-[var(--os-text-secondary)]">{error || 'This client is no longer available.'}</p><Button className="mt-6" type="button" onClick={() => navigate('/clients')}><ArrowLeft size={16} /> Back to Clients</Button></Card></div>
  }

  return (
    <div className="mx-auto w-full max-w-[1400px] p-4 sm:p-6 lg:p-8">
      <button type="button" onClick={() => navigate('/clients')} className="os-focus-ring mb-6 inline-flex items-center gap-2 rounded-lg text-sm font-medium text-[var(--os-text-secondary)] hover:text-[var(--os-text)]"><ArrowLeft size={16} /> Back to Clients</button>
      {error && <div role="alert" className="mb-5 rounded-xl border border-[rgba(255,100,124,0.25)] bg-[rgba(255,100,124,0.08)] px-4 py-3 text-sm text-[var(--os-danger)]">{error}</div>}

      <section className="mb-6 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[var(--os-accent-soft)] text-[var(--os-accent)]">{client.type === 'company' ? <Building2 size={25} /> : <UserRound size={25} />}</div>
          <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h1 className="text-3xl font-semibold tracking-tight text-[var(--os-text)] sm:text-4xl">{client.name}</h1><span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusClasses[client.status]}`}>{statusLabels[client.status]}</span></div><p className="mt-2 text-sm text-[var(--os-text-secondary)]">{client.companyName || 'Individual client'}</p></div>
        </div>
        <div className="flex flex-wrap gap-2"><Button type="button" variant="secondary" onClick={openEdit}><Edit3 size={15} /> Edit Client</Button><Button type="button" variant="secondary" disabled={deleting} onClick={() => setDeleteOpen(true)}><Trash2 size={15} /> Delete</Button></div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Detail icon={<Mail size={17} />} label="Email" value={client.email || 'Not specified'} />
        <Detail icon={<Phone size={17} />} label="Phone" value={client.phone || 'Not specified'} />
        <Detail icon={<Globe2 size={17} />} label="Website" value={client.website || 'Not specified'} />
        <Detail icon={<Building2 size={17} />} label="Source" value={client.source || 'Not specified'} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card className="p-5"><h2 className="text-sm font-semibold text-[var(--os-text)]">Contact & Business</h2><div className="mt-5 space-y-4"><DetailRow icon={<Mail size={16} />} label="Email" value={client.email || 'Not specified'} /><DetailRow icon={<Phone size={16} />} label="Phone" value={client.phone || 'Not specified'} /><DetailRow icon={<Globe2 size={16} />} label="Website" value={client.website || 'Not specified'} /></div></Card>
        <Card className="p-5"><h2 className="text-sm font-semibold text-[var(--os-text)]">Address</h2><div className="mt-5 flex gap-3 text-sm leading-6 text-[var(--os-text-secondary)]"><MapPin size={18} className="mt-1 shrink-0 text-[var(--os-accent)]" /><p className="whitespace-pre-wrap">{client.address || 'No address added.'}</p></div></Card>
      </div>

      <Card className="mt-4 p-5"><h2 className="text-sm font-semibold text-[var(--os-text)]">Notes</h2><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[var(--os-text-secondary)]">{client.notes || 'No notes added for this client.'}</p></Card>

      <ClientModal key={`client-details-modal-${modalInstance}`} open={modalOpen} client={client} saving={saving} onClose={() => !saving && setModalOpen(false)} onSubmit={handleSave} />
      <ConfirmDialog open={deleteOpen} title="Delete client?" description={<>You are about to permanently delete <strong>{client.name}</strong>. This action cannot be undone.</>} confirmLabel="Delete Client" loading={deleting} onCancel={() => !deleting && setDeleteOpen(false)} onConfirm={handleDelete} />
    </div>
  )
}

function Detail({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="flex items-start gap-3 rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] p-4"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--os-accent-soft)] text-[var(--os-accent)]">{icon}</span><div className="min-w-0"><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--os-text-muted)]">{label}</p><p className="mt-1 truncate text-sm font-medium text-[var(--os-text)]">{value}</p></div></div>
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="flex items-center gap-3 border-b border-[var(--os-border)] pb-3 last:border-0 last:pb-0"><span className="text-[var(--os-accent)]">{icon}</span><div><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--os-text-muted)]">{label}</p><p className="mt-0.5 text-sm text-[var(--os-text-secondary)]">{value}</p></div></div>
}

export default ClientDetails
