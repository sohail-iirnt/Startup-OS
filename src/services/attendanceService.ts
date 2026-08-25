import { collection, doc, getDoc, onSnapshot, query, serverTimestamp, setDoc, where, type Unsubscribe } from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { AttendanceRecord, AttendanceStatus } from '../types/attendance'

const COLLECTION = 'attendanceRecords'

function toDate(value: unknown): Date {
  if (value && typeof value === 'object' && 'toDate' in value && typeof (value as { toDate?: unknown }).toDate === 'function') return (value as { toDate: () => Date }).toDate()
  if (value instanceof Date) return value
  if (typeof value === 'string' || typeof value === 'number') return new Date(value)
  return new Date(0)
}

export function attendanceId(workspaceId: string, userId: string, date: string) {
  return `${workspaceId}_${userId}_${date}`
}

export function subscribeToAttendance(workspaceId: string, startDate: string, endDate: string, canManage: boolean, userId: string, onChange: (records: AttendanceRecord[]) => void, onError?: (error: Error) => void): Unsubscribe {
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
  }, error => onError?.(error))
}

export async function saveAttendance(input: { workspaceId: string; userId: string; date: string; status: AttendanceStatus; markedBy: string; checkIn?: Date; checkOut?: Date; note?: string }) {
  const id = attendanceId(input.workspaceId, input.userId, input.date)
  const ref = doc(db, COLLECTION, id)
  const existing = await getDoc(ref)
  await setDoc(ref, {
    workspaceId: input.workspaceId,
    userId: input.userId,
    date: input.date,
    status: input.status,
    markedBy: input.markedBy,
    ...(input.checkIn ? { checkIn: input.checkIn } : {}),
    ...(input.checkOut ? { checkOut: input.checkOut } : {}),
    note: input.note ?? '',
    updatedAt: serverTimestamp(),
    ...(existing.exists() ? {} : { createdAt: serverTimestamp() }),
  }, { merge: true })
}
