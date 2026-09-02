import {
  useState,
  type FormEvent,
} from 'react'
import {
  Globe,
  Save,
  X,
} from 'lucide-react'

import Button from '../ui/Button'
import type {
  CreateWebsiteInput,
  Website,
  WebsiteHealthStatus,
  WebsiteStatus,
  WebsiteType,
  RenewalFrequency,
} from '../../types/website'

type WebsiteModalProps = {
  open: boolean
  onClose: () => void
  onSubmit: (input: CreateWebsiteInput) => Promise<void>
  website?: Website | null
  saving?: boolean
}

const emptyForm: CreateWebsiteInput = {
  name: '',
  clientName: '',
  type: 'website',
  status: 'in-development',
  liveUrl: '',
  hostingProvider: '',
  developmentAmount: 0,
  maintenanceOpted: false,
  monthlyMaintenanceCharge: 0,
  notes: '',
  domainName: '',
  domainRenewalDate: null,
  domainRenewalAmount: 0,
  hostingRenewalDate: null,
  hostingRenewalAmount: 0,
  maintenanceFrequency: 'monthly',
  maintenanceRenewalDate: null,
  repositoryUrl: '',
  technologyStack: '',
  deploymentPlatform: '',
  healthStatus: 'healthy',
}

function dateValue(date?: Date | null) {
  if (!date) return ''
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function parseDate(value: string) {
  if (!value) return null
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function getInitialForm(website?: Website | null): CreateWebsiteInput {
  if (!website) return { ...emptyForm }

  return {
    name: website.name,
    clientName: website.clientName,
    type: website.type,
    status: website.status,
    liveUrl: website.liveUrl,
    hostingProvider: website.hostingProvider,
    developmentAmount: website.developmentAmount,
    maintenanceOpted: website.maintenanceOpted,
    monthlyMaintenanceCharge: website.monthlyMaintenanceCharge,
    notes: website.notes,
    projectId: website.projectId,
    projectName: website.projectName,
    clientId: website.clientId,
    domainName: website.domainName ?? '',
    domainRenewalDate: website.domainRenewalDate ?? null,
    domainRenewalAmount: website.domainRenewalAmount ?? 0,
    hostingRenewalDate: website.hostingRenewalDate ?? null,
    hostingRenewalAmount: website.hostingRenewalAmount ?? 0,
    maintenanceFrequency: website.maintenanceFrequency ?? 'monthly',
    maintenanceRenewalDate: website.maintenanceRenewalDate ?? null,
    repositoryUrl: website.repositoryUrl ?? '',
    technologyStack: website.technologyStack ?? '',
    deploymentPlatform: website.deploymentPlatform ?? '',
    healthStatus: website.healthStatus ?? 'healthy',
  }
}

function WebsiteModal({
  open,
  onClose,
  onSubmit,
  website,
  saving = false,
}: WebsiteModalProps) {
  const [form, setForm] = useState<CreateWebsiteInput>(() => getInitialForm(website))
  const [error, setError] = useState('')

  if (!open) return null

  function updateField<K extends keyof CreateWebsiteInput>(
    field: K,
    value: CreateWebsiteInput[K],
  ) {
    setForm((current) => ({ ...current, [field]: value }))
    if (error) setError('')
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    const trimmedName = form.name.trim()
    if (!trimmedName) {
      setError('Website or app name is required.')
      return
    }

    const payload: CreateWebsiteInput = {
      ...form,
      name: trimmedName,
      clientName: form.clientName.trim(),
      liveUrl: form.liveUrl.trim(),
      hostingProvider: form.hostingProvider.trim(),
      notes: form.notes.trim(),
      projectId: form.projectId?.trim() || undefined,
      projectName: form.projectName?.trim() || undefined,
      clientId: form.clientId?.trim() || undefined,
      domainName: form.domainName?.trim() || undefined,
      repositoryUrl: form.repositoryUrl?.trim() || undefined,
      technologyStack: form.technologyStack?.trim() || undefined,
      deploymentPlatform: form.deploymentPlatform?.trim() || undefined,
      developmentAmount: Number(form.developmentAmount) || 0,
      monthlyMaintenanceCharge: form.maintenanceOpted
        ? Number(form.monthlyMaintenanceCharge) || 0
        : 0,
      domainRenewalAmount: Number(form.domainRenewalAmount) || 0,
      hostingRenewalAmount: Number(form.hostingRenewalAmount) || 0,
    }

    try {
      await onSubmit(payload)
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Something went wrong while saving the website.',
      )
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close modal"
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />

      <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-[var(--os-border-strong)] bg-[var(--os-surface)] shadow-[var(--os-shadow-lg)]">
        <div className="flex shrink-0 items-center justify-between border-b border-[var(--os-border)] px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--os-accent-soft)] text-[var(--os-accent)]">
              <Globe size={18} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[var(--os-text)]">
                {website ? 'Edit Website / App' : 'Add Website / App'}
              </h2>
              <p className="text-xs text-[var(--os-text-muted)]">
                {website ? 'Update your client project details.' : 'Add a new client project to your workspace.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            disabled={saving}
            className="os-focus-ring flex h-9 w-9 items-center justify-center rounded-lg text-[var(--os-text-muted)] transition-colors hover:bg-[var(--os-surface-hover)] hover:text-[var(--os-text)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto p-5">
          <div className="space-y-6">
            <FormSection title="Basic Information" description="Core identity and current delivery state.">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Website / App Name" required value={form.name} onChange={(value) => updateField('name', value)} placeholder="e.g. Muslimah.Glamour" />
                <Field label="Client Name" value={form.clientName} onChange={(value) => updateField('clientName', value)} placeholder="Client / business name" />
                <SelectField label="Type" value={form.type} onChange={(value) => updateField('type', value as WebsiteType)} options={[
                  ['website', 'Website'], ['web-app', 'Web App'], ['mobile-app', 'Mobile App'], ['other', 'Other'],
                ]} />
                <SelectField label="Status" value={form.status} onChange={(value) => updateField('status', value as WebsiteStatus)} options={[
                  ['live', 'Live'], ['in-development', 'In Development'], ['maintenance', 'Maintenance'], ['testing', 'Testing'], ['paused', 'Paused'], ['expired', 'Expired'],
                ]} />
                <Field label="Live URL" value={form.liveUrl} onChange={(value) => updateField('liveUrl', value)} placeholder="https://example.com" type="url" />
                <SelectField label="Operational Health" value={form.healthStatus ?? 'healthy'} onChange={(value) => updateField('healthStatus', value as WebsiteHealthStatus)} options={[
                  ['healthy', 'Healthy'], ['attention', 'Needs Attention'], ['critical', 'Critical'],
                ]} />
              </div>
            </FormSection>

            <FormSection title="Hosting & Domain" description="Keep infrastructure ownership and renewal dates in one place.">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Hosting Provider" value={form.hostingProvider} onChange={(value) => updateField('hostingProvider', value)} placeholder="Firebase, Hostinger..." />
                <Field label="Domain Name" value={form.domainName ?? ''} onChange={(value) => updateField('domainName', value)} placeholder="example.com" />
                <Field label="Domain Renewal Date" value={dateValue(form.domainRenewalDate)} onChange={(value) => updateField('domainRenewalDate', parseDate(value))} type="date" />
                <Field label="Domain Renewal Amount" value={String(form.domainRenewalAmount ?? 0)} onChange={(value) => updateField('domainRenewalAmount', Number(value) || 0)} type="number" min="0" placeholder="0" />
                <Field label="Hosting Renewal Date" value={dateValue(form.hostingRenewalDate)} onChange={(value) => updateField('hostingRenewalDate', parseDate(value))} type="date" />
                <Field label="Hosting Renewal Amount" value={String(form.hostingRenewalAmount ?? 0)} onChange={(value) => updateField('hostingRenewalAmount', Number(value) || 0)} type="number" min="0" placeholder="0" />
              </div>
            </FormSection>

            <FormSection title="Maintenance & Commercials" description="Track recurring support revenue and its renewal cycle.">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Development Amount" value={String(form.developmentAmount)} onChange={(value) => updateField('developmentAmount', Number(value) || 0)} type="number" min="0" placeholder="0" />
                <SelectField label="Maintenance Frequency" value={form.maintenanceFrequency ?? 'monthly'} onChange={(value) => updateField('maintenanceFrequency', value as RenewalFrequency)} options={[
                  ['monthly', 'Monthly'], ['quarterly', 'Quarterly'], ['yearly', 'Yearly'], ['custom', 'Custom'],
                ]} />
                <div>
                  <label className="mb-2 block text-xs font-medium text-[var(--os-text-secondary)]">Maintenance</label>
                  <button type="button" disabled={saving} onClick={() => updateField('maintenanceOpted', !form.maintenanceOpted)} className={[
                    'flex h-11 w-full items-center justify-between rounded-xl border px-3 text-sm transition-colors',
                    form.maintenanceOpted ? 'border-[var(--os-accent)] bg-[var(--os-accent-soft)] text-[var(--os-text)]' : 'border-[var(--os-border)] bg-[var(--os-surface-raised)] text-[var(--os-text-secondary)] hover:border-[var(--os-border-strong)]',
                    'disabled:cursor-not-allowed disabled:opacity-60',
                  ].join(' ')}>
                    <span>Maintenance service</span>
                    <span className={['h-5 w-9 rounded-full p-0.5 transition-colors', form.maintenanceOpted ? 'bg-[var(--os-accent)]' : 'bg-[var(--os-surface-hover)]'].join(' ')}>
                      <span className={['block h-4 w-4 rounded-full bg-white transition-transform', form.maintenanceOpted ? 'translate-x-4' : 'translate-x-0'].join(' ')} />
                    </span>
                  </button>
                </div>
                <Field label="Maintenance Charge" value={String(form.monthlyMaintenanceCharge)} onChange={(value) => updateField('monthlyMaintenanceCharge', Number(value) || 0)} type="number" min="0" placeholder="0" />
                <Field label="Maintenance Renewal Date" value={dateValue(form.maintenanceRenewalDate)} onChange={(value) => updateField('maintenanceRenewalDate', parseDate(value))} type="date" />
              </div>
            </FormSection>

            <FormSection title="Technical Operations" description="Store the information needed to maintain and deploy the product.">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Repository URL" value={form.repositoryUrl ?? ''} onChange={(value) => updateField('repositoryUrl', value)} placeholder="https://github.com/..." type="url" />
                <Field label="Deployment Platform" value={form.deploymentPlatform ?? ''} onChange={(value) => updateField('deploymentPlatform', value)} placeholder="Vercel, Firebase, Netlify..." />
                <div className="sm:col-span-2">
                  <Field label="Technology Stack" value={form.technologyStack ?? ''} onChange={(value) => updateField('technologyStack', value)} placeholder="React, Firebase, Node.js..." />
                </div>
              </div>
            </FormSection>

            <FormSection title="Notes" description="Keep operational context close to the project record.">
              <textarea value={form.notes} onChange={(event) => updateField('notes', event.target.value)} rows={4} placeholder="Project notes, renewal details, special requirements..." className="os-focus-ring w-full resize-none rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] px-3 py-3 text-sm text-[var(--os-text)] outline-none placeholder:text-[var(--os-text-muted)] focus:border-[var(--os-accent)]" />
            </FormSection>
          </div>

          {error && <div role="alert" className="mt-5 rounded-xl border border-[rgba(255,100,124,0.25)] bg-[rgba(255,100,124,0.08)] px-3 py-3 text-xs text-[var(--os-danger)]">{error}</div>}

          <div className="mt-6 flex justify-end gap-2 border-t border-[var(--os-border)] pt-5">
            <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
            <Button type="submit" disabled={saving}><Save size={16} />{saving ? 'Saving...' : website ? 'Save Changes' : 'Create Website'}</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

function FormSection({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-[var(--os-text)]">{title}</h3>
        <p className="mt-1 text-xs text-[var(--os-text-muted)]">{description}</p>
      </div>
      {children}
    </section>
  )
}

function Field({ label, value, onChange, placeholder, type = 'text', required = false, min }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; type?: string; required?: boolean; min?: string }) {
  return (
    <div>
      <label className="mb-2 block text-xs font-medium text-[var(--os-text-secondary)]">{label}{required && <span className="ml-1 text-[var(--os-danger)]">*</span>}</label>
      <input type={type} value={value} required={required} min={min} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="os-focus-ring h-11 w-full rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] px-3 text-sm text-[var(--os-text)] outline-none placeholder:text-[var(--os-text-muted)] focus:border-[var(--os-accent)]" />
    </div>
  )
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: [string, string][] }) {
  return (
    <div>
      <label className="mb-2 block text-xs font-medium text-[var(--os-text-secondary)]">{label}</label>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="os-focus-ring h-11 w-full rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] px-3 text-sm text-[var(--os-text)] outline-none focus:border-[var(--os-accent)]">
        {options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}
      </select>
    </div>
  )
}

export default WebsiteModal