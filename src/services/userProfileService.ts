import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { db, storage } from '../lib/firebase'
import type { UserProfile, UserProfileInput } from '../types/userProfile'

const COLLECTION = 'userProfiles'

function toDate(value: unknown): Date | undefined {
  if (value && typeof value === 'object' && 'toDate' in value && typeof (value as { toDate?: unknown }).toDate === 'function') return (value as { toDate: () => Date }).toDate()
  if (value instanceof Date) return value
  return undefined
}

function clean(input: UserProfileInput): UserProfileInput {
  return { ...input, fullName: input.fullName.trim(), email: input.email.trim(), mobileNumber: input.mobileNumber.trim(), jobTitle: input.jobTitle.trim(), department: input.department.trim(), bio: input.bio.trim(), location: input.location.trim(), linkedin: input.linkedin.trim(), github: input.github.trim(), website: input.website.trim(), skills: input.skills.map(item => item.trim()).filter(Boolean), photoUrl: input.photoUrl.trim() }
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snapshot = await getDoc(doc(db, COLLECTION, uid))
  if (!snapshot.exists()) return null
  const data = snapshot.data() as Record<string, unknown>
  return { uid, fullName: String(data.fullName ?? ''), email: String(data.email ?? ''), mobileNumber: String(data.mobileNumber ?? ''), jobTitle: String(data.jobTitle ?? ''), department: String(data.department ?? ''), bio: String(data.bio ?? ''), location: String(data.location ?? ''), linkedin: String(data.linkedin ?? ''), github: String(data.github ?? ''), website: String(data.website ?? ''), skills: Array.isArray(data.skills) ? data.skills.map(String) : [], photoUrl: String(data.photoUrl ?? ''), updatedAt: toDate(data.updatedAt) }
}

export async function saveUserProfile(uid: string, input: UserProfileInput) {
  if (!uid) throw new Error('User account is required.')
  const value = clean(input)
  if (!value.fullName) throw new Error('Full name is required.')
  await setDoc(doc(db, COLLECTION, uid), { ...value, updatedAt: serverTimestamp() }, { merge: true })
  return getUserProfile(uid)
}

export async function uploadProfilePhoto(uid: string, file: File) {
  if (!uid) throw new Error('User account is required.')
  if (!storage) throw new Error('Firebase Storage is not configured. Add VITE_FIREBASE_STORAGE_BUCKET to your local environment and restart the dev server.')
  if (!file.type.startsWith('image/')) throw new Error('Please choose an image file.')
  if (file.size > 5 * 1024 * 1024) throw new Error('Profile image must be 5 MB or smaller.')
  const storageRef = ref(storage, `userProfiles/${uid}/profile-${Date.now()}`)
  await uploadBytes(storageRef, file, { contentType: file.type, cacheControl: 'public,max-age=3600' })
  const url = await getDownloadURL(storageRef)
  await setDoc(doc(db, COLLECTION, uid), { photoUrl: url, updatedAt: serverTimestamp() }, { merge: true })
  return url
}

export async function removeProfilePhoto(uid: string, photoUrl?: string) {
  if (!uid) throw new Error('User account is required.')
  if (storage && photoUrl) {
    try { await deleteObject(ref(storage, photoUrl)) } catch { /* old or externally stored URL; Firestore cleanup still proceeds */ }
  }
  await setDoc(doc(db, COLLECTION, uid), { photoUrl: '', updatedAt: serverTimestamp() }, { merge: true })
}
