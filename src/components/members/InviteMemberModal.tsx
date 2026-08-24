import { useState } from 'react'
import { Check, Copy, Link2, Loader2, Mail, UserPlus, X } from 'lucide-react'

import Button from '../ui/Button'
import type { UserRole } from '../../types/common'
import { createWorkspaceInvitation } from '../../services/invitationService'

type InviteMemberModalProps = {
  open: boolean
  workspaceId: string
  workspaceName: string
  onClose: () => void
}

const roleOptions: Array<{ value: UserRole; label: string; description: string }> = [
  { value: 'intern', label: 'Intern', description: 'Restricted access focused on assigned tasks and projects.' },
  { value: 'member', label: 'Member', description: 'Standard operational access for assigned company work.' },
  { value: 'viewer', label: 'Viewer', description: 'Read-only access to permitted workspace information.' },
  { value: 'manager', label: 'Manager', description: 'Operational access for managing people, projects and tasks.' },
]

function InviteMemberModal({ open, workspaceId, workspaceName, onClose }: InviteMemberModalProps) {
  const [role, setRole] = useState<UserRole>('intern')
  const [email, setEmail] = useState('')
  const [copied, setCopied] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [inviteUrl, setInviteUrl] = useState('')

  if (!open) return null

  async function copyInvite() {
    if (!workspaceId || creating) return

    setCreating(true)
    setError('')
    setCopied(false)

    try {
      const invitation = await createWorkspaceInvitation(workspaceId, role, email)
      const url = new URL('/register', window.location.origin)
      url.searchParams.set('workspaceId', workspaceId)
      url.searchParams.set('inviteToken', invitation.token)

      const generatedUrl = url.toString()
      await navigator.clipboard.writeText(generatedUrl)
      setInviteUrl(generatedUrl)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch (inviteError: unknown) {
      setError(
        inviteError instanceof Error
          ? inviteError.message
          : 'Unable to create the invitation. Please try again.',
      )
    } finally {
      setCreating(false)
    }
  }

  function close() {
    setEmail('')
    setRole('intern')
    setCopied(false)
    setCreating(false)
    setError('')
    setInviteUrl('')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="invite-member-title">
      <button type="button" aria-label="Close invite member dialog" onClick={close} className="absolute inset-0 cursor-default" />

      <div className="relative z-10 w-full max-w-xl overflow-hidden rounded-2xl border border-[var(--os-border-strong)] bg-[var(--os-surface)] shadow-[var(--os-shadow-lg)]">
        <div className="flex items-start justify-between border-b border-[var(--os-border)] px-5 py-4 sm:px-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--os-accent-soft)] text-[var(--os-accent)]"><UserPlus size={19} /></div>
            <div>
              <h2 id="invite-member-title" className="text-base font-semibold text-[var(--os-text)]">Invite a member</h2>
              <p className="mt-1 text-xs text-[var(--os-text-secondary)]">Create a secure, tracked workspace invitation for {workspaceName}.</p>
            </div>
          </div>
          <button type="button" onClick={close} className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--os-text-muted)] transition-colors hover:bg-[var(--os-surface-hover)] hover:text-[var(--os-text)]" aria-label="Close"><X size={17} /></button>
        </div>

        <div className="space-y-5 p-5 sm:p-6">
          <div>
            <label htmlFor="invite-email" className="mb-2 block text-xs font-semibold uppercase tracking-[0.1em] text-[var(--os-text-secondary)]">Member email <span className="font-normal normal-case tracking-normal text-[var(--os-text-muted)]">(optional)</span></label>
            <div className="relative">
              <Mail size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--os-text-muted)]" />
              <input id="invite-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="intern@example.com" className="os-focus-ring h-11 w-full rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] pl-10 pr-4 text-sm text-[var(--os-text)] placeholder:text-[var(--os-text-muted)]" />
            </div>
            <p className="mt-2 text-xs text-[var(--os-text-muted)]">If provided, registration is restricted to this email address.</p>
          </div>

          <div>
            <label htmlFor="invite-role" className="mb-2 block text-xs font-semibold uppercase tracking-[0.1em] text-[var(--os-text-secondary)]">Suggested role</label>
            <select id="invite-role" value={role} onChange={(event) => { setRole(event.target.value as UserRole); setInviteUrl(''); setCopied(false) }} className="os-focus-ring h-11 w-full rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] px-3 text-sm text-[var(--os-text)]" disabled={creating}>
              {roleOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
            <p className="mt-2 text-xs text-[var(--os-text-muted)]">{roleOptions.find((option) => option.value === role)?.description}</p>
          </div>

          <div className="rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] p-4">
            <div className="flex items-center gap-2"><Link2 size={15} className="text-[var(--os-accent)]" /><p className="text-xs font-semibold text-[var(--os-text)]">Secure invitation link</p></div>
            <p className="mt-2 break-all rounded-lg bg-[var(--os-surface-hover)] p-3 text-xs leading-5 text-[var(--os-text-secondary)]">{inviteUrl || 'A secure one-time invitation token will be generated when you create the invitation.'}</p>
          </div>

          {error && <div role="alert" className="rounded-xl border border-[rgba(255,100,124,0.25)] bg-[rgba(255,100,124,0.08)] px-4 py-3 text-xs leading-5 text-[var(--os-danger)]">{error}</div>}

          <div className="rounded-xl border border-[rgba(90,169,255,0.18)] bg-[rgba(90,169,255,0.06)] px-4 py-3 text-xs leading-5 text-[var(--os-text-secondary)]">
            Invitations expire after 7 days. The invited person must use the secure link, create an account, and still wait for workspace approval before accessing company data.
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-[var(--os-border)] px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          <Button type="button" variant="secondary" onClick={close} disabled={creating}>Close</Button>
          <Button type="button" onClick={() => void copyInvite()} disabled={creating || !workspaceId}>
            {creating ? <Loader2 size={15} className="animate-spin" /> : copied ? <Check size={15} /> : <Copy size={15} />}
            {creating ? 'Creating invitation...' : copied ? 'Copied' : 'Create & copy invitation'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default InviteMemberModal
