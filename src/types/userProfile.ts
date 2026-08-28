export type UserProfile = {
  uid: string
  fullName: string
  email: string
  mobileNumber: string
  jobTitle: string
  department: string
  bio: string
  location: string
  linkedin: string
  github: string
  website: string
  skills: string[]
  photoUrl: string
  updatedAt?: Date
}

export type UserProfileInput = Omit<UserProfile, 'uid' | 'updatedAt'>
