import {
  useEffect,
  useState,
  type FormEvent,
} from 'react'
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import {
  Link,
  useNavigate,
} from 'react-router-dom'

import {
  loginWithEmail,
  loginWithGoogle,
} from '../services/authService'
import { useAuth } from '../context/useAuth'

function Login() {
  const navigate = useNavigate()

  const {
    user,
    loading: authLoading,
  } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!authLoading && user) {
      navigate('/', { replace: true })
    }
  }, [authLoading, user, navigate])

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()
    setError('')

    if (!email.trim()) {
      setError('Please enter your email address.')
      return
    }

    if (!password) {
      setError('Please enter your password.')
      return
    }

    try {
      setLoading(true)
      await loginWithEmail(email.trim(), password)
    } catch (error) {
      console.error(error)
      setError(
        'Unable to sign in. Please check your email and password.',
      )
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogleLogin() {
    setError('')

    try {
      setGoogleLoading(true)
      await loginWithGoogle()
    } catch (error) {
      console.error(error)
      setError(
        'Google sign-in was not completed. Please try again.',
      )
    } finally {
      setGoogleLoading(false)
    }
  }

  const disabled =
    loading || googleLoading || authLoading

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
            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--os-accent)]">
              Startup OS
            </p>
            <h2 className="mt-4 max-w-md text-4xl font-semibold leading-tight tracking-tight text-[var(--os-text)] xl:text-5xl">
              Run your company from one command center.
            </h2>
            <p className="mt-5 max-w-lg text-sm leading-7 text-[var(--os-text-secondary)]">
              Manage projects, people, clients, tasks and business operations from a focused founder-first workspace.
            </p>
          </div>

          <div className="relative space-y-3">
            {[
              'One workspace for your entire operation',
              'Real-time team and project visibility',
              'Built for focused, secure execution',
            ].map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 text-sm text-[var(--os-text-secondary)]"
              >
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
              <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--os-accent)]">
                Startup OS
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-[var(--os-accent)]">
                Founder workspace
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--os-text)] sm:text-4xl">
                Welcome back
              </h1>
              <p className="mt-3 text-sm leading-6 text-[var(--os-text-secondary)]">
                Sign in to continue managing your Startup OS workspace.
              </p>
            </div>

            {error && (
              <div
                role="alert"
                className="mt-6 rounded-xl border border-[rgba(255,100,124,0.25)] bg-[var(--os-danger-soft)] px-4 py-3 text-sm leading-5 text-[var(--os-danger)]"
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-7 space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-xs font-semibold uppercase tracking-[0.1em] text-[var(--os-text-secondary)]"
                >
                  Email address
                </label>
                <div className="relative">
                  <Mail
                    size={17}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--os-text-muted)]"
                  />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    disabled={disabled}
                    className="os-focus-ring h-12 w-full rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] pl-11 pr-4 text-sm text-[var(--os-text)] transition-colors placeholder:text-[var(--os-text-muted)] hover:border-[var(--os-border-strong)] focus:border-[var(--os-accent-border)]"
                  />
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label
                    htmlFor="password"
                    className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--os-text-secondary)]"
                  >
                    Password
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-xs font-medium text-[var(--os-accent)] transition-colors hover:text-[var(--os-accent-hover)]"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <LockKeyhole
                    size={17}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--os-text-muted)]"
                  />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    disabled={disabled}
                    className="os-focus-ring h-12 w-full rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] pl-11 pr-12 text-sm text-[var(--os-text)] transition-colors placeholder:text-[var(--os-text-muted)] hover:border-[var(--os-border-strong)] focus:border-[var(--os-accent-border)]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    disabled={disabled}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-[var(--os-text-muted)] transition-colors hover:bg-[var(--os-surface-hover)] hover:text-[var(--os-text)]"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={disabled}
                className="os-focus-ring flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--os-accent)] px-4 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(139,124,255,0.2)] transition-all hover:bg-[var(--os-accent-hover)] hover:shadow-[0_14px_36px_rgba(139,124,255,0.25)] disabled:opacity-60"
              >
                {loading ? 'Signing in...' : 'Sign in'}
                {!loading && <ArrowRight size={16} />}
              </button>
            </form>

            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-[var(--os-border)]" />
              <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--os-text-muted)]">
                or
              </span>
              <div className="h-px flex-1 bg-[var(--os-border)]" />
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={disabled}
              className="os-focus-ring flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] px-4 text-sm font-semibold text-[var(--os-text)] transition-all hover:border-[var(--os-border-strong)] hover:bg-[var(--os-surface-hover)] disabled:opacity-60"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-white text-xs font-bold text-[#4285F4]">
                G
              </span>
              {googleLoading ? 'Connecting to Google...' : 'Continue with Google'}
            </button>

            <p className="mt-7 text-center text-sm text-[var(--os-text-secondary)]">
              New to Startup OS?{' '}
              <Link
                to="/register"
                className="font-semibold text-[var(--os-accent)] hover:text-[var(--os-accent-hover)]"
              >
                Create an account
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}

export default Login