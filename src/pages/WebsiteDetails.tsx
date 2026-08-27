import { useEffect, useState } from 'react'
import {
  Activity,
  ArrowLeft,
  CalendarDays,
  CircleDollarSign,
  ExternalLink,
  GitBranch,
  Globe,
  Pencil,
  Server,
  Trash2,
  UserRound,
  Wrench,
} from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'

import WebsiteModal from '../components/websites/WebsiteModal'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import { useWorkspace } from '../context/useWorkspace'
import { deleteWebsite, getWebsite, updateWebsite } from '../services/websiteService'
import type { CreateWebsiteInput, Website, WebsiteStatus } from '../types/website'

const statusLabels: Record<WebsiteStatus, string> = {
  live: 'Live',
  'in-development': 'In Development',
  maintenance: 'Maintenance',
  testing: 'Testing',
  paused: 'Paused',
  expired: 'Expired',
}

const statusClasses: Record<WebsiteStatus, string> = {
  live: 'bg-[rgba(66,211,146,0.12)] text-[var(--os-success)]',
  'in-development': 'bg-[rgba(90,169,255,0.12)] text-[var(--os-info)]',
  maintenance: 'bg-[rgba(139,124,255,0.12)] text-[var(--os-accent)]',
  testing: 'bg-[rgba(245,185,66,0.12)] text-[var(--os-warning)]',
  paused: 'bg-[rgba(255,255,255,0.08)] text-[var(--os-text-secondary)]',
  expired: 'bg-[rgba(255,100,124,0.12)] text-[var(--os-danger)]',
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDate(date?: Date | null) {
  if (!date) return 'Not scheduled'
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function daysUntil(date?: Date | null) {
  if (!date) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(date)
  target.setHours(0, 0, 0, 0)
  return Math.ceil((target.getTime() - today.getTime()) / 86400000)
}

function renewalLabel(date?: Date | null) {
  const days = daysUntil(date)
  if (days === null) return 'No date set'
  if (days < 0) return `Expired ${Math.abs(days)}d ago`
  if (days === 0) return 'Due today'
  if (days <= 30) return `Due in ${days}d`
  return `${days}d remaining`
}

function DetailItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] p-4">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--os-accent-soft)] text-[var(--os-accent)]">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--os-text-muted)]">{label}</p>
        <p className="mt-1 break-words text-sm font-medium capitalize text-[var(--os-text)]">{value}</p>
      </div>
    </div>
  )
}

function RenewalCard({ label, date, amount }: { label: string; date?: Date; amount?: number }) {
  const days = daysUntil(date)
  const urgent = days !== null && days <= 30
  return (
    <div className="rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--os-text-muted)]">{label}</p>
          <p className="mt-1 text-sm font-medium text-[var(--os-text)]">{formatDate(date)}</p>
        </div>
        <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${urgent ? 'bg-[var(--os-danger-soft)] text-[var(--os-danger)]' : 'bg-[var(--os-accent-soft)] text-[var(--os-accent)]'}`}>
          {renewalLabel(date)}
        </span>
      </div>
      {amount !== undefined && amount > 0 && (
        <p className="mt-3 text-xs text-[var(--os-text-secondary)]">Expected cost: <span className="font-semibold text-[var(--os-text)]">{formatCurrency(amount)}</span></p>
      )}
    </div>
  )
}

function WebsiteDetails() {
  const { websiteId } = useParams<{ websiteId: string }>()
  const navigate = useNavigate()
  const { workspace, loading: workspaceLoading } = useWorkspace()
  const [website, setWebsite] = useState<Website | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [modalInstance, setModalInstance] = useState(0)

  useEffect(() => {
    let cancelled = false
    async function loadWebsite() {
      if (workspaceLoading) return
      if (!workspace?.id || !websiteId) {
        if (!cancelled) {
          setWebsite(null)
          setLoading(false)
          setError('Website could not be found.')
        }
        return
      }
      setLoading(true)
      setError('')
      try {
        const result = await getWebsite(websiteId)
        if (cancelled) return
        if (!result || result.workspaceId !== workspace.id) {
          setWebsite(null)
          setError('Website could not be found in this workspace.')
          return
        }
        setWebsite(result)
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : 'Failed to load website details.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void loadWebsite()
    return () => { cancelled = true }
  }, [websiteId, workspace?.id, workspaceLoading])

  function openEditModal() {
    if (!website) return
    setError('')
    setModalInstance((current) => current + 1)
    setModalOpen(true)
  }

  function closeEditModal() {
    if (!saving) setModalOpen(false)
  }

  async function handleSave(input: CreateWebsiteInput) {
    if (!website || !workspace?.id) throw new Error('Workspace is not available.')
    setSaving(true)
    setError('')
    try {
      const updated = await updateWebsite(website.id, workspace.id, input)
      setWebsite(updated)
      setModalOpen(false)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to update the website.')
      throw saveError
    } finally {
      setSaving(false)
    }
  }

  function handleDeleteRequest() {
    if (!website || deleting || saving) return
    setError('')
    setDeleteDialogOpen(true)
  }

  async function confirmDelete() {
    if (!website || !workspace?.id || deleting) return
    setDeleting(true)
    setError('')
    try {
      await deleteWebsite(website.id, workspace.id)
      setDeleteDialogOpen(false)
      navigate('/websites', { replace: true })
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Failed to delete the website.')
      setDeleting(false)
      setDeleteDialogOpen(false)
    }
  }

  if (loading || workspaceLoading) {
    return (
      <div className="mx-auto w-full max-w-[1400px] p-4 sm:p-6 lg:p-8">
        <Card className="p-6"><div className="animate-pulse space-y-4"><div className="h-5 w-32 rounded bg-[var(--os-surface-hover)]" /><div className="h-10 w-2/3 rounded bg-[var(--os-surface-hover)]" /><div className="h-4 w-1/3 rounded bg-[var(--os-surface-hover)]" /><div className="grid gap-4 md:grid-cols-2"><div className="h-24 rounded-xl bg-[var(--os-surface-hover)]" /><div className="h-24 rounded-xl bg-[var(--os-surface-hover)]" /></div></div></Card>
      </div>
    )
  }

  if (!website) {
    return (
      <div className="mx-auto w-full max-w-[1400px] p-4 sm:p-6 lg:p-8">
        <Card className="p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--os-accent-soft)] text-[var(--os-accent)]"><Globe size={22} /></div>
          <h1 className="mt-4 text-xl font-semibold text-[var(--os-text)]">Website not found</h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-[var(--os-text-secondary)]">{error || 'This website or app is no longer available.'}</p>
          <div className="mt-6"><Button type="button" onClick={() => navigate('/websites')}><ArrowLeft size={16} />Back to Websites & Apps</Button></div>
        </Card>
      </div>
    )
  }

  const health = website.healthStatus ?? 'healthy'
  const healthLabel = health === 'healthy' ? 'Healthy' : health === 'attention' ? 'Needs Attention' : 'Critical'
  const healthClass = health === 'healthy' ? 'bg-[rgba(66,211,146,0.12)] text-[var(--os-success)]' : health === 'attention' ? 'bg-[rgba(245,185,66,0.12)] text-[var(--os-warning)]' : 'bg-[rgba(255,100,124,0.12)] text-[var(--os-danger)]'

  return (
    <div className="mx-auto w-full max-w-[1400px] p-4 sm:p-6 lg:p-8">
      <button type="button" onClick={() => navigate('/websites')} className="os-focus-ring mb-6 inline-flex items-center gap-2 rounded-lg text-sm font-medium text-[var(--os-text-secondary)] transition-colors hover:text-[var(--os-text)]"><ArrowLeft size={16} />Back to Websites & Apps</button>

      {error && <div role="alert" className="mb-6 rounded-xl border border-[rgba(255,100,124,0.25)] bg-[rgba(255,100,124,0.08)] px-4 py-3 text-sm text-[var(--os-danger)]">{error}</div>}

      <section className="mb-6 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[var(--os-accent-soft)] text-[var(--os-accent)]"><Globe size={25} /></div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-3xl font-semibold tracking-tight text-[var(--os-text)] sm:text-4xl">{website.name}</h1>
              <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusClasses[website.status]}`}>{statusLabels[website.status]}</span>
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${healthClass}`}><Activity size={12} />{healthLabel}</span>
            </div>
            <p className="mt-2 text-sm text-[var(--os-text-secondary)]">{website.clientName || 'No client assigned'}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="secondary" onClick={openEditModal} disabled={deleting}><Pencil size={15} />Edit Project</Button>
          <Button type="button" variant="secondary" onClick={handleDeleteRequest} disabled={deleting || saving}><Trash2 size={15} />{deleting ? 'Deleting...' : 'Delete'}</Button>
          {website.liveUrl && <a href={website.liveUrl} target="_blank" rel="noreferrer" className="os-focus-ring inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] px-4 text-sm font-medium text-[var(--os-text-secondary)] transition-colors hover:border-[var(--os-border-strong)] hover:text-[var(--os-text)]">Open Live Website<ExternalLink size={15} /></a>}
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DetailItem icon={<UserRound size={17} />} label="Client" value={website.clientName || 'Not specified'} />
        <DetailItem icon={<Globe size={17} />} label="Type" value={website.type.replace('-', ' ')} />
        <DetailItem icon={<CircleDollarSign size={17} />} label="Development Value" value={formatCurrency(website.developmentAmount)} />
        <DetailItem icon={<Server size={17} />} label="Hosting Provider" value={website.hostingProvider || 'Not specified'} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center gap-2"><CircleDollarSign size={17} className="text-[var(--os-accent)]" /><h2 className="text-sm font-semibold text-[var(--os-text)]">Financial Snapshot</h2></div>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <DetailItem icon={<CircleDollarSign size={17} />} label="Development Value" value={formatCurrency(website.developmentAmount)} />
            <DetailItem icon={<Wrench size={17} />} label="Maintenance" value={website.maintenanceOpted ? 'Active' : 'Not opted'} />
            <DetailItem icon={<CircleDollarSign size={17} />} label="Monthly Revenue" value={website.maintenanceOpted ? formatCurrency(website.monthlyMaintenanceCharge) : '—'} />
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-2"><CalendarDays size={17} className="text-[var(--os-accent)]" /><h2 className="text-sm font-semibold text-[var(--os-text)]">Timeline</h2></div>
          <div className="mt-5 space-y-4"><div><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--os-text-muted)]">Created</p><p className="mt-1 text-sm text-[var(--os-text-secondary)]">{formatDate(website.createdAt)}</p></div><div><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--os-text-muted)]">Last Updated</p><p className="mt-1 text-sm text-[var(--os-text-secondary)]">{formatDate(website.updatedAt)}</p></div></div>
        </Card>
      </div>

      <Card className="mt-4 p-5">
        <div className="flex items-center justify-between gap-3"><div><h2 className="text-sm font-semibold text-[var(--os-text)]">Renewal Command Center</h2><p className="mt-1 text-xs text-[var(--os-text-muted)]">Never miss a domain, hosting or maintenance renewal.</p></div><CalendarDays size={18} className="text-[var(--os-accent)]" /></div>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <RenewalCard label="Domain Renewal" date={website.domainRenewalDate} amount={website.domainRenewalAmount} />
          <RenewalCard label="Hosting Renewal" date={website.hostingRenewalDate} amount={website.hostingRenewalAmount} />
          <RenewalCard label="Maintenance Renewal" date={website.maintenanceRenewalDate} amount={website.monthlyMaintenanceCharge} />
        </div>
      </Card>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <div className="flex items-center gap-2"><Wrench size={17} className="text-[var(--os-accent)]" /><h2 className="text-sm font-semibold text-[var(--os-text)]">Maintenance</h2></div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <DetailItem icon={<Wrench size={17} />} label="Status" value={website.maintenanceOpted ? 'Active' : 'Not opted'} />
            <DetailItem icon={<CircleDollarSign size={17} />} label="Charge" value={website.maintenanceOpted ? `${formatCurrency(website.monthlyMaintenanceCharge)} / month` : '—'} />
            <DetailItem icon={<CalendarDays size={17} />} label="Frequency" value={website.maintenanceFrequency ?? 'Not set'} />
            <DetailItem icon={<CalendarDays size={17} />} label="Next Renewal" value={formatDate(website.maintenanceRenewalDate)} />
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-2"><Server size={17} className="text-[var(--os-accent)]" /><h2 className="text-sm font-semibold text-[var(--os-text)]">Infrastructure</h2></div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <DetailItem icon={<Server size={17} />} label="Hosting" value={website.hostingProvider || 'Not specified'} />
            <DetailItem icon={<Globe size={17} />} label="Domain" value={website.domainName || 'Not specified'} />
            <DetailItem icon={<Server size={17} />} label="Deployment" value={website.deploymentPlatform || 'Not specified'} />
            <DetailItem icon={<GitBranch size={17} />} label="Technology" value={website.technologyStack || 'Not specified'} />
          </div>
        </Card>
      </div>

      <Card className="mt-4 p-5">
        <div className="flex items-center gap-2"><GitBranch size={17} className="text-[var(--os-accent)]" /><h2 className="text-sm font-semibold text-[var(--os-text)]">Technical Links</h2></div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {website.repositoryUrl ? <a href={website.repositoryUrl} target="_blank" rel="noreferrer" className="rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] p-4 text-sm font-medium text-[var(--os-accent)] hover:border-[var(--os-border-strong)]">Repository<ExternalLink size={14} className="ml-2 inline" /></a> : <div className="rounded-xl border border-dashed border-[var(--os-border)] p-4 text-sm text-[var(--os-text-muted)]">Repository not linked</div>}
          {website.liveUrl ? <a href={website.liveUrl} target="_blank" rel="noreferrer" className="rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] p-4 text-sm font-medium text-[var(--os-accent)] hover:border-[var(--os-border-strong)]">Live Website<ExternalLink size={14} className="ml-2 inline" /></a> : <div className="rounded-xl border border-dashed border-[var(--os-border)] p-4 text-sm text-[var(--os-text-muted)]">Live URL not linked</div>}
        </div>
      </Card>

      <Card className="mt-4 p-5"><h2 className="text-sm font-semibold text-[var(--os-text)]">Notes</h2><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[var(--os-text-secondary)]">{website.notes || 'No notes added for this website or app.'}</p></Card>

      <WebsiteModal key={`website-details-modal-${modalInstance}`} website={website} open={modalOpen} saving={saving} onClose={closeEditModal} onSubmit={handleSave} />
      <ConfirmDialog open={deleteDialogOpen} title="Delete Website / App?" description={< >Are you sure you want to delete <strong className="font-semibold text-[var(--os-text)]">{website.name}</strong>? This action cannot be undone.</>} confirmLabel="Delete Website" loading={deleting} onCancel={() => { if (!deleting) setDeleteDialogOpen(false) }} onConfirm={() => { void confirmDelete() }} />
    </div>
  )
}

export default WebsiteDetails
