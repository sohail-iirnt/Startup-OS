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
  WebsiteStatus,
  WebsiteType,
} from '../../types/website'

type WebsiteModalProps = {
  open: boolean
  onClose: () => void
  onSubmit: (
    input: CreateWebsiteInput,
  ) => Promise<void>
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
}

function getInitialForm(
  website?: Website | null,
): CreateWebsiteInput {
  if (!website) {
    return { ...emptyForm }
  }

  return {
    name: website.name,
    clientName: website.clientName,
    type: website.type,
    status: website.status,
    liveUrl: website.liveUrl,
    hostingProvider: website.hostingProvider,
    developmentAmount:
      website.developmentAmount,
    maintenanceOpted:
      website.maintenanceOpted,
    monthlyMaintenanceCharge:
      website.monthlyMaintenanceCharge,
    notes: website.notes,
  }
}

function WebsiteModal({
  open,
  onClose,
  onSubmit,
  website,
  saving = false,
}: WebsiteModalProps) {
  const [form, setForm] =
    useState<CreateWebsiteInput>(() =>
      getInitialForm(website),
    )

  const [error, setError] = useState('')

  /*
   * The modal component is remounted when the
   * parent changes the key based on the website.
   *
   * This keeps form initialization out of an effect
   * and avoids the react-hooks/set-state-in-effect
   * lint error.
   */

  if (!open) {
    return null
  }

  function updateField<
    K extends keyof CreateWebsiteInput,
  >(
    field: K,
    value: CreateWebsiteInput[K],
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))

    if (error) {
      setError('')
    }
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()
    setError('')

    const trimmedName = form.name.trim()

    if (!trimmedName) {
      setError(
        'Website or app name is required.',
      )
      return
    }

    const payload: CreateWebsiteInput = {
      ...form,
      name: trimmedName,
      clientName: form.clientName.trim(),
      liveUrl: form.liveUrl.trim(),
      hostingProvider:
        form.hostingProvider.trim(),
      notes: form.notes.trim(),
      developmentAmount:
        Number(form.developmentAmount) || 0,
      monthlyMaintenanceCharge:
        form.maintenanceOpted
          ? Number(
              form.monthlyMaintenanceCharge,
            ) || 0
          : 0,
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
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close modal"
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />

      {/* Modal */}
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[var(--os-border-strong)] bg-[var(--os-surface)] shadow-[var(--os-shadow-lg)]">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-[var(--os-border)] px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--os-accent-soft)] text-[var(--os-accent)]">
              <Globe size={18} />
            </div>

            <div>
              <h2 className="text-sm font-semibold text-[var(--os-text)]">
                {website
                  ? 'Edit Website / App'
                  : 'Add Website / App'}
              </h2>

              <p className="text-xs text-[var(--os-text-muted)]">
                {website
                  ? 'Update your client project details.'
                  : 'Add a new client project to your workspace.'}
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

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="overflow-y-auto p-5"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Name */}
            <Field
              label="Website / App Name"
              required
              value={form.name}
              onChange={(value) =>
                updateField('name', value)
              }
              placeholder="e.g. Muslimah.Glamour"
            />

            {/* Client */}
            <Field
              label="Client Name"
              value={form.clientName}
              onChange={(value) =>
                updateField(
                  'clientName',
                  value,
                )
              }
              placeholder="Client / business name"
            />

            {/* Type */}
            <SelectField
              label="Type"
              value={form.type}
              onChange={(value) =>
                updateField(
                  'type',
                  value as WebsiteType,
                )
              }
              options={[
                ['website', 'Website'],
                ['web-app', 'Web App'],
                ['mobile-app', 'Mobile App'],
                ['other', 'Other'],
              ]}
            />

            {/* Status */}
            <SelectField
              label="Status"
              value={form.status}
              onChange={(value) =>
                updateField(
                  'status',
                  value as WebsiteStatus,
                )
              }
              options={[
                ['live', 'Live'],
                [
                  'in-development',
                  'In Development',
                ],
                [
                  'maintenance',
                  'Maintenance',
                ],
                ['testing', 'Testing'],
                ['paused', 'Paused'],
                ['expired', 'Expired'],
              ]}
            />

            {/* Live URL */}
            <Field
              label="Live URL"
              value={form.liveUrl}
              onChange={(value) =>
                updateField(
                  'liveUrl',
                  value,
                )
              }
              placeholder="https://example.com"
              type="url"
            />

            {/* Hosting */}
            <Field
              label="Hosting Provider"
              value={
                form.hostingProvider
              }
              onChange={(value) =>
                updateField(
                  'hostingProvider',
                  value,
                )
              }
              placeholder="Firebase, Hostinger..."
            />

            {/* Development Amount */}
            <Field
              label="Development Amount"
              value={String(
                form.developmentAmount,
              )}
              onChange={(value) =>
                updateField(
                  'developmentAmount',
                  Number(value) || 0,
                )
              }
              type="number"
              placeholder="0"
              min="0"
            />

            {/* Maintenance */}
            <div>
              <label className="mb-2 block text-xs font-medium text-[var(--os-text-secondary)]">
                Maintenance
              </label>

              <button
                type="button"
                disabled={saving}
                onClick={() =>
                  updateField(
                    'maintenanceOpted',
                    !form.maintenanceOpted,
                  )
                }
                className={[
                  'flex h-11 w-full items-center justify-between rounded-xl border px-3 text-sm transition-colors',
                  form.maintenanceOpted
                    ? 'border-[var(--os-accent)] bg-[var(--os-accent-soft)] text-[var(--os-text)]'
                    : 'border-[var(--os-border)] bg-[var(--os-surface-raised)] text-[var(--os-text-secondary)] hover:border-[var(--os-border-strong)]',
                  'disabled:cursor-not-allowed disabled:opacity-60',
                ].join(' ')}
              >
                <span>
                  Monthly maintenance
                </span>

                <span
                  className={[
                    'h-5 w-9 rounded-full p-0.5 transition-colors',
                    form.maintenanceOpted
                      ? 'bg-[var(--os-accent)]'
                      : 'bg-[var(--os-surface-hover)]',
                  ].join(' ')}
                >
                  <span
                    className={[
                      'block h-4 w-4 rounded-full bg-white transition-transform',
                      form.maintenanceOpted
                        ? 'translate-x-4'
                        : 'translate-x-0',
                    ].join(' ')}
                  />
                </span>
              </button>
            </div>

            {/* Maintenance Charge */}
            {form.maintenanceOpted && (
              <Field
                label="Monthly Maintenance Charge"
                value={String(
                  form.monthlyMaintenanceCharge,
                )}
                onChange={(value) =>
                  updateField(
                    'monthlyMaintenanceCharge',
                    Number(value) || 0,
                  )
                }
                type="number"
                placeholder="0"
                min="0"
              />
            )}

            {/* Notes */}
            <div className="sm:col-span-2">
              <label className="mb-2 block text-xs font-medium text-[var(--os-text-secondary)]">
                Notes
              </label>

              <textarea
                value={form.notes}
                onChange={(event) =>
                  updateField(
                    'notes',
                    event.target.value,
                  )
                }
                rows={4}
                placeholder="Project notes, renewal details, special requirements..."
                className="os-focus-ring w-full resize-none rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] px-3 py-3 text-sm text-[var(--os-text)] outline-none placeholder:text-[var(--os-text-muted)] focus:border-[var(--os-accent)]"
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div
              role="alert"
              className="mt-4 rounded-xl border border-[rgba(255,100,124,0.25)] bg-[rgba(255,100,124,0.08)] px-3 py-3 text-xs text-[var(--os-danger)]"
            >
              {error}
            </div>
          )}

          {/* Footer */}
          <div className="mt-6 flex justify-end gap-2 border-t border-[var(--os-border)] pt-5">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={saving}
            >
              <Save size={16} />

              {saving
                ? 'Saving...'
                : website
                  ? 'Save Changes'
                  : 'Create Website'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  required = false,
  min,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  type?: string
  required?: boolean
  min?: string
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-medium text-[var(--os-text-secondary)]">
        {label}

        {required && (
          <span className="ml-1 text-[var(--os-danger)]">
            *
          </span>
        )}
      </label>

      <input
        type={type}
        value={value}
        required={required}
        min={min}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        className="os-focus-ring h-11 w-full rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] px-3 text-sm text-[var(--os-text)] outline-none placeholder:text-[var(--os-text-muted)] focus:border-[var(--os-accent)]"
      />
    </div>
  )
}

function SelectField({
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
      <label className="mb-2 block text-xs font-medium text-[var(--os-text-secondary)]">
        {label}
      </label>

      <select
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="os-focus-ring h-11 w-full rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] px-3 text-sm text-[var(--os-text)] outline-none focus:border-[var(--os-accent)]"
      >
        {options.map(
          ([optionValue, optionLabel]) => (
            <option
              key={optionValue}
              value={optionValue}
            >
              {optionLabel}
            </option>
          ),
        )}
      </select>
    </div>
  )
}

export default WebsiteModal