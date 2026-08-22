import {
  useEffect,
  useState,
  type FormEvent,
} from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { resetPassword } from '../services/authService'
import { useAuth } from '../context/useAuth'

function ForgotPassword() {
  const navigate = useNavigate()

  const {
    user,
    loading: authLoading,
  } = useAuth()

  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

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
    setSuccess('')

    if (!email.trim()) {
      setError('Please enter your email.')
      return
    }

    try {
      setLoading(true)

      await resetPassword(
        email.trim(),
      )

      setSuccess(
        'Password reset email sent. Please check your inbox.',
      )
    } catch (error) {
      console.error(error)

      const firebaseError =
        error as {
          code?: string
        }

      if (
        firebaseError.code ===
        'auth/user-not-found'
      ) {
        setError(
          'No account was found with this email address.',
        )
      } else if (
        firebaseError.code ===
        'auth/invalid-email'
      ) {
        setError(
          'Please enter a valid email address.',
        )
      } else {
        setError(
          'Unable to send the reset email. Please try again.',
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
          <h1>Reset your password</h1>

          <p>
            Enter your email and we will send you
            a password reset link.
          </p>
        </div>

        {error && (
          <div role="alert">
            {error}
          </div>
        )}

        {success && (
          <div role="status">
            {success}
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
                authLoading
              }
            />
          </div>

          <button
            type="submit"
            disabled={
              loading ||
              authLoading
            }
          >
            {loading
              ? 'Sending...'
              : 'Send reset link'}
          </button>
        </form>

        <div>
          <Link to="/login">
            Back to sign in
          </Link>
        </div>
      </section>
    </main>
  )
}

export default ForgotPassword