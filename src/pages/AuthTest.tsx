import { useAuth } from '../context/useAuth'

function AuthTest() {
  const {
    user,
    loading,
    isAuthenticated,
  } = useAuth()

  if (loading) {
    return (
      <div>
        <h1>Authentication Test</h1>
        <p>Checking authentication state...</p>
      </div>
    )
  }

  return (
    <div>
      <h1>Authentication Test</h1>

      <p>
        Status:{' '}
        {isAuthenticated
          ? 'Authenticated'
          : 'Not authenticated'}
      </p>

      {isAuthenticated && user ? (
        <div>
          <p>
            <strong>UID:</strong> {user.uid}
          </p>

          <p>
            <strong>Email:</strong>{' '}
            {user.email ?? 'No email'}
          </p>

          <p>
            <strong>Name:</strong>{' '}
            {user.displayName ?? 'No display name'}
          </p>

          <p>
            <strong>Provider:</strong>{' '}
            {user.providerData[0]?.providerId ??
              'Unknown'}
          </p>
        </div>
      ) : (
        <p>
          No Firebase user is currently signed in.
        </p>
      )}
    </div>
  )
}

export default AuthTest