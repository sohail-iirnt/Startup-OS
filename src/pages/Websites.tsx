import type { ReactNode } from 'react'
import { useState } from 'react'

import {
  Activity,
  ExternalLink,
  Globe,
  LayoutGrid,
  List,
  Plus,
  Search,
  Wrench,
} from 'lucide-react'

import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import EmptyState from '../components/ui/EmptyState'
import { useWorkspace } from '../context/useWorkspace'

type StatusFilter =
  | 'all'
  | 'live'
  | 'in-development'
  | 'maintenance'
  | 'testing'
  | 'paused'
  | 'expired'

type ViewMode = 'grid' | 'list'

type WebsitePreview = {
  id: string
  name: string
  clientName: string
  type:
    | 'website'
    | 'web-app'
    | 'mobile-app'
    | 'other'
  status: Exclude<StatusFilter, 'all'>
  liveUrl: string
  hostingProvider: string
  developmentAmount: number
  maintenanceOpted: boolean
  monthlyMaintenanceCharge: number
}

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

/*
 * Temporary data source.
 *
 * This is intentionally defined outside the component.
 * That keeps the array reference stable between renders
 * and avoids unnecessary hook dependency warnings when
 * Firestore integration is added.
 */
const websites: WebsitePreview[] = []

function Websites() {
  const {
    workspace,
    loading: workspaceLoading,
  } = useWorkspace()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>('all')

  const [viewMode, setViewMode] =
    useState<ViewMode>('grid')

  const query = search.trim().toLowerCase()

  const filteredWebsites =
    websites.filter((website) => {
      const matchesSearch =
        !query ||
        website.name
          .toLowerCase()
          .includes(query) ||
        website.clientName
          .toLowerCase()
          .includes(query)

      const matchesStatus =
        statusFilter === 'all' ||
        website.status === statusFilter

      return matchesSearch && matchesStatus
    })

  const total = websites.length

  const liveCount = websites.filter(
    (website) => website.status === 'live',
  ).length

  const developmentCount =
    websites.filter(
      (website) =>
        website.status === 'in-development',
    ).length

  const maintenanceCount =
    websites.filter(
      (website) =>
        website.status === 'maintenance' ||
        website.maintenanceOpted,
    ).length

  const totalDevelopmentValue =
    websites.reduce(
      (sum, website) =>
        sum + website.developmentAmount,
      0,
    )

  const formatCurrency = (
    amount: number,
  ) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount)

  return (
    <div className="mx-auto w-full max-w-[1600px] p-4 sm:p-6 lg:p-8">
      {/* Header */}
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
              Manage every website and application
              developed, being developed, maintained,
              or completed for your clients.
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
            disabled={workspaceLoading}
          >
            <Plus size={17} />
            Add Website / App
          </Button>
        </div>
      </section>

      {/* Stats */}
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatBox
          label="Total"
          value={total}
          icon={<Globe size={17} />}
        />

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
          value={formatCurrency(
            totalDevelopmentValue,
          )}
          icon={<Activity size={17} />}
        />
      </section>

      {/* Main */}
      <Card className="mt-6 overflow-hidden">
        {/* Toolbar */}
        <div className="border-b border-[var(--os-border)] p-4 sm:p-5">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            {/* Search */}
            <div className="relative min-w-0 flex-1 xl:max-w-md">
              <Search
                size={17}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--os-text-muted)]"
              />

              <input
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search websites or clients..."
                aria-label="Search websites or clients"
                className="os-focus-ring h-11 w-full rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] pl-10 pr-4 text-sm text-[var(--os-text)] outline-none placeholder:text-[var(--os-text-muted)] focus:border-[var(--os-accent)]"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Status */}
              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value as StatusFilter,
                  )
                }
                aria-label="Filter websites by status"
                className="os-focus-ring h-11 rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] px-3 text-sm text-[var(--os-text-secondary)] outline-none focus:border-[var(--os-accent)]"
              >
                <option value="all">
                  All statuses
                </option>

                {Object.entries(
                  statusLabels,
                ).map(([value, label]) => (
                  <option
                    key={value}
                    value={value}
                  >
                    {label}
                  </option>
                ))}
              </select>

              {/* View switcher */}
              <div
                className="flex h-11 items-center rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] p-1"
                role="group"
                aria-label="View mode"
              >
                <button
                  type="button"
                  aria-label="Grid view"
                  aria-pressed={
                    viewMode === 'grid'
                  }
                  onClick={() =>
                    setViewMode('grid')
                  }
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
                  aria-pressed={
                    viewMode === 'list'
                  }
                  onClick={() =>
                    setViewMode('list')
                  }
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

        {/* Content */}
        <div className="p-5 sm:p-6">
          {filteredWebsites.length === 0 ? (
            <EmptyState
              icon={<Globe size={21} />}
              title={
                search ||
                statusFilter !== 'all'
                  ? 'No matching websites'
                  : 'No websites or apps yet'
              }
              description={
                search ||
                statusFilter !== 'all'
                  ? 'Try changing your search or status filter.'
                  : 'Add your first website or app to start building your workspace portfolio.'
              }
              action={
                !search &&
                statusFilter === 'all' ? (
                  <Button
                    type="button"
                    size="sm"
                    disabled={workspaceLoading}
                  >
                    <Plus size={15} />
                    Add Website / App
                  </Button>
                ) : undefined
              }
            />
          ) : viewMode === 'grid' ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredWebsites.map(
                (website) => (
                  <WebsiteCard
                    key={website.id}
                    website={website}
                    formatCurrency={
                      formatCurrency
                    }
                  />
                ),
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left">
                <thead>
                  <tr className="border-b border-[var(--os-border)]">
                    <TableHead>
                      Website / App
                    </TableHead>

                    <TableHead>
                      Client
                    </TableHead>

                    <TableHead>
                      Status
                    </TableHead>

                    <TableHead>
                      Development
                    </TableHead>

                    <TableHead>
                      Maintenance
                    </TableHead>

                    <TableHead>
                      Link
                    </TableHead>
                  </tr>
                </thead>

                <tbody>
                  {filteredWebsites.map(
                    (website) => (
                      <tr
                        key={website.id}
                        className="border-b border-[var(--os-border)] last:border-0"
                      >
                        <td className="py-4 pr-4">
                          <p className="text-sm font-medium text-[var(--os-text)]">
                            {website.name}
                          </p>

                          <p className="mt-1 text-xs text-[var(--os-text-muted)]">
                            {website.type}
                          </p>
                        </td>

                        <td className="py-4 pr-4 text-sm text-[var(--os-text-secondary)]">
                          {website.clientName ||
                            '—'}
                        </td>

                        <td className="py-4 pr-4">
                          <StatusBadge
                            status={
                              website.status
                            }
                          />
                        </td>

                        <td className="py-4 pr-4 text-sm text-[var(--os-text-secondary)]">
                          {formatCurrency(
                            website.developmentAmount,
                          )}
                        </td>

                        <td className="py-4 pr-4">
                          {website.maintenanceOpted ? (
                            <span className="text-sm text-[var(--os-success)]">
                              {formatCurrency(
                                website.monthlyMaintenanceCharge,
                              )}
                              /mo
                            </span>
                          ) : (
                            <span className="text-sm text-[var(--os-text-muted)]">
                              Not opted
                            </span>
                          )}
                        </td>

                        <td className="py-4">
                          {website.liveUrl ? (
                            <a
                              href={
                                website.liveUrl
                              }
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--os-accent)] hover:text-[var(--os-text)]"
                            >
                              Open
                              <ExternalLink
                                size={13}
                              />
                            </a>
                          ) : (
                            '—'
                          )}
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

type StatBoxProps = {
  label: string
  value: string | number
  icon: ReactNode
  accent?: 'success' | 'info' | 'accent'
}

function StatBox({
  label,
  value,
  icon,
  accent,
}: StatBoxProps) {
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

function TableHead({
  children,
}: {
  children: ReactNode
}) {
  return (
    <th className="pb-3 pr-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--os-text-muted)]">
      {children}
    </th>
  )
}

function WebsiteCard({
  website,
  formatCurrency,
}: {
  website: WebsitePreview
  formatCurrency: (
    amount: number,
  ) => string
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
              {website.clientName ||
                'No client'}
            </p>
          </div>
        </div>

        <StatusBadge
          status={website.status}
        />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <InfoItem
          label="Development"
          value={formatCurrency(
            website.developmentAmount,
          )}
        />

        <InfoItem
          label="Hosting"
          value={
            website.hostingProvider ||
            'Not specified'
          }
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

        {website.liveUrl && (
          <a
            href={website.liveUrl}
            target="_blank"
            rel="noreferrer"
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--os-surface-hover)] text-[var(--os-text-muted)] transition-colors hover:text-[var(--os-accent)]"
            aria-label={`Open ${website.name}`}
          >
            <ExternalLink size={15} />
          </a>
        )}
      </div>
    </div>
  )
}

function InfoItem({
  label,
  value,
}: {
  label: string
  value: string
}) {
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

export default Websites