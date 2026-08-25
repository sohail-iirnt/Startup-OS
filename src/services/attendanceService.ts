import { collection, doc, getDoc, onSnapshot, query, serverTimestamp, setDoc, where, type Unsubscribe } from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { AttendanceRecord, AttendanceStatus } from '../types/attendance'

const COLLECTION = 'attendanceRecords'
const VALID_STATUSES: readonly AttendanceStatus[] = ['present', 'late', 'half-day', 'absent', 'leave']

function toDate(value: unknown): Date {
  if (value && typeof value === 'object' && 'toDate' in value && typeof (value as { toDate?: unknown }).toDate === 'function') return (value as { toDate: () => Date }).toDate()
  if (value instanceof Date) return value
  if (typeof value === 'string' || typeof value === 'number') return new Date(value)
  return new Date(0)
}

function assertDateKey(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('Attendance date must use YYYY-MM-DD format.')
}

export function attendanceId(workspaceId: string, userId: string, date: string) {
  return `${workspaceId}_${userId}_${date}`
}

export function subscribeToAttendance(workspaceId: string, startDate: string, endDate: string, canManage: boolean, userId: string, onChange: (records: AttendanceRecord[]) => void, onError?: (error: Error) => void): Unsubscribe {
  if (!workspaceId || !userId) return () => undefined
  const constraints = [where('workspaceId', '==', workspaceId), where('date', '>=', startDate), where('date', '<=', endDate)]
  if (!canManage) constraints.push(where('userId', '==', userId))
  const ref = query(collection(db, COLLECTION), ...constraints)
  return onSnapshot(ref, snapshot => {
    const records = snapshot.docs.map(item => {
      const data = item.data()
      return {
        id: item.id,
        workspaceId: String(data.workspaceId ?? workspaceId),
        userId: String(data.userId ?? ''),
        date: String(data.date ?? ''),
        status: String(data.status ?? 'present') as AttendanceStatus,
        checkIn: data.checkIn ? toDate(data.checkIn) : undefined,
        checkOut: data.checkOut ? toDate(data.checkOut) : undefined,
        note: data.note ? String(data.note) : undefined,
        markedBy: String(data.markedBy ?? ''),
        createdAt: toDate(data.createdAt),
        updatedAt: toDate(data.updatedAt),
      }
    })
    records.sort((a, b) => `${b.date}${b.userId}`.localeCompare(`${a.date}${a.userId}`))
    onChange(records)
  }, error => onError?.(error instanceof Error ? error : new Error('Unable to load attendance records.')))
}

export async function saveAttendance(input: { workspaceId: string; userId: string; date: string; status: AttendanceStatus; markedBy: string; checkIn?: Date; checkOut?: Date; note?: string }) {
  const workspaceId = input.workspaceId.trim()
  const userId = input.userId.trim()
  const markedBy = input.markedBy.trim()
  const date = input.date.trim()
  if (!workspaceId) throw new Error('Workspace is required.')
  if (!userId) throw new Error('Attendance member is required.')
  if (!markedBy) throw new Error('Attendance marker is required.')
  assertDateKey(date)
  if (!VALID_STATUSES.includes(input.status)) throw new Error('Invalid attendance status.')
  if (input.checkOut && input.checkIn && input.checkOut.getTime() < input.checkIn.getTime()) throw new Error('Check-out cannot be earlier than check-in.')

  const id = attendanceId(workspaceId, userId, date)
  const ref = doc(db, COLLECTION, id)
  const existing = await getDoc(ref)
  await setDoc(ref, {
    workspaceId,
    userId,
    date,
    status: input.status,
    markedBy,
    ...(input.checkIn ? { checkIn: input.checkIn } : {}),
    ...(input.checkOut ? { checkOut: input.checkOut } : {}),
    note: input.note?.trim() ?? '',
    updatedAt: serverTimestamp(),
    ...(existing.exists() ? {} : { createdAt: serverTimestamp() }),
  }, { merge: true })
}
