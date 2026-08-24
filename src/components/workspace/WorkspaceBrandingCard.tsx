import { useEffect, useState } from 'react'
import { CheckCircle2, Palette, Save } from 'lucide-react'

import Button from '../ui/Button'
import Card from '../ui/Card'
import SectionHeader from '../ui/SectionHeader'
import { useWorkspace } from '../../context/useWorkspace'
import { updateWorkspaceBranding } from '../../services/workspaceService'

const DEFAULT_PORTAL_NAME = 'Startup OS'
const DEFAULT_PORTAL_SUBTITLE = 'Founder Command Center'

function WorkspaceBrandingCard() {
  const { workspace, member } = useWorkspace()
  const [portalName, setPortalName] = useState(DEFAULT_PORTAL_NAME)
  const [portalSubtitle, setPortalSubtitle] = useState(DEFAULT_PORTAL_SUBTITLE)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const canManage = member?.role === 'owner' || member?.role === 'admin'

  // Sync Firestore branding into the form only while the user is not editing.
  // This prevents a live listener update from overwriting text the admin is typing.
  useEffect(() => {
    if (editing) return
    setPortalName(workspace?.portalName?.trim() || DEFAULT_PORTAL_NAME)
    setPortalSubtitle(workspace?.portalSubtitle?.trim() || DEFAULT_PORTAL_SUBTITLE)
  }, [workspace?.portalName, workspace?.portalSubtitle, editing])

  function changePortalName(value: string) {
    setEditing(true)
    setSaved(false)
    setError('')
    setPortalName(value)
  }

  function changePortalSubtitle(value: string) {
    setEditing(true)
    setSaved(false)
    setError('')
    setPortalSubtitle(value)
  }

  async function handleSave() {
    if (!workspace?.id || !canManage || saving) return

    const nextName = portalName.trim()
    const nextSubtitle = portalSubtitle.trim()
    if (!nextName) {
      setError('Portal name is required.')
      return
    }
    if (!nextSubtitle) {
      setError('Portal subtitle is required.')
      return
    }

    setSaving(true)
    setSaved(false)
    setError('')

    try {
      await updateWorkspaceBranding(workspace.id, nextName, nextSubtitle)
      setEditing(false)
      setSaved(true)
      window.setTimeout(() => setSaved(false), 2200)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save portal branding.')
    } finally {
      setSaving(false)
    }
  }

  if (!canManage) return null

  return (
    <Card className="mt-6 p-6">
      <SectionHeader
        title="Portal branding"
        description="Customize the name and command-center label shown across the authenticated portal."
      />

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.1em] text-[var(--os-text-secondary)]">Portal name</span>
          <input
            value={portalName}
            onChange={(event) => changePortalName(event.target.value)}
            maxLength={60}
            placeholder="e.g. Startup OS"
            className="os-focus-ring h-12 w-full rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] px-4 text-sm text-[var(--os-text)] placeholder:text-[var(--os-text-muted)]"
          />
          <span className="mt-1.5 block text-xs text-[var(--os-text-muted)]">Used as the main portal/product name in navigation and the top bar.</span>
        </label>

        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.1em] text-[var(--os-text-secondary)]">Portal subtitle</span>
          <input
            value={portalSubtitle}
            onChange={(event) => changePortalSubtitle(event.target.value)}
            maxLength={80}
            placeholder="e.g. Founder Command Center"
            className="os-focus-ring h-12 w-full rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] px-4 text-sm text-[var(--os-text)] placeholder:text-[var(--os-text-muted)]"
          />
          <span className="mt-1.5 block text-xs text-[var(--os-text-muted)]">Used as the portal descriptor and founder/admin dashboard label.</span>
        </label>
      </div>

      {error && <div role="alert" className="mt-4 rounded-xl border border-[rgba(255,100,124,0.25)] bg-[var(--os-danger-soft)] px-4 py-3 text-sm text-[var(--os-danger)]">{error}</div>}

      <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--os-accent-soft)] text-[var(--os-accent)]"><Palette size={18} /></span>
          <div>
            <p className="text-sm font-medium text-[var(--os-text)]">Live workspace branding</p>
            <p className="mt-0.5 text-xs text-[var(--os-text-muted)]">All active members receive changes automatically.</p>
          </div>
        </div>
        <Button type="button" onClick={() => void handleSave()} disabled={saving || !workspace?.id}>
          {saved ? <CheckCircle2 size={16} /> : <Save size={16} />}
          {saving ? 'Saving...' : saved ? 'Saved' : 'Save branding'}
        </Button>
      </div>
    </Card>
  )
}

export default WorkspaceBrandingCard
