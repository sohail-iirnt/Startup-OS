import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import type { User } from 'firebase/auth'

import { db } from '../lib/firebase'
import type { UserProfile } from '../types/user'

const USERS_COLLECTION = 'users'

export async function getUserProfile(
  userId: string,
): Promise<UserProfile | null> {
  const userRef = doc(
    db,
    USERS_COLLECTION,
    userId,
  )

  const snapshot = await getDoc(userRef)

  if (!snapshot.exists()) {
    return null
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  } as UserProfile
}

export async function createUserProfile(
  user: User,
): Promise<UserProfile> {
  const userRef = doc(
    db,
    USERS_COLLECTION,
    user.uid,
  )

  const existingSnapshot =
    await getDoc(userRef)

  if (existingSnapshot.exists()) {
    return {
      id: existingSnapshot.id,
      ...existingSnapshot.data(),
    } as UserProfile
  }

  const profileData = {
    id: user.uid,
    displayName:
      user.displayName ||
      user.email?.split('@')[0] ||
      'User',
    email: user.email || '',
    photoURL: user.photoURL || null,
    defaultWorkspaceId: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }

  await setDoc(
    userRef,
    profileData,
  )

  const createdSnapshot =
    await getDoc(userRef)

  return {
    id: createdSnapshot.id,
    ...createdSnapshot.data(),
  } as UserProfile
}

export async function setDefaultWorkspace(
  userId: string,
  workspaceId: string,
): Promise<void> {
  const userRef = doc(
    db,
    USERS_COLLECTION,
    userId,
  )

  await updateDoc(userRef, {
    defaultWorkspaceId: workspaceId,
    updatedAt: serverTimestamp(),
  })
}