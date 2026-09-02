import { doc, onSnapshot } from 'firebase/firestore'
import { Menu, Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { db } from '../../lib/firebase'
import { useAuth } from '../../context/useAuth'
import { useWorkspace } from '../../context/useWorkspace'
import NotificationBell from '../notifications/NotificationBell'

type TopbarProps = { onMenuClick: () => void }

type ProfilePreview = { fullName?: string; photoUrl?: string; jobTitle?: string }

function Topbar({ onMenuClick }: TopbarProps) {
  const { user } = useAuth(); const { workspace, loading: workspaceLoading } = useWorkspace()
  const [profile, setProfile] = useState<ProfilePreview | null>(null)

  useEffect(() => {
    if (!user?.uid) return undefined
    return onSnapshot(doc(db, 'userProfiles', user.uid), snapshot => {
      if (!snapshot.exists()) { setProfile(null); return }
      const data = snapshot.data()
      setProfile({
        fullName: typeof data.fullName === 'string' ? data.fullName : '',
        photoUrl: typeof data.photoUrl === 'string' ? data.photoUrl : '',
        jobTitle: typeof data.jobTitle === 'string' ? data.jobTitle : '',
      })
    })
  }, [user?.uid])

  const displayName = profile?.fullName?.trim() || user?.displayName || user?.email?.split('@')[0] || 'User'
  const photoUrl = profile?.photoUrl?.trim() || user?.photoURL || ''
  const initials = displayName.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part.charAt(0).toUpperCase()).join('') || 'U'
  const workspaceName = workspaceLoading ? 'Loading workspace...' : workspace?.name || 'No workspace'
  const portalName = workspace?.portalName?.trim() || 'Startup OS'

  return <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-[var(--os-border)] bg-[rgba(8,9,12,0.82)] px-4 backdrop-blur-xl sm:px-6 lg:px-8"><div className="flex min-w-0 items-center gap-3"><button type="button" aria-label="Open navigation" onClick={onMenuClick} className="os-focus-ring flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[var(--os-text-secondary)] transition-colors hover:bg-[var(--os-surface-hover)] hover:text-[var(--os-text)] lg:hidden"><Menu size={20} /></button><div className="hidden min-w-0 items-center gap-2 text-sm sm:flex"><span className="shrink-0 text-[var(--os-text-muted)]">{portalName}</span><span className="text-[var(--os-text-muted)]">/</span><span className="max-w-[260px] truncate font-medium text-[var(--os-text-secondary)]">{workspaceName}</span></div></div><div className="flex items-center gap-2"><button type="button" aria-label="Search" className="os-focus-ring flex h-10 w-10 items-center justify-center rounded-xl text-[var(--os-text-secondary)] transition-colors hover:bg-[var(--os-surface-hover)] hover:text-[var(--os-text)]"><Search size={19} /></button><NotificationBell /><div className="ml-1 hidden h-9 w-px bg-[var(--os-border)] sm:block" /><Link to="/profile" aria-label="Open profile" className="ml-1 flex h-10 items-center gap-2 rounded-xl px-2 transition-colors hover:bg-[var(--os-surface-hover)]"><span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--os-accent-soft)] text-xs font-semibold text-[var(--os-accent)]">{photoUrl ? <img src={photoUrl} alt="Profile" className="h-full w-full object-cover" /> : initials}</span><span className="hidden max-w-[140px] truncate text-sm font-medium text-[var(--os-text)] md:block">{displayName}</span></Link></div></header>
}
export default Topbar