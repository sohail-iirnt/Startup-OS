import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth'

import { auth } from '../lib/firebase'

const googleProvider = new GoogleAuthProvider()

export async function registerWithEmail(
  name: string,
  email: string,
  password: string,
) {
  const credential = await createUserWithEmailAndPassword(
    auth,
    email,
    password,
  )

  if (name.trim()) {
    await updateProfile(credential.user, {
      displayName: name.trim(),
    })
  }

  return credential.user
}

export async function loginWithEmail(
  email: string,
  password: string,
) {
  const credential = await signInWithEmailAndPassword(
    auth,
    email,
    password,
  )

  return credential.user
}

export async function loginWithGoogle() {
  const credential = await signInWithPopup(
    auth,
    googleProvider,
  )

  return credential.user
}

export async function logout() {
  await signOut(auth)
}

export async function resetPassword(email: string) {
  await sendPasswordResetEmail(auth, email)
}