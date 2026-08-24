import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { ArrowRight, Eye, EyeOff, KeyRound, LockKeyhole, Mail, ShieldCheck, Sparkles, UserRound } from 'lucide-react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'

import { useAuth } from '../context/useAuth'
import { registerWithEmail } from '../services/authService'
import { getWorkspaceInvitationByToken, acceptWorkspaceInvitation } from '../services/invitationService'
import { createUserProfile } from '../services/userService'
import { requestWorkspaceMembership } from '../services/workspaceService'
import type { UserRole } from '../types/common'
import type { WorkspaceInvitation } from '../types/invitation'

const INVITABLE_ROLES: UserRole[] = ['intern', 'member', 'viewer', 'manager']

function RegisterWorkspace() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user, loading: authLoading } = useAuth()

  const invitationWorkspaceId = searchParams.get('workspaceId')?.trim() || ''
  const invitationToken = searchParams.get('inviteToken')?.trim() || searchParams.get('token')?.trim() || ''

  const [invitation, setInvitation] = useState<WorkspaceInvitation | null>(null)
  const [invitationLoading, setInvitationLoading] = useState(Boolean(invitationWorkspaceId && invitationToken))
  const [invitationError, setInvitationError] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [workspaceId, setWorkspaceId] = useState(invitationWorkspaceId)
  const [requestedRole, setRequestedRole] = useState<UserRole>('intern')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function validateInvitation() {
      if (!invitationWorkspaceId || !invitationToken) {
        setInvitationLoading(false)
        return
      }

      setInvitationLoading(true)
      setInvitationError('')

      try {
        const result = await getWorkspaceInvitationByToken(invitationWorkspaceId, invitationToken)

        if (!result) {
          throw new Error('This invitation link is invalid or no longer available.')
        }

        if (result.status !== 'pending') {
          throw new Error('This invitation has already been used or is no longer active.')
        }

        if (result.expiresAt.getTime() <= Date.now()) {
          throw new Error('This invitation has expired. Please request a new invitation.')
        }

        if (!cancelled) {
          setInvitation(result)
          setRequestedRole(result.role)
          setEmail(result.email || '')
        }
      } catch (validationError) {
        if (!cancelled) {
          setInvitation(null)
          setInvitationError(validationError instanceof Error ? validationError.message : 'Unable to validate this invitation.')
        }
      } finally {
        if (!cancelled) setInvitationLoading(false)
      }
    }

    void validateInvitation()
    return () => { cancelled = true }
  }, [invitationWorkspaceId, invitationToken])

  useEffect(() => {
    if (!authLoading && !loading && user) {
      navigate('/pending-approval', { replace: true })
    }
  }, [authLoading, loading, user, navigate])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    if (invitationWorkspaceId || invitationToken) {
      if (!invitation) {
        setError(invitationError || 'Please use a valid invitation link.')
        return
      }
    }

    if (!name.trim()) {
      setError('Please enter your name.')
      return
    }
    if (!email.trim()) {
      setError('Please enter your email address.')
      return
    }
    if (!workspaceId.trim()) {
      setError('Please enter the Workspace ID provided by your administrator.')
      return
    }
    if (!password || password.length < 6) {
      setError('Password must contain at least 6 characters.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (invitation?.email && invitation.email.toLowerCase() !== email.trim().toLowerCase()) {
      setError('This invitation is restricted to a different email address.')
      return
    }

    try {
      setLoading(true)
      const registeredUser = await registerWithEmail(name.trim(), email.trim(), password)
      await createUserProfile(registeredUser)
      await requestWorkspaceMembership(workspaceId.trim(), registeredUser, invitation?.role || requestedRole)

      if (invitation) {
        await acceptWorkspaceInvitation(workspaceId.trim(), invitationToken, registeredUser.uid)
      }

      navigate('/pending-approval', { replace: true })
    } catch (submitError) {
      console.error(submitError)
      const firebaseError = submitError as { code?: string; message?: string }

      if (firebaseError.code === 'auth/email-already-in-use') {
        setError('An account with this email already exists.')
      } else if (firebaseError.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.')
      } else if (firebaseError.code === 'auth/weak-password') {
        setError('The password is too weak. Please choose a stronger password.')
      } else {
        setError(firebaseError.message || 'Unable to create your account. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const disabled = loading || authLoading || invitationLoading
  const hasInvitation = Boolean(invitationWorkspaceId && invitationToken)

  return (
    <main className="min-h-screen bg-[var(--os-bg)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] w-full max-w-6xl overflow-hidden rounded-[28px] border border-[var(--os-border)] bg-[var(--os-surface)] shadow-[var(--os-shadow-lg)] lg:grid-cols-[1fr_1fr]">
        <section className="relative hidden overflow-hidden border-r border-[var(--os-border)] bg-[var(--os-surface-raised)] p-10 lg:flex lg:flex-col lg:justify-between xl:p-14">
          <div>
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--os-accent-soft)] text-[var(--os-accent)]"><Sparkles size={20} /></div>
            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--os-accent)]">Startup OS</p>
            <h1 className="mt-4 max-w-lg text-4xl font-semibold leading-tight tracking-tight text-[var(--os-text)] xl:text-5xl">Join the right workspace with the right access.</h1>
            <p className="mt-5 max-w-lg text-sm leading-7 text-[var(--os-text-secondary)]">{hasInvitation ? 'Your secure invitation determines the workspace and suggested role. Your membership will still require approval.' : 'Use the Workspace ID provided by your company. Your registration becomes a pending membership request.'}</p>
          </div>
          <div className="rounded-2xl border border-[var(--os-border)] p-5">
            <div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--os-success-soft)] text-[var(--os-success)]"><ShieldCheck size={18} /></span><div><p className="text-sm font-semibold text-[var(--os-text)]">Role-based access</p><p className="mt-0.5 text-xs text-[var(--os-text-muted)]">Access is activated only after workspace approval.</p></div></div>
          </div>
        </section>

        <section className="flex items-center justify-center p-6 sm:p-10 lg:p-12 xl:p-16">
          <div className="w-full max-w-md">
            <p className="text-sm font-medium text-[var(--os-accent)]">{hasInvitation ? 'Secure workspace invitation' : 'Workspace registration'}</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--os-text)]">Create your account</h2>
            <p className="mt-3 text-sm leading-6 text-[var(--os-text-secondary)]">{hasInvitation ? 'Your invitation has been validated. Complete your account details to request access.' : 'After registration, you will wait for workspace approval before accessing company data.'}</p>

            {invitationLoading && <div className="mt-6 rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] px-4 py-3 text-sm text-[var(--os-text-secondary)]">Validating your invitation...</div>}

            {invitationError && <div role="alert" className="mt-6 rounded-xl border border-[rgba(255,100,124,0.25)] bg-[var(--os-danger-soft)] px-4 py-3 text-sm leading-5 text-[var(--os-danger)]">{invitationError}</div>}

            {invitation && <div className="mt-5 rounded-xl border border-[rgba(139,124,255,0.2)] bg-[var(--os-accent-soft)] px-4 py-3 text-xs leading-5 text-[var(--os-text-secondary)]">Workspace: <span className="font-semibold text-[var(--os-text)]">{invitation.workspaceId}</span><br />Suggested role: <span className="font-semibold capitalize text-[var(--os-text)]">{invitation.role}</span>{invitation.email ? <><br />Invited email: <span className="font-semibold text-[var(--os-text)]">{invitation.email}</span></> : null}</div>}

            {error && <div role="alert" className="mt-6 rounded-xl border border-[rgba(255,100,124,0.25)] bg-[var(--os-danger-soft)] px-4 py-3 text-sm leading-5 text-[var(--os-danger)]">{error}</div>}

            <form onSubmit={handleSubmit} className="mt-7 space-y-4">
              <Field icon={<UserRound size={17} />} label="Full name"><input value={name} onChange={(event) => setName(event.target.value)} placeholder="Your full name" autoComplete="name" disabled={disabled} className={inputClass} /></Field>
              <Field icon={<Mail size={17} />} label="Email address"><input value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="you@example.com" autoComplete="email" disabled={disabled || Boolean(invitation?.email)} className={inputClass} /></Field>
              {!hasInvitation && <><Field icon={<KeyRound size={17} />} label="Workspace ID"><input value={workspaceId} onChange={(event) => setWorkspaceId(event.target.value)} placeholder="Workspace ID from administrator" autoComplete="off" disabled={disabled} className={inputClass} /></Field><div><label htmlFor="requested-role" className="mb-2 block text-xs font-semibold uppercase tracking-[0.1em] text-[var(--os-text-secondary)]">Requested role</label><select id="requested-role" value={requestedRole} onChange={(event) => setRequestedRole(event.target.value as UserRole)} disabled={disabled} className={`${inputClass} px-4`}><option value="intern">Intern</option><option value="member">Member</option><option value="viewer">Viewer</option><option value="manager">Manager</option></select></div></>}
              <PasswordField label="Password" value={password} onChange={setPassword} visible={showPassword} onToggle={() => setShowPassword((value) => !value)} disabled={disabled} />
              <PasswordField label="Confirm password" value={confirmPassword} onChange={setConfirmPassword} visible={showConfirmPassword} onToggle={() => setShowConfirmPassword((value) => !value)} disabled={disabled} />
              <button type="submit" disabled={disabled || (hasInvitation && !invitation)} className="os-focus-ring flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--os-accent)] px-4 text-sm font-semibold text-white hover:bg-[var(--os-accent-hover)] disabled:opacity-60">{loading ? 'Creating request...' : 'Create account'}{!loading && <ArrowRight size={16} />}</button>
            </form>

            <p className="mt-7 text-center text-sm text-[var(--os-text-secondary)]">Already have an account? <Link to="/login" className="font-semibold text-[var(--os-accent)] hover:text-[var(--os-accent-hover)]">Sign in</Link></p>
          </div>
        </section>
      </div>
    </main>
  )
}

const inputClass = 'os-focus-ring h-12 w-full rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] pl-11 pr-4 text-sm text-[var(--os-text)] placeholder:text-[var(--os-text-muted)] hover:border-[var(--os-border-strong)] focus:border-[var(--os-accent-border)]'

function Field({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return <div><label className="mb-2 block text-xs font-semibold uppercase tracking-[0.1em] text-[var(--os-text-secondary)]">{label}</label><div className="relative"><span className="pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-[var(--os-text-muted)]">{icon}</span>{children}</div></div>
}

function PasswordField({ label, value, onChange, visible, onToggle, disabled }: { label: string; value: string; onChange: (value: string) => void; visible: boolean; onToggle: () => void; disabled: boolean }) {
  return <div><label className="mb-2 block text-xs font-semibold uppercase tracking-[0.1em] text-[var(--os-text-secondary)]">{label}</label><div className="relative"><LockKeyhole size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--os-text-muted)]" /><input value={value} onChange={(event) => onChange(event.target.value)} type={visible ? 'text' : 'password'} autoComplete="new-password" placeholder={label} disabled={disabled} className={`${inputClass} pr-12`} /><button type="button" onClick={onToggle} disabled={disabled} className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-[var(--os-text-muted)] hover:bg-[var(--os-surface-hover)] hover:text-[var(--os-text)]" aria-label={visible ? 'Hide password' : 'Show password'}>{visible ? <EyeOff size={16} /> : <Eye size={16} />}</button></div></div>
}

export default RegisterWorkspace
