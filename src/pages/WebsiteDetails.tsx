import { useEffect, useState } from 'react'
import {
  ArrowLeft,
  CalendarDays,
  CircleDollarSign,
  ExternalLink,
  Globe,
  Server,
  UserRound,
  Wrench,
} from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'

import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import { useWorkspace } from '../context/useWorkspace'
import { getWebsite } from '../services/websiteService'
import type { Website, WebsiteStatus } from '../types/website'

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

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function DetailItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] p-4">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--os-accent-soft)] text-[var(--os-accent)]">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--os-text-muted)]">
          {label}
        </p>
        <p className="mt-1 break-words text-sm font-medium text-[var(--os-text)]">
          {value}
        </p>
      </div>
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

  useEffect(() => {
    let cancelled = false

    async function loadWebsite() {
      if (workspaceLoading) {
        return
      }

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

        if (cancelled) {
          return
        }

        if (!result || result.workspaceId !== workspace.id) {
          setWebsite(null)
          setError('Website could not be found in this workspace.')
          return
        }

        setWebsite(result)
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'Failed to load website details.',
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadWebsite()

    return () => {
      cancelled = true
    }
  }, [websiteId, workspace?.id, workspaceLoading])

  if (loading || workspaceLoading) {
    return (
      <div className="mx-auto w-full max-w-[1400px] p-4 sm:p-6 lg:p-8">
        <Card className="p-6">
          <div className="space-y-4 animate-pulse">
            <div className="h-5 w-32 rounded bg-[var(--os-surface-hover)]" />
            <div className="h-10 w-2/3 rounded bg-[var(--os-surface-hover)]" />
            <div className="h-4 w-1/3 rounded bg-[var(--os-surface-hover)]" />
            <div className="grid gap-4 md:grid-cols-2">
              <div className="h-24 rounded-xl bg-[var(--os-surface-hover)]" />
              <div className="h-24 rounded-xl bg-[var(--os-surface-hover)]" />
            </div>
          </div>
        </Card>
      </div>
    )
  }

  if (!website) {
    return (
      <div className="mx-auto w-full max-w-[1400px] p-4 sm:p-6 lg:p-8">
        <Card className="p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--os-accent-soft)] text-[var(--os-accent)]">
            <Globe size={22} />
          </div>
          <h1 className="mt-4 text-xl font-semibold text-[var(--os-text)]">
            Website not found
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-[var(--os-text-secondary)]">
            {error || 'This website or app is no longer available.'}
          </p>
          <div className="mt-6">
            <Button type="button" onClick={() => navigate('/websites')}>
              <ArrowLeft size={16} />
              Back to Websites & Apps
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-[1400px] p-4 sm:p-6 lg:p-8">
      <button
        type="button"
        onClick={() => navigate('/websites')}
        className="os-focus-ring mb-6 inline-flex items-center gap-2 rounded-lg text-sm font-medium text-[var(--os-text-secondary)] transition-colors hover:text-[var(--os-text)]"
      >
        <ArrowLeft size={16} />
        Back to Websites & Apps
      </button>

      <section className="mb-6 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[var(--os-accent-soft)] text-[var(--os-accent)]">
            <Globe size={25} />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-3xl font-semibold tracking-tight text-[var(--os-text)] sm:text-4xl">
                {website.name}
              </h1>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusClasses[website.status]}`}
              >
                {statusLabels[website.status]}
              </span>
            </div>
            <p className="mt-2 text-sm text-[var(--os-text-secondary)]">
              {website.clientName || 'No client assigned'}
            </p>
          </div>
        </div>

        {website.liveUrl && (
          <a
            href={website.liveUrl}
            target="_blank"
            rel="noreferrer"
            className="os-focus-ring inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] px-4 text-sm font-medium text-[var(--os-text-secondary)] transition-colors hover:border-[var(--os-border-strong)] hover:text-[var(--os-text)]"
          >
            Open Live Website
            <ExternalLink size={15} />
          </a>
        )}
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DetailItem
          icon={<UserRound size={17} />}
          label="Client"
          value={website.clientName || 'Not specified'}
        />
        <DetailItem
          icon={<Globe size={17} />}
          label="Type"
          value={website.type.replace('-', ' ')}
        />
        <DetailItem
          icon={<CircleDollarSign size={17} />}
          label="Development Value"
          value={formatCurrency(website.developmentAmount)}
        />
        <DetailItem
          icon={<Server size={17} />}
          label="Hosting Provider"
          value={website.hostingProvider || 'Not specified'}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center gap-2">
            <Wrench size={17} className="text-[var(--os-accent)]" />
            <h2 className="text-sm font-semibold text-[var(--os-text)]">
              Maintenance
            </h2>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <DetailItem
              icon={<Wrench size={17} />}
              label="Maintenance Status"
              value={website.maintenanceOpted ? 'Active' : 'Not opted'}
            />
            <DetailItem
              icon={<CircleDollarSign size={17} />}
              label="Monthly Charge"
              value={
                website.maintenanceOpted
                  ? `${formatCurrency(website.monthlyMaintenanceCharge)} / month`
                  : '—'
              }
            />
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2">
            <CalendarDays size={17} className="text-[var(--os-accent)]" />
            <h2 className="text-sm font-semibold text-[var(--os-text)]">
              Timeline
            </h2>
          </div>
          <div className="mt-5 space-y-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--os-text-muted)]">
                Created
              </p>
              <p className="mt-1 text-sm text-[var(--os-text-secondary)]">
                {formatDate(website.createdAt)}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--os-text-muted)]">
                Last Updated
              </p>
              <p className="mt-1 text-sm text-[var(--os-text-secondary)]">
                {formatDate(website.updatedAt)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {website.liveUrl && (
        <Card className="mt-4 p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--os-text-muted)]">
                Live URL
              </p>
              <p className="mt-1 truncate text-sm text-[var(--os-text-secondary)]">
                {website.liveUrl}
              </p>
            </div>
            <a
              href={website.liveUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-[var(--os-accent)] hover:text-[var(--os-text)]"
            >
              Visit
              <ExternalLink size={14} />
            </a>
          </div>
        </Card>
      )}

      <Card className="mt-4 p-5">
        <h2 className="text-sm font-semibold text-[var(--os-text)]">
          Notes
        </h2>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[var(--os-text-secondary)]">
          {website.notes || 'No notes added for this website or app.'}
        </p>
      </Card>
    </div>
  )
}

export default WebsiteDetails
