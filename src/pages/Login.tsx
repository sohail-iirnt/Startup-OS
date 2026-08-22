import {
  useEffect,
  useState,
  type FormEvent,
} from 'react'
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

  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const [error, setError] = useState('')

  useEffect(() => {
    if (!authLoading && user) {
      navigate('/', {
        replace: true,
      })
    }
  }, [
    authLoading,
    user,
    navigate,
  ])

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    setError('')

    if (!email.trim()) {
      setError('Please enter your email.')
      return
    }

    if (!password) {
      setError('Please enter your password.')
      return
    }

    try {
      setLoading(true)

      await loginWithEmail(
        email.trim(),
        password,
      )
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

  return (
    <main>
      <section>
        <div>
          <h1>Welcome back</h1>

          <p>
            Sign in to continue to Startup OS.
          </p>
        </div>

        {error && (
          <div role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email">
              Email
            </label>

            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              placeholder="you@example.com"
              autoComplete="email"
              disabled={
                loading ||
                googleLoading ||
                authLoading
              }
            />
          </div>

          <div>
			<div>
				<label htmlFor="password">
				Password
				</label>

				<Link to="/forgot-password">
				Forgot password?
				</Link>
			</div>

            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              placeholder="Enter your password"
              autoComplete="current-password"
              disabled={
                loading ||
                googleLoading ||
                authLoading
              }
            />
          </div>

          <button
            type="submit"
            disabled={
              loading ||
              googleLoading ||
              authLoading
            }
          >
            {loading
              ? 'Signing in...'
              : 'Sign in'}
          </button>
        </form>

        <div>
          <span>or</span>
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={
            loading ||
            googleLoading ||
            authLoading
          }
        >
          {googleLoading
            ? 'Connecting to Google...'
            : 'Continue with Google'}
        </button>
      </section>
    </main>
  )
}

export default Login