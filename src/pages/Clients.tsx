import { useEffect, useMemo, useState } from 'react'
import { Building2, Edit3, Mail, Phone, Plus, Search, Trash2, UserRound, Users, Globe2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import EmptyState from '../components/ui/EmptyState'
import Input from '../components/ui/Input'
import ClientModal from '../components/clients/ClientModal'
import { useWorkspace } from '../context/useWorkspace'
import { createClient, deleteClient, getClients, updateClient } from '../services/clientService'
import type { Client, ClientStatus, CreateClientInput } from '../types/client'

const statusLabels: Record<ClientStatus, string> = { lead: 'Lead', active: 'Active', inactive: 'Inactive', archived: 'Archived' }
const statusClasses: Record<ClientStatus, string> = {
  lead: 'bg-[rgba(245,185,66,0.12)] text-[var(--os-warning)]',
  active: 'bg-[rgba(66,211,146,0.12)] text-[var(--os-success)]',
  inactive: 'bg-[rgba(255,255,255,0.08)] text-[var(--os-text-secondary)]',
  archived: 'bg-[rgba(255,100,124,0.12)] text-[var(--os-danger)]',
}

type StatusFilter = 'all' | ClientStatus

function Clients() {
  const navigate = useNavigate()
  const { workspace, loading: workspaceLoading } = useWorkspace()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [modalInstance, setModalInstance] = useState(0)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (workspaceLoading) return
      if (!workspace?.id) {
        setClients([])
        setLoading(false)
        return
      }
      setLoading(true)
      setError('')
      try {
        const result = await getClients(workspace.id)
        if (!cancelled) setClients(result)
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : 'Failed to load clients.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => { cancelled = true }
  }, [workspace?.id, workspaceLoading])

  const filteredClients = useMemo(() => {
    const query = search.trim().toLowerCase()
    return clients.filter((client) => {
      const matchesStatus = statusFilter === 'all' || client.status === statusFilter
      const matchesSearch = !query || [client.name, client.companyName, client.email, client.phone].some((value) => value?.toLowerCase().includes(query))
      return matchesStatus && matchesSearch
    })
  }, [clients, search, statusFilter])

  const stats = useMemo(() => ({
    total: clients.length,
    active: clients.filter((client) => client.status === 'active').length,
    leads: clients.filter((client) => client.status === 'lead').length,
    archived: clients.filter((client) => client.status === 'archived').length,
  }), [clients])

  function openCreate() {
    setError('')
    setEditingClient(null)
    setModalInstance((current) => current + 1)
    setModalOpen(true)
  }

  function openEdit(client: Client) {
    setError('')
    setEditingClient(client)
    setModalInstance((current) => current + 1)
    setModalOpen(true)
  }

  async function handleSave(input: CreateClientInput) {
    if (!workspace?.id) throw new Error('Workspace is not available.')
    setSaving(true)
    setError('')
    try {
      if (editingClient) {
        const updated = await updateClient(editingClient.id, workspace.id, input)
        setClients((current) => current.map((client) => client.id === updated.id ? updated : client))
      } else {
        const created = await createClient(workspace.id, input)
        setClients((current) => [created, ...current])
      }
      setModalOpen(false)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to save client.')
      throw saveError
    } finally {
      setSaving(false)
    }
  }

  async function confirmDelete() {
    if (!clientToDelete || !workspace?.id) return
    setDeleting(true)
    setError('')
    try {
      await deleteClient(clientToDelete.id, workspace.id)
      setClients((current) => current.filter((client) => client.id !== clientToDelete.id))
      setClientToDelete(null)
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Failed to delete client.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1400px] p-4 sm:p-6 lg:p-8">
      <section className="mb-6 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--os-accent)]">Business</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--os-text)] sm:text-4xl">Clients</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--os-text-secondary)]">Manage relationships, contacts, communication context, and the businesses you serve.</p>
        </div>
        <Button type="button" onClick={openCreate} disabled={workspaceLoading || !workspace?.id}><Plus size={16} /> Add Client</Button>
      </section>

      {error && <div role="alert" className="mb-5 rounded-xl border border-[rgba(255,100,124,0.25)] bg-[rgba(255,100,124,0.08)] px-4 py-3 text-sm text-[var(--os-danger)]">{error}</div>}

      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Total Clients" value={stats.total} icon={<Users size={18} />} />
        <Stat label="Active" value={stats.active} icon={<UserRound size={18} />} />
        <Stat label="Leads" value={stats.leads} icon={<Building2 size={18} />} />
        <Stat label="Archived" value={stats.archived} icon={<Trash2 size={18} />} />
      </div>

      <Card className="mb-5 p-4">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
          <div className="relative">
            <Search size={17} className="pointer-events-none absolute left-3 top-3.5 text-[var(--os-text-muted)]" />
            <Input aria-label="Search clients" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name, company, email or phone..." className="pl-10" />
          </div>
          <div className="flex flex-wrap gap-2">
            {(['all', 'lead', 'active', 'inactive', 'archived'] as StatusFilter[]).map((status) => (
              <button key={status} type="button" onClick={() => setStatusFilter(status)} className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${statusFilter === status ? 'bg-[var(--os-accent-soft)] text-[var(--os-accent)]' : 'text-[var(--os-text-secondary)] hover:bg-[var(--os-surface-hover)]'}`}>
                {status === 'all' ? 'All' : statusLabels[status]}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {loading || workspaceLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((item) => <Card key={item} className="h-52 animate-pulse bg-[var(--os-surface-hover)]" />)}
        </div>
      ) : filteredClients.length === 0 ? (
        <EmptyState icon={<Users size={22} />} title={clients.length ? 'No clients match your filters' : 'No clients yet'} description={clients.length ? 'Try a different search or status filter.' : 'Add your first client to start building the relationship database.'} action={!clients.length ? <Button type="button" onClick={openCreate}><Plus size={16} /> Add Client</Button> : undefined} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredClients.map((client) => (
            <Card key={client.id} className="group p-5 transition-transform hover:-translate-y-0.5">
              <button type="button" onClick={() => navigate(`/clients/${client.id}`)} className="block w-full text-left">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--os-accent-soft)] text-[var(--os-accent)]">{client.type === 'company' ? <Building2 size={20} /> : <UserRound size={20} />}</span>
                    <div className="min-w-0"><h2 className="truncate text-base font-semibold text-[var(--os-text)]">{client.name}</h2><p className="truncate text-xs text-[var(--os-text-secondary)]">{client.companyName || 'Individual client'}</p></div>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold ${statusClasses[client.status]}`}>{statusLabels[client.status]}</span>
                </div>
                <div className="mt-5 space-y-2.5 text-sm text-[var(--os-text-secondary)]">
                  {client.email && <p className="flex items-center gap-2 truncate"><Mail size={14} />{client.email}</p>}
                  {client.phone && <p className="flex items-center gap-2"><Phone size={14} />{client.phone}</p>}
                  {client.website && <p className="flex items-center gap-2 truncate"><Globe2 size={14} />{client.website}</p>}
                </div>
              </button>
              <div className="mt-5 flex items-center justify-end gap-2 border-t border-[var(--os-border)] pt-4">
                <Button type="button" variant="secondary" onClick={() => openEdit(client)}><Edit3 size={14} /> Edit</Button>
                <Button type="button" variant="secondary" onClick={() => setClientToDelete(client)}><Trash2 size={14} /> Delete</Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ClientModal key={`client-modal-${modalInstance}`} open={modalOpen} client={editingClient} saving={saving} onClose={() => !saving && setModalOpen(false)} onSubmit={handleSave} />
      <ConfirmDialog open={Boolean(clientToDelete)} title="Delete client?" description={clientToDelete ? <>You are about to permanently delete <strong>{clientToDelete.name}</strong>. This cannot be undone.</> : ''} confirmLabel="Delete Client" loading={deleting} onCancel={() => !deleting && setClientToDelete(null)} onConfirm={confirmDelete} />
    </div>
  )
}

function Stat({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return <Card className="p-4"><div className="flex items-center justify-between"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--os-accent-soft)] text-[var(--os-accent)]">{icon}</span><span className="text-2xl font-semibold text-[var(--os-text)]">{value}</span></div><p className="mt-3 text-xs font-medium text-[var(--os-text-muted)]">{label}</p></Card>
}

export default Clients