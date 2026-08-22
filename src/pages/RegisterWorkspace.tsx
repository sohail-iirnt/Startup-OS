import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { ArrowRight, Eye, EyeOff, KeyRound, LockKeyhole, Mail, ShieldCheck, Sparkles, UserRound } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

import { useAuth } from '../context/useAuth'
import { registerWithEmail } from '../services/authService'
import { createUserProfile } from '../services/userService'
import { requestWorkspaceMembership } from '../services/workspaceService'
import type { UserRole } from '../types/common'

function RegisterWorkspace() {
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [workspaceId, setWorkspaceId] = useState('')
  const [requestedRole, setRequestedRole] = useState<UserRole>('intern')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!authLoading && !loading && user) navigate('/pending-approval', { replace: true })
  }, [authLoading, loading, user, navigate])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    if (!name.trim()) return setError('Please enter your name.')
    if (!email.trim()) return setError('Please enter your email address.')
    if (!workspaceId.trim()) return setError('Please enter the Workspace ID provided by your administrator.')
    if (!password || password.length < 6) return setError('Password must contain at least 6 characters.')
    if (password !== confirmPassword) return setError('Passwords do not match.')

    try {
      setLoading(true)
      const registeredUser = await registerWithEmail(name.trim(), email.trim(), password)
      await createUserProfile(registeredUser)
      await requestWorkspaceMembership(workspaceId.trim(), registeredUser, requestedRole)
      navigate('/pending-approval', { replace: true })
    } catch (submitError) {
      console.error(submitError)
      const firebaseError = submitError as { code?: string; message?: string }
      if (firebaseError.code === 'auth/email-already-in-use') setError('An account with this email already exists.')
      else if (firebaseError.code === 'auth/invalid-email') setError('Please enter a valid email address.')
      else if (firebaseError.code === 'auth/weak-password') setError('The password is too weak. Please choose a stronger password.')
      else setError(firebaseError.message || 'Unable to create your account. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const disabled = loading || authLoading

  return (
    <main className="min-h-screen bg-[var(--os-bg)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] w-full max-w-6xl overflow-hidden rounded-[28px] border border-[var(--os-border)] bg-[var(--os-surface)] shadow-[var(--os-shadow-lg)] lg:grid-cols-[1fr_1fr]">
        <section className="relative hidden overflow-hidden border-r border-[var(--os-border)] bg-[var(--os-surface-raised)] p-10 lg:flex lg:flex-col lg:justify-between xl:p-14">
          <div><div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--os-accent-soft)] text-[var(--os-accent)]"><Sparkles size={20} /></div><p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--os-accent)]">Startup OS</p><h1 className="mt-4 max-w-lg text-4xl font-semibold leading-tight tracking-tight text-[var(--os-text)] xl:text-5xl">Join the right workspace with the right access.</h1><p className="mt-5 max-w-lg text-sm leading-7 text-[var(--os-text-secondary)]">Use the Workspace ID provided by your company. Your registration becomes a pending membership request and an authorized workspace owner, admin, or manager approves your final role.</p></div>
          <div className="rounded-2xl border border-[var(--os-border)] p-5"><div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--os-success-soft)] text-[var(--os-success)]"><ShieldCheck size={18} /></span><div><p className="text-sm font-semibold text-[var(--os-text)]">Role-based access</p><p className="mt-0.5 text-xs text-[var(--os-text-muted)]">Interns, members, managers and admins get only their permitted capabilities.</p></div></div></div>
        </section>

        <section className="flex items-center justify-center p-6 sm:p-10 lg:p-12 xl:p-16"><div className="w-full max-w-md"><p className="text-sm font-medium text-[var(--os-accent)]">Workspace registration</p><h2 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--os-text)]">Create your account</h2><p className="mt-3 text-sm leading-6 text-[var(--os-text-secondary)]">After registration, you will wait for workspace approval before accessing company data.</p>
          {error && <div role="alert" className="mt-6 rounded-xl border border-[rgba(255,100,124,0.25)] bg-[var(--os-danger-soft)] px-4 py-3 text-sm leading-5 text-[var(--os-danger)]">{error}</div>}
          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            <Field icon={<UserRound size={17} />} label="Full name"><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" autoComplete="name" disabled={disabled} className={inputClass} /></Field>
            <Field icon={<Mail size={17} />} label="Email address"><input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="you@example.com" autoComplete="email" disabled={disabled} className={inputClass} /></Field>
            <Field icon={<KeyRound size={17} />} label="Workspace ID"><input value={workspaceId} onChange={(e) => setWorkspaceId(e.target.value)} placeholder="Workspace ID from administrator" autoComplete="off" disabled={disabled} className={inputClass} /><p className="mt-2 text-xs text-[var(--os-text-muted)]">This determines exactly which company workspace receives your request.</p></Field>
            <div><label htmlFor="requested-role" className="mb-2 block text-xs font-semibold uppercase tracking-[0.1em] text-[var(--os-text-secondary)]">Requested role</label><select id="requested-role" value={requestedRole} onChange={(e) => setRequestedRole(e.target.value as UserRole)} disabled={disabled} className={inputClass + ' px-4'}><option value="intern">Intern</option><option value="member">Member</option><option value="viewer">Viewer</option></select><p className="mt-2 text-xs text-[var(--os-text-muted)]">Final role is decided by an authorized workspace approver.</p></div>
            <PasswordField label="Password" value={password} onChange={setPassword} visible={showPassword} onToggle={() => setShowPassword((value) => !value)} disabled={disabled} />
            <PasswordField label="Confirm password" value={confirmPassword} onChange={setConfirmPassword} visible={showConfirmPassword} onToggle={() => setShowConfirmPassword((value) => !value)} disabled={disabled} />
            <button type="submit" disabled={disabled} className="os-focus-ring flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--os-accent)] px-4 text-sm font-semibold text-white hover:bg-[var(--os-accent-hover)] disabled:opacity-60">{loading ? 'Creating request...' : 'Create account'}{!loading && <ArrowRight size={16} />}</button>
          </form>
          <p className="mt-7 text-center text-sm text-[var(--os-text-secondary)]">Already have an account? <Link to="/login" className="font-semibold text-[var(--os-accent)] hover:text-[var(--os-accent-hover)]">Sign in</Link></p>
        </div></section>
      </div>
    </main>
  )
}

const inputClass = 'os-focus-ring h-12 w-full rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] pl-11 pr-4 text-sm text-[var(--os-text)] placeholder:text-[var(--os-text-muted)] hover:border-[var(--os-border-strong)] focus:border-[var(--os-accent-border)]'

function Field({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return <div><label className="mb-2 block text-xs font-semibold uppercase tracking-[0.1em] text-[var(--os-text-secondary)]">{label}</label><div className="relative"><span className="pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-[var(--os-text-muted)]">{icon}</span>{children}</div></div>
}

function PasswordField({ label, value, onChange, visible, onToggle, disabled }: { label: string; value: string; onChange: (value: string) => void; visible: boolean; onToggle: () => void; disabled: boolean }) {
  return <div><label className="mb-2 block text-xs font-semibold uppercase tracking-[0.1em] text-[var(--os-text-secondary)]">{label}</label><div className="relative"><LockKeyhole size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--os-text-muted)]" /><input value={value} onChange={(e) => onChange(e.target.value)} type={visible ? 'text' : 'password'} autoComplete="new-password" placeholder={label} disabled={disabled} className={inputClass + ' pr-12'} /><button type="button" onClick={onToggle} disabled={disabled} className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-[var(--os-text-muted)] hover:bg-[var(--os-surface-hover)] hover:text-[var(--os-text)]" aria-label={visible ? 'Hide password' : 'Show password'}>{visible ? <EyeOff size={16} /> : <Eye size={16} />}</button></div></div>
}

export default RegisterWorkspace
