import type { ReactNode } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  ExternalLink,
  Globe,
  LayoutGrid,
  List,
  Pencil,
  Plus,
  Search,
  Trash2,
  Wrench,
  X,
} from 'lucide-react'

import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import EmptyState from '../components/ui/EmptyState'
import WebsiteModal from '../components/websites/WebsiteModal'
import { useWorkspace } from '../context/useWorkspace'
import {
  createWebsite,
  deleteWebsite,
  getWebsites,
  updateWebsite,
} from '../services/websiteService'
import type {
  CreateWebsiteInput,
  Website,
} from '../types/website'

type StatusFilter =
  | 'all'
  | 'live'
  | 'in-development'
  | 'maintenance'
  | 'testing'
  | 'paused'
  | 'expired'

type ViewMode = 'grid' | 'list'

const statusLabels: Record<
  Exclude<StatusFilter, 'all'>,
  string
> = {
  live: 'Live',
  'in-development': 'In Development',
  maintenance: 'Maintenance',
  testing: 'Testing',
  paused: 'Paused',
  expired: 'Expired',
}

const statusClasses: Record<
  Exclude<StatusFilter, 'all'>,
  string
> = {
  live: 'bg-[rgba(66,211,146,0.12)] text-[var(--os-success)]',
  'in-development':
    'bg-[rgba(90,169,255,0.12)] text-[var(--os-info)]',
  maintenance:
    'bg-[rgba(139,124,255,0.12)] text-[var(--os-accent)]',
  testing:
    'bg-[rgba(245,185,66,0.12)] text-[var(--os-warning)]',
  paused:
    'bg-[rgba(255,255,255,0.08)] text-[var(--os-text-secondary)]',
  expired:
    'bg-[rgba(255,100,124,0.12)] text-[var(--os-danger)]',
}

function Websites() {
  const {
    workspace,
    loading: workspaceLoading,
  } = useWorkspace()

  const [websites, setWebsites] = useState<Website[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>('all')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [modalOpen, setModalOpen] = useState(false)
  const [websiteToEdit, setWebsiteToEdit] =
    useState<Website | null>(null)
  const [saving, setSaving] = useState(false)
  const [websiteToDelete, setWebsiteToDelete] =
    useState<Website | null>(null)
  const [deleting, setDeleting] = useState(false)

  const loadWebsites = useCallback(async () => {
    if (!workspace?.id) {
      setWebsites([])
      setLoading(!workspaceLoading)
      return
    }

    setLoading(true)
    setError('')

    try {
      const loadedWebsites = await getWebsites(workspace.id)
      setWebsites(loadedWebsites)
    } catch (loadError) {
      console.error('Failed to load websites:', loadError)
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Unable to load websites. Please try again.',
      )
    } finally {
      setLoading(false)
    }
  }, [workspace?.id, workspaceLoading])

  useEffect(() => {
    if (workspaceLoading) {
      return
    }

    void loadWebsites()
  }, [loadWebsites, workspaceLoading])

  const query = search.trim().toLowerCase()

  const filteredWebsites = useMemo(
    () =>
      websites.filter((website) => {
        const matchesSearch =
          !query ||
          website.name.toLowerCase().includes(query) ||
          website.clientName.toLowerCase().includes(query)

        const matchesStatus =
          statusFilter === 'all' || website.status === statusFilter

        return matchesSearch && matchesStatus
      }),
    [websites, query, statusFilter],
  )

  const total = websites.length

  const liveCount = websites.filter(
    (website) => website.status === 'live',
  ).length

  const developmentCount = websites.filter(
    (website) => website.status === 'in-development',
  ).length

  const maintenanceCount = websites.filter(
    (website) => website.status === 'maintenance' || website.maintenanceOpted,
  ).length

  const totalDevelopmentValue = websites.reduce(
    (sum, website) => sum + website.developmentAmount,
    0,
  )

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount)

  function openCreateModal() {
    setWebsiteToEdit(null)
    setModalOpen(true)
    setError('')
  }

  function openEditModal(website: Website) {
    setWebsiteToEdit(website)
    setModalOpen(true)
    setError('')
  }

  function closeModal() {
    if (saving) {
      return
    }

    setModalOpen(false)
    setWebsiteToEdit(null)
  }

  async function handleSubmit(input: CreateWebsiteInput) {
    if (!workspace?.id) {
      throw new Error('Workspace is not available. Please try again.')
    }

    setSaving(true)
    setError('')

    try {
      if (websiteToEdit) {
        await updateWebsite(
          workspace.id,
          websiteToEdit.id,
          input,
        )
      } else {
        await createWebsite(workspace.id, input)
      }

      await loadWebsites()
      setModalOpen(false)
      setWebsiteToEdit(null)
    } catch (submitError) {
      console.error('Failed to save website:', submitError)
      throw submitError
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!workspace?.id || !websiteToDelete) {
      return
    }

    setDeleting(true)
    setError('')

    try {
      await deleteWebsite(workspace.id, websiteToDelete.id)
      setWebsiteToDelete(null)
      await loadWebsites()
    } catch (deleteError) {
      console.error('Failed to delete website:', deleteError)
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : 'Unable to delete the website. Please try again.',
      )
    } finally {
      setDeleting(false)
    }
  }

  const isEmpty = !loading && filteredWebsites.length === 0

  return (
    <div className="mx-auto w-full max-w-[1600px] p-4 sm:p-6 lg:p-8">
      <section className="mb-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--os-accent-soft)] text-[var(--os-accent)]">
                <Globe size={17} />
              </span>

              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--os-text-muted)]">
                Workspace
              </span>
            </div>

            <h1 className="text-3xl font-semibold tracking-tight text-[var(--os-text)] sm:text-4xl">
              Websites & Apps
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--os-text-secondary)] sm:text-base">
              Manage every website and application developed, being developed,
              maintained, or completed for your clients.
            </p>

            {workspace && (
              <p className="mt-2 text-xs text-[var(--os-text-muted)]">
                Workspace:{' '}
                <span className="font-medium text-[var(--os-text-secondary)]">
                  {workspace.name}
                </span>
              </p>
            )}
          </div>

          <Button
            type="button"
            disabled={workspaceLoading || !workspace}
            onClick={openCreateModal}
          >
            <Plus size={17} />
            Add Website / App
          </Button>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatBox label="Total" value={total} icon={<Globe size={17} />} />
        <StatBox
          label="Live"
          value={liveCount}
          icon={<Activity size={17} />}
          accent="success"
        />
        <StatBox
          label="In Development"
          value={developmentCount}
          icon={<Wrench size={17} />}
          accent="info"
        />
        <StatBox
          label="Maintenance"
          value={maintenanceCount}
          icon={<Wrench size={17} />}
          accent="accent"
        />
        <StatBox
          label="Total Development Value"
          value={formatCurrency(totalDevelopmentValue)}
          icon={<Activity size={17} />}
        />
      </section>

      <Card className="mt-6 overflow-hidden">
        <div className="border-b border-[var(--os-border)] p-4 sm:p-5">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="relative min-w-0 flex-1 xl:max-w-md">
              <Search
                size={17}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--os-text-muted)]"
              />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search websites or clients..."
                aria-label="Search websites or clients"
                className="os-focus-ring h-11 w-full rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] pl-10 pr-4 text-sm text-[var(--os-text)] outline-none placeholder:text-[var(--os-text-muted)] focus:border-[var(--os-accent)]"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as StatusFilter)
                }
                aria-label="Filter websites by status"
                className="os-focus-ring h-11 rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] px-3 text-sm text-[var(--os-text-secondary)] outline-none focus:border-[var(--os-accent)]"
              >
                <option value="all">All statuses</option>
                {Object.entries(statusLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>

              <div
                className="flex h-11 items-center rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] p-1"
                role="group"
                aria-label="View mode"
              >
                <button
                  type="button"
                  aria-label="Grid view"
                  aria-pressed={viewMode === 'grid'}
                  onClick={() => setViewMode('grid')}
                  className={[
                    'flex h-9 w-9 items-center justify-center rounded-lg transition-colors',
                    viewMode === 'grid'
                      ? 'bg-[var(--os-accent-soft)] text-[var(--os-accent)]'
                      : 'text-[var(--os-text-muted)] hover:text-[var(--os-text)]',
                  ].join(' ')}
                >
                  <LayoutGrid size={16} />
                </button>

                <button
                  type="button"
                  aria-label="List view"
                  aria-pressed={viewMode === 'list'}
                  onClick={() => setViewMode('list')}
                  className={[
                    'flex h-9 w-9 items-center justify-center rounded-lg transition-colors',
                    viewMode === 'list'
                      ? 'bg-[var(--os-accent-soft)] text-[var(--os-accent)]'
                      : 'text-[var(--os-text-muted)] hover:text-[var(--os-text)]',
                  ].join(' ')}
                >
                  <List size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-6">
          {error && (
            <div
              role="alert"
              className="mb-5 flex items-start gap-3 rounded-xl border border-[rgba(255,100,124,0.25)] bg-[rgba(255,100,124,0.08)] px-4 py-3 text-sm text-[var(--os-danger)]"
            >
              <AlertTriangle size={17} className="mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1">{error}</div>
              <button
                type="button"
                onClick={() => setError('')}
                aria-label="Dismiss error"
                className="shrink-0 opacity-70 transition-opacity hover:opacity-100"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {loading ? (
            <LoadingWebsites />
          ) : isEmpty ? (
            <EmptyState
              icon={<Globe size={21} />}
              title={
                search || statusFilter !== 'all'
                  ? 'No matching websites'
                  : 'No websites or apps yet'
              }
              description={
                search || statusFilter !== 'all'
                  ? 'Try changing your search or status filter.'
                  : 'Add your first website or app to start building your workspace portfolio.'
              }
              action={
                !search && statusFilter === 'all' ? (
                  <Button
                    type="button"
                    size="sm"
                    disabled={workspaceLoading || !workspace}
                    onClick={openCreateModal}
                  >
                    <Plus size={15} />
                    Add Website / App
                  </Button>
                ) : undefined
              }
            />
          ) : viewMode === 'grid' ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredWebsites.map((website) => (
                <WebsiteCard
                  key={website.id}
                  website={website}
                  formatCurrency={formatCurrency}
                  onEdit={openEditModal}
                  onDelete={setWebsiteToDelete}
                />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px] text-left">
                <thead>
                  <tr className="border-b border-[var(--os-border)]">
                    <TableHead>Website / App</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Development</TableHead>
                    <TableHead>Maintenance</TableHead>
                    <TableHead>Link</TableHead>
                    <TableHead>Actions</TableHead>
                  </tr>
                </thead>

                <tbody>
                  {filteredWebsites.map((website) => (
                    <tr
                      key={website.id}
                      className="border-b border-[var(--os-border)] last:border-0"
                    >
                      <td className="py-4 pr-4">
                        <p className="text-sm font-medium text-[var(--os-text)]">
                          {website.name}
                        </p>
                        <p className="mt-1 text-xs text-[var(--os-text-muted)]">
                          {formatType(website.type)}
                        </p>
                      </td>

                      <td className="py-4 pr-4 text-sm text-[var(--os-text-secondary)]">
                        {website.clientName || '—'}
                      </td>

                      <td className="py-4 pr-4">
                        <StatusBadge status={website.status} />
                      </td>

                      <td className="py-4 pr-4 text-sm text-[var(--os-text-secondary)]">
                        {formatCurrency(website.developmentAmount)}
                      </td>

                      <td className="py-4 pr-4">
                        {website.maintenanceOpted ? (
                          <span className="text-sm text-[var(--os-success)]">
                            {formatCurrency(website.monthlyMaintenanceCharge)}/mo
                          </span>
                        ) : (
                          <span className="text-sm text-[var(--os-text-muted)]">
                            Not opted
                          </span>
                        )}
                      </td>

                      <td className="py-4 pr-4">
                        {website.liveUrl ? (
                          <a
                            href={website.liveUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--os-accent)] hover:text-[var(--os-text)]"
                          >
                            Open
                            <ExternalLink size={13} />
                          </a>
                        ) : (
                          <span className="text-sm text-[var(--os-text-muted)]">
                            —
                          </span>
                        )}
                      </td>

                      <td className="py-4">
                        <div className="flex items-center gap-1">
                          <ActionButton
                            label={`Edit ${website.name}`}
                            onClick={() => openEditModal(website)}
                          >
                            <Pencil size={15} />
                          </ActionButton>
                          <ActionButton
                            label={`Delete ${website.name}`}
                            danger
                            onClick={() => setWebsiteToDelete(website)}
                          >
                            <Trash2 size={15} />
                          </ActionButton>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>

      {modalOpen && (
        <WebsiteModal
          key={websiteToEdit ? `edit-${websiteToEdit.id}` : 'create'}
          open={modalOpen}
          onClose={closeModal}
          onSubmit={handleSubmit}
          website={websiteToEdit}
          saving={saving}
        />
      )}

      {websiteToDelete && (
        <DeleteConfirmation
          website={websiteToDelete}
          deleting={deleting}
          onCancel={() => {
            if (!deleting) {
              setWebsiteToDelete(null)
            }
          }}
          onConfirm={() => void handleDelete()}
        />
      )}
    </div>
  )
}

type StatBoxProps = {
  label: string
  value: string | number
  icon: ReactNode
  accent?: 'success' | 'info' | 'accent'
}

function StatBox({ label, value, icon, accent }: StatBoxProps) {
  const iconClass =
    accent === 'success'
      ? 'text-[var(--os-success)] bg-[rgba(66,211,146,0.12)]'
      : accent === 'info'
        ? 'text-[var(--os-info)] bg-[rgba(90,169,255,0.12)]'
        : accent === 'accent'
          ? 'text-[var(--os-accent)] bg-[var(--os-accent-soft)]'
          : 'text-[var(--os-text-secondary)] bg-[var(--os-surface-hover)]'

  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <span
          className={[
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
            iconClass,
          ].join(' ')}
        >
          {icon}
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-medium text-[var(--os-text-muted)]">
            {label}
          </p>
          <p className="mt-1 truncate text-lg font-semibold text-[var(--os-text)]">
            {value}
          </p>
        </div>
      </div>
    </Card>
  )
}

function StatusBadge({
  status,
}: {
  status: Exclude<StatusFilter, 'all'>
}) {
  return (
    <span
      className={[
        'inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold',
        statusClasses[status],
      ].join(' ')}
    >
      {statusLabels[status]}
    </span>
  )
}

function TableHead({ children }: { children: ReactNode }) {
  return (
    <th className="pb-3 pr-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--os-text-muted)]">
      {children}
    </th>
  )
}

function WebsiteCard({
  website,
  formatCurrency,
  onEdit,
  onDelete,
}: {
  website: Website
  formatCurrency: (amount: number) => string
  onEdit: (website: Website) => void
  onDelete: (website: Website) => void
}) {
  return (
    <div className="group rounded-2xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--os-border-strong)] hover:shadow-[var(--os-shadow-md)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--os-accent-soft)] text-[var(--os-accent)]">
            <Globe size={20} />
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-[var(--os-text)]">
              {website.name}
            </h3>
            <p className="mt-1 truncate text-xs text-[var(--os-text-muted)]">
              {website.clientName || 'No client'}
            </p>
          </div>
        </div>
        <StatusBadge status={website.status} />
      </div>

      <p className="mt-3 text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--os-text-muted)]">
        {formatType(website.type)}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <InfoItem
          label="Development"
          value={formatCurrency(website.developmentAmount)}
        />
        <InfoItem
          label="Hosting"
          value={website.hostingProvider || 'Not specified'}
        />
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-[var(--os-border)] pt-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.12em] text-[var(--os-text-muted)]">
            Maintenance
          </p>
          <p className="mt-1 text-xs font-medium text-[var(--os-text-secondary)]">
            {website.maintenanceOpted
              ? `${formatCurrency(website.monthlyMaintenanceCharge)}/month`
              : 'Not opted'}
          </p>
        </div>

        <div className="flex items-center gap-1">
          {website.liveUrl && (
            <ActionLink
              label={`Open ${website.name}`}
              href={website.liveUrl}
            >
              <ExternalLink size={15} />
            </ActionLink>
          )}
          <ActionButton
            label={`Edit ${website.name}`}
            onClick={() => onEdit(website)}
          >
            <Pencil size={15} />
          </ActionButton>
          <ActionButton
            label={`Delete ${website.name}`}
            danger
            onClick={() => onDelete(website)}
          >
            <Trash2 size={15} />
          </ActionButton>
        </div>
      </div>
    </div>
  )
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-xl border border-[var(--os-border)] bg-[var(--os-surface)] p-3">
      <p className="text-[10px] uppercase tracking-[0.1em] text-[var(--os-text-muted)]">
        {label}
      </p>
      <p className="mt-1 truncate text-xs font-medium text-[var(--os-text-secondary)]">
        {value}
      </p>
    </div>
  )
}

function ActionButton({
  children,
  label,
  onClick,
  danger = false,
}: {
  children: ReactNode
  label: string
  onClick: () => void
  danger?: boolean
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={[
        'os-focus-ring flex h-9 w-9 items-center justify-center rounded-lg transition-colors',
        danger
          ? 'text-[var(--os-text-muted)] hover:bg-[rgba(255,100,124,0.1)] hover:text-[var(--os-danger)]'
          : 'text-[var(--os-text-muted)] hover:bg-[var(--os-surface-hover)] hover:text-[var(--os-accent)]',
      ].join(' ')}
    >
      {children}
    </button>
  )
}

function ActionLink({
  children,
  label,
  href,
}: {
  children: ReactNode
  label: string
  href: string
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      title={label}
      className="os-focus-ring flex h-9 w-9 items-center justify-center rounded-lg text-[var(--os-text-muted)] transition-colors hover:bg-[var(--os-surface-hover)] hover:text-[var(--os-accent)]"
    >
      {children}
    </a>
  )
}

function LoadingWebsites() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-busy="true">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="animate-pulse rounded-2xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] p-5"
        >
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-[var(--os-surface-hover)]" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-3 w-2/3 rounded bg-[var(--os-surface-hover)]" />
              <div className="h-2.5 w-1/2 rounded bg-[var(--os-surface-hover)]" />
            </div>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="h-16 rounded-xl bg-[var(--os-surface-hover)]" />
            <div className="h-16 rounded-xl bg-[var(--os-surface-hover)]" />
          </div>
        </div>
      ))}
    </div>
  )
}

function DeleteConfirmation({
  website,
  deleting,
  onCancel,
  onConfirm,
}: {
  website: Website
  deleting: boolean
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close delete confirmation"
        onClick={onCancel}
        disabled={deleting}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />

      <div className="relative w-full max-w-md rounded-2xl border border-[var(--os-border-strong)] bg-[var(--os-surface)] p-6 shadow-[var(--os-shadow-lg)]">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[rgba(255,100,124,0.1)] text-[var(--os-danger)]">
          <Trash2 size={19} />
        </div>

        <h2 className="mt-4 text-lg font-semibold text-[var(--os-text)]">
          Delete website / app?
        </h2>
        <p className="mt-2 text-sm leading-6 text-[var(--os-text-secondary)]">
          This will permanently remove{' '}
          <span className="font-semibold text-[var(--os-text)]">
            {website.name}
          </span>{' '}
          from this workspace. This action cannot be undone.
        </p>

        <div className="mt-6 flex justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={deleting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            loading={deleting}
            onClick={onConfirm}
          >
            Delete
          </Button>
        </div>
      </div>
    </div>
  )
}

function formatType(type: Website['type']) {
  switch (type) {
    case 'web-app':
      return 'Web App'
    case 'mobile-app':
      return 'Mobile App'
    case 'website':
      return 'Website'
    default:
      return 'Other'
  }
}

export default Websites
