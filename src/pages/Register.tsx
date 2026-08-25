import { useEffect, useState, type FormEvent } from 'react'
import { ArrowRight, Check, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, Sparkles, UserRound } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { registerWithEmail } from '../services/authService'
import { acceptWorkspaceInvitation } from '../services/invitationService'
import { useAuth } from '../context/useAuth'

function Register() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, loading: authLoading } = useAuth()
  const params = new URLSearchParams(location.search)
  const inviteWorkspaceId = params.get('workspaceId')?.trim() || ''
  const inviteToken = params.get('inviteToken')?.trim() || ''
  const invitedEmail = params.get('email')?.trim() || ''
  const isInvitedRegistration = Boolean(inviteWorkspaceId && inviteToken)

  const [name, setName] = useState('')
  const [email, setEmail] = useState(invitedEmail)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!authLoading && user && !loading) navigate('/', { replace: true })
  }, [authLoading, user, loading, navigate])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    if (!name.trim()) return setError('Please enter your name.')
    if (!email.trim()) return setError('Please enter your email address.')
    if (!password) return setError('Please create a password.')
    if (password.length < 6) return setError('Password must contain at least 6 characters.')
    if (password !== confirmPassword) return setError('Passwords do not match.')
    if (isInvitedRegistration && invitedEmail && email.trim().toLowerCase() !== invitedEmail.toLowerCase()) return setError(`Please register using the invited email: ${invitedEmail}`)

    try {
      setLoading(true)
      const registeredUser = await registerWithEmail(name.trim(), email.trim(), password)
      if (isInvitedRegistration) {
        await acceptWorkspaceInvitation(inviteWorkspaceId, inviteToken, registeredUser.uid)
        navigate('/pending-approval', { replace: true })
      } else {
        navigate('/register-workspace', { replace: true })
      }
    } catch (registrationError) {
      console.error(registrationError)
      const firebaseError = registrationError as { code?: string }
      if (firebaseError.code === 'auth/email-already-in-use') setError('An account with this email already exists. Sign in and use the invitation link.')
      else if (firebaseError.code === 'auth/invalid-email') setError('Please enter a valid email address.')
      else if (firebaseError.code === 'auth/weak-password') setError('The password is too weak. Please choose a stronger password.')
      else setError(registrationError instanceof Error ? registrationError.message : 'Unable to create your account. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const disabled = loading || authLoading
  const passwordStrong = password.length >= 6
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword

  return (
    <main className="min-h-screen bg-[var(--os-bg)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] w-full max-w-6xl overflow-hidden rounded-[28px] border border-[var(--os-border)] bg-[var(--os-surface)] shadow-[var(--os-shadow-lg)] lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative hidden overflow-hidden border-r border-[var(--os-border)] bg-[var(--os-surface-raised)] p-10 lg:flex lg:flex-col lg:justify-between xl:p-14">
          <div className="absolute -left-24 -top-20 h-80 w-80 rounded-full bg-[var(--os-accent)] opacity-[0.08] blur-3xl" />
          <div className="absolute -bottom-28 -right-20 h-80 w-80 rounded-full bg-[var(--os-success)] opacity-[0.045] blur-3xl" />
          <div className="relative"><div className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--os-accent-border)] bg-[var(--os-accent-soft)] text-[var(--os-accent)]"><Sparkles size={20} /></div><p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--os-accent)]">Startup OS</p><h2 className="mt-4 max-w-md text-4xl font-semibold leading-tight tracking-tight text-[var(--os-text)] xl:text-5xl">{isInvitedRegistration ? 'Join your workspace securely.' : 'Build your operating system for growth.'}</h2><p className="mt-5 max-w-lg text-sm leading-7 text-[var(--os-text-secondary)]">{isInvitedRegistration ? 'Your invitation creates a pending membership. A workspace administrator will approve your access before company data becomes available.' : 'Create your workspace account and bring your people, projects and daily operations into one place.'}</p></div>
          <div className="relative rounded-2xl border border-[var(--os-border)] bg-[rgba(255,255,255,0.025)] p-5"><div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--os-success-soft)] text-[var(--os-success)]"><ShieldCheck size={18} /></span><div><p className="text-sm font-semibold text-[var(--os-text)]">{isInvitedRegistration ? 'Invitation protected' : 'Founder-first workspace'}</p><p className="mt-0.5 text-xs text-[var(--os-text-muted)]">{isInvitedRegistration ? 'Approval is required before access.' : 'Start with your own secure account.'}</p></div></div></div>
        </section>
        <section className="flex items-center justify-center p-6 sm:p-10 lg:p-12 xl:p-16"><div className="w-full max-w-md">
          <div className="mb-8 lg:hidden"><div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--os-accent-soft)] text-[var(--os-accent)]"><Sparkles size={19} /></div><p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--os-accent)]">Startup OS</p></div>
          <p className="text-sm font-medium text-[var(--os-accent)]">{isInvitedRegistration ? 'Workspace invitation' : 'Get started'}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--os-text)] sm:text-4xl">{isInvitedRegistration ? 'Create your invited account' : 'Create your account'}</h1>
          <p className="mt-3 text-sm leading-6 text-[var(--os-text-secondary)]">{isInvitedRegistration ? 'Complete registration to submit your invited workspace membership for approval.' : 'Set up your identity before you enter your Startup OS workspace.'}</p>
          {isInvitedRegistration && <div className="mt-5 rounded-xl border border-[var(--os-accent-border)] bg-[var(--os-accent-soft)] px-4 py-3 text-xs leading-5 text-[var(--os-text-secondary)]">Invited email: <strong className="text-[var(--os-text)]">{invitedEmail || 'Open invitation'}</strong></div>}
          {error && <div role="alert" className="mt-6 rounded-xl border border-[rgba(255,100,124,0.25)] bg-[var(--os-danger-soft)] px-4 py-3 text-sm leading-5 text-[var(--os-danger)]">{error}</div>}
          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            <div><label htmlFor="name" className="mb-2 block text-xs font-semibold uppercase tracking-[0.1em] text-[var(--os-text-secondary)]">Full name</label><div className="relative"><UserRound size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--os-text-muted)]" /><input id="name" type="text" value={name} onChange={event => setName(event.target.value)} placeholder="Your full name" autoComplete="name" disabled={disabled} className="os-focus-ring h-12 w-full rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] pl-11 pr-4 text-sm text-[var(--os-text)] placeholder:text-[var(--os-text-muted)]" /></div></div>
            <div><label htmlFor="email" className="mb-2 block text-xs font-semibold uppercase tracking-[0.1em] text-[var(--os-text-secondary)]">Email address</label><div className="relative"><Mail size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--os-text-muted)]" /><input id="email" type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="you@example.com" autoComplete="email" disabled={disabled || Boolean(invitedEmail)} className="os-focus-ring h-12 w-full rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] pl-11 pr-4 text-sm text-[var(--os-text)] placeholder:text-[var(--os-text-muted)]" /></div></div>
            <div><label htmlFor="password" className="mb-2 block text-xs font-semibold uppercase tracking-[0.1em] text-[var(--os-text-secondary)]">Password</label><div className="relative"><LockKeyhole size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--os-text-muted)]" /><input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={event => setPassword(event.target.value)} placeholder="Create a password" autoComplete="new-password" disabled={disabled} className="os-focus-ring h-12 w-full rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] pl-11 pr-12 text-sm text-[var(--os-text)] placeholder:text-[var(--os-text-muted)]" /><button type="button" onClick={() => setShowPassword(value => !value)} disabled={disabled} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-[var(--os-text-muted)] hover:bg-[var(--os-surface-hover)]"><EyeOff size={16} /></button></div><p className={`mt-2 flex items-center gap-1 text-xs ${passwordStrong ? 'text-[var(--os-success)]' : 'text-[var(--os-text-muted)]'}`}>{passwordStrong ? <Check size={13} /> : null} At least 6 characters</p></div>
            <div><label htmlFor="confirm-password" className="mb-2 block text-xs font-semibold uppercase tracking-[0.1em] text-[var(--os-text-secondary)]">Confirm password</label><div className="relative"><LockKeyhole size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--os-text-muted)]" /><input id="confirm-password" type={showConfirmPassword ? 'text' : 'password'} value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} placeholder="Confirm your password" autoComplete="new-password" disabled={disabled} className="os-focus-ring h-12 w-full rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] pl-11 pr-12 text-sm text-[var(--os-text)] placeholder:text-[var(--os-text-muted)]" /><button type="button" onClick={() => setShowConfirmPassword(value => !value)} disabled={disabled} aria-label={showConfirmPassword ? 'Hide password confirmation' : 'Show password confirmation'} className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-[var(--os-text-muted)] hover:bg-[var(--os-surface-hover)]"><EyeOff size={16} /></button></div>{passwordsMatch && <p className="mt-2 flex items-center gap-1 text-xs text-[var(--os-success)]"><Check size={13} /> Passwords match</p>}</div>
            <button type="submit" disabled={disabled} className="os-focus-ring mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--os-accent)] px-4 text-sm font-semibold text-white disabled:opacity-60">{loading ? 'Creating account...' : isInvitedRegistration ? 'Join workspace' : 'Create account'}{!loading && <ArrowRight size={16} />}</button>
          </form>
          <p className="mt-7 text-center text-sm text-[var(--os-text-secondary)]">Already have an account? <Link to="/login" className="font-semibold text-[var(--os-accent)]">Sign in</Link></p>
        </div></section>
      </div>
    </main>
  )
}
export default Register
