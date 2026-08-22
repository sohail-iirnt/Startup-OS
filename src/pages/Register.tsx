import {
  useEffect,
  useState,
  type FormEvent,
} from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { registerWithEmail } from '../services/authService'
import { useAuth } from '../context/useAuth'

function Register() {
  const navigate = useNavigate()

  const {
    user,
    loading: authLoading,
  } = useAuth()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [loading, setLoading] = useState(false)
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

    if (!name.trim()) {
      setError('Please enter your name.')
      return
    }

    if (!email.trim()) {
      setError('Please enter your email.')
      return
    }

    if (!password) {
      setError('Please enter a password.')
      return
    }

    if (password.length < 6) {
      setError(
        'Password must contain at least 6 characters.',
      )
      return
    }

    if (password !== confirmPassword) {
      setError(
        'Passwords do not match.',
      )
      return
    }

    try {
      setLoading(true)

      await registerWithEmail(
        name.trim(),
        email.trim(),
        password,
      )
    } catch (error) {
      console.error(error)

      const firebaseError =
        error as {
          code?: string
        }

      if (
        firebaseError.code ===
        'auth/email-already-in-use'
      ) {
        setError(
          'An account with this email already exists.',
        )
      } else if (
        firebaseError.code ===
        'auth/invalid-email'
      ) {
        setError(
          'Please enter a valid email address.',
        )
      } else if (
        firebaseError.code ===
        'auth/weak-password'
      ) {
        setError(
          'The password is too weak. Please choose a stronger password.',
        )
      } else {
        setError(
          'Unable to create your account. Please try again.',
        )
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <main>
      <section>
        <div>
          <h1>Create your account</h1>

          <p>
            Set up your Startup OS account.
          </p>
        </div>

        {error && (
          <div role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="name">
              Full name
            </label>

            <input
              id="name"
              type="text"
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              placeholder="Your name"
              autoComplete="name"
              disabled={
                loading || authLoading
              }
            />
          </div>

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
                loading || authLoading
              }
            />
          </div>

          <div>
            <label htmlFor="password">
              Password
            </label>

            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              placeholder="Create a password"
              autoComplete="new-password"
              disabled={
                loading || authLoading
              }
            />
          </div>

          <div>
            <label htmlFor="confirm-password">
              Confirm password
            </label>

            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(event) =>
                setConfirmPassword(
                  event.target.value,
                )
              }
              placeholder="Confirm your password"
              autoComplete="new-password"
              disabled={
                loading || authLoading
              }
            />
          </div>

          <button
            type="submit"
            disabled={
              loading || authLoading
            }
          >
            {loading
              ? 'Creating account...'
              : 'Create account'}
          </button>
        </form>

        <div>
          <span>
            Already have an account?
          </span>{' '}

          <Link to="/login">
            Sign in
          </Link>
        </div>
      </section>
    </main>
  )
}

export default Register