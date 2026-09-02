import { useEffect, useState, type FormEvent } from 'react'
import { ArrowLeft, ArrowRight, CheckCircle2, KeyRound, Mail, ShieldCheck, Sparkles } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

import { resetPassword } from '../services/authService'
import { useAuth } from '../context/useAuth'

function ForgotPassword() {
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()

  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!authLoading && user) {
      navigate('/', { replace: true })
    }
  }, [authLoading, user, navigate])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    if (!email.trim()) {
      setError('Please enter your email address.')
      return
    }

    try {
      setLoading(true)
      await resetPassword(email.trim())
      setSuccess(true)
    } catch (error) {
      console.error(error)
      const firebaseError = error as { code?: string }

      if (firebaseError.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.')
      } else if (firebaseError.code === 'auth/user-not-found') {
        setError('No account was found with this email address.')
      } else {
        setError('Unable to send the reset email. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const disabled = loading || authLoading

  return (
    <main className="min-h-screen bg-[var(--os-bg)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] w-full max-w-6xl overflow-hidden rounded-[28px] border border-[var(--os-border)] bg-[var(--os-surface)] shadow-[var(--os-shadow-lg)] lg:grid-cols-[0.95fr_1.05fr]">
        <section className="relative hidden overflow-hidden border-r border-[var(--os-border)] bg-[var(--os-surface-raised)] p-10 lg:flex lg:flex-col lg:justify-between xl:p-14">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[var(--os-accent)] opacity-[0.08] blur-3xl" />
          <div className="absolute -bottom-28 -left-20 h-80 w-80 rounded-full bg-[var(--os-info)] opacity-[0.05] blur-3xl" />

          <div className="relative">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--os-accent-border)] bg-[var(--os-accent-soft)] text-[var(--os-accent)]">
              <Sparkles size={20} />
            </div>
            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--os-accent)]">Startup OS</p>
            <h2 className="mt-4 max-w-md text-4xl font-semibold leading-tight tracking-tight text-[var(--os-text)] xl:text-5xl">
              Get back into your command center.
            </h2>
            <p className="mt-5 max-w-lg text-sm leading-7 text-[var(--os-text-secondary)]">
              Securely reset your password and return to the workspace where you manage your company.
            </p>
          </div>

          <div className="relative space-y-3">
            {[
              'Secure password recovery',
              'Reset link delivered to your email',
              'Return to your founder workspace',
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 text-sm text-[var(--os-text-secondary)]">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--os-success-soft)] text-[var(--os-success)]">
                  <ShieldCheck size={15} />
                </span>
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="flex items-center justify-center p-6 sm:p-10 lg:p-12 xl:p-16">
          <div className="w-full max-w-md">
            <div className="mb-8 lg:hidden">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--os-accent-soft)] text-[var(--os-accent)]">
                <Sparkles size={19} />
              </div>
              <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--os-accent)]">Startup OS</p>
            </div>

            {!success ? (
              <>
                <Link to="/login" className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-[var(--os-text-secondary)] transition-colors hover:text-[var(--os-text)]">
                  <ArrowLeft size={16} />
                  Back to sign in
                </Link>

                <div>
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--os-accent-border)] bg-[var(--os-accent-soft)] text-[var(--os-accent)]">
                    <KeyRound size={19} />
                  </div>
                  <p className="mt-5 text-sm font-medium text-[var(--os-accent)]">Account recovery</p>
                  <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--os-text)] sm:text-4xl">Forgot your password?</h1>
                  <p className="mt-3 text-sm leading-6 text-[var(--os-text-secondary)]">
                    Enter the email connected to your Startup OS account and we&apos;ll send you a secure reset link.
                  </p>
                </div>

                {error && (
                  <div role="alert" className="mt-6 rounded-xl border border-[rgba(255,100,124,0.25)] bg-[var(--os-danger-soft)] px-4 py-3 text-sm leading-5 text-[var(--os-danger)]">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="mt-7 space-y-5">
                  <div>
                    <label htmlFor="email" className="mb-2 block text-xs font-semibold uppercase tracking-[0.1em] text-[var(--os-text-secondary)]">Email address</label>
                    <div className="relative">
                      <Mail size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--os-text-muted)]" />
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="you@example.com"
                        autoComplete="email"
                        disabled={disabled}
                        autoFocus
                        className="os-focus-ring h-12 w-full rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] pl-11 pr-4 text-sm text-[var(--os-text)] transition-colors placeholder:text-[var(--os-text-muted)] hover:border-[var(--os-border-strong)] focus:border-[var(--os-accent-border)]"
                      />
                    </div>
                  </div>

                  <button type="submit" disabled={disabled} className="os-focus-ring flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--os-accent)] px-4 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(139,124,255,0.2)] transition-all hover:bg-[var(--os-accent-hover)] hover:shadow-[0_14px_36px_rgba(139,124,255,0.25)] disabled:opacity-60">
                    {loading ? 'Sending reset link...' : 'Send reset link'}
                    {!loading && <ArrowRight size={16} />}
                  </button>
                </form>

                <p className="mt-7 text-center text-sm text-[var(--os-text-secondary)]">
                  Remembered your password?{' '}
                  <Link to="/login" className="font-semibold text-[var(--os-accent)] hover:text-[var(--os-accent-hover)]">Sign in</Link>
                </p>
              </>
            ) : (
              <div className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--os-success-soft)] text-[var(--os-success)]">
                  <CheckCircle2 size={27} />
                </div>
                <p className="mt-6 text-sm font-medium text-[var(--os-accent)]">Check your inbox</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--os-text)] sm:text-4xl">Reset link sent</h1>
                <p className="mx-auto mt-4 max-w-sm text-sm leading-6 text-[var(--os-text-secondary)]">
                  We sent password recovery instructions to your email address. Open the email and follow the link to choose a new password.
                </p>
                <div className="mt-6 rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] px-4 py-3 text-sm text-[var(--os-text-secondary)]">
                  Didn&apos;t receive it? Check your spam folder or try again.
                </div>
                <button type="button" onClick={() => setSuccess(false)} className="os-focus-ring mt-6 h-11 rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] px-5 text-sm font-semibold text-[var(--os-text)] transition-colors hover:border-[var(--os-border-strong)] hover:bg-[var(--os-surface-hover)]">
                  Try another email
                </button>
                <div className="mt-5">
                  <Link to="/login" className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--os-accent)] hover:text-[var(--os-accent-hover)]">
                    <ArrowLeft size={15} />
                    Back to sign in
                  </Link>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}

export default ForgotPassword