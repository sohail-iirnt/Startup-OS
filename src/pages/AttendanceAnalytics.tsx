import { BarChart3, ShieldCheck } from 'lucide-react'
import Card from '../components/ui/Card'
import AttendanceAnalyticsPanel from '../components/analytics/AttendanceAnalyticsPanel'
import { useWorkspace } from '../context/useWorkspace'

export default function AttendanceAnalytics() {
  const { hasPermission } = useWorkspace()
  if (!hasPermission('attendance.view')) return <div className="mx-auto max-w-[1200px] p-6"><Card className="p-10 text-center text-sm text-[var(--os-text-secondary)]"><ShieldCheck size={28} className="mx-auto mb-3 text-[var(--os-text-muted)]" />You do not have permission to view attendance analytics.</Card></div>
  return <div className="mx-auto w-full max-w-[1400px] p-4 sm:p-6 lg:p-8"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--os-accent)]">People intelligence</p><div className="mt-1 flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--os-accent-soft)] text-[var(--os-accent)]"><BarChart3 size={19} /></span><div><h1 className="text-3xl font-semibold tracking-tight text-[var(--os-text)]">Attendance Analytics</h1><p className="mt-1 text-sm text-[var(--os-text-secondary)]">Punctuality, work time, check-in/out health, leave usage and recent attendance trends.</p></div></div></div><div className="mt-6"><AttendanceAnalyticsPanel /></div></div>
}