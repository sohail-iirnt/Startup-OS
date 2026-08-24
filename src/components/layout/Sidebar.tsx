import {
  useEffect,
  useRef,
  useState,
} from 'react'
import { NavLink } from 'react-router-dom'
import {
  ChevronDown,
  Check,
  Plus,
  Settings2,
  ShieldCheck,
} from 'lucide-react'

import { navigationSections } from '../../config/navigation'
import { useWorkspace } from '../../context/useWorkspace'
import { useAuth } from '../../context/useAuth'

type SidebarProps = {
  mobileOpen: boolean
  onClose: () => void
}

function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  const { workspace, member, loading, hasPermission } = useWorkspace()
  const { user } = useAuth()
  const [workspaceOpen, setWorkspaceOpen] = useState(false)
  const workspaceMenuRef = useRef<HTMLDivElement | null>(null)
  const canManageWorkspace = member?.role === 'owner' || member?.role === 'admin'

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (workspaceMenuRef.current && !workspaceMenuRef.current.contains(event.target as Node)) setWorkspaceOpen(false)
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setWorkspaceOpen(false)
    }
    if (workspaceOpen) {
      document.addEventListener('pointerdown', handlePointerDown)
      document.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [workspaceOpen])

  const workspaceInitials = workspace?.name?.split(' ').filter(Boolean).slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join('') || 'WS'
  const currentUserName = user?.displayName?.trim() || user?.email?.split('@')[0] || 'Workspace Member'
  const currentUserInitials = currentUserName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join('') || 'WM'
  const currentUserPosition = member?.designation?.trim() || (member?.role ? `${member.role.charAt(0).toUpperCase()}${member.role.slice(1)}` : 'Workspace Member')
  const portalName = workspace?.portalName?.trim() || 'Startup OS'
  const portalSubtitle = workspace?.portalSubtitle?.trim() || 'Founder Command Center'
  const workspaceMenuAvailable = canManageWorkspace

  function handleWorkspaceAction() {
    setWorkspaceOpen(false)
  }

  return (
    <>
      {mobileOpen && <button type="button" aria-label="Close navigation" onClick={onClose} className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden" />}
      <aside className={['fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col border-r border-[var(--os-border)] bg-[var(--os-surface)] transition-transform duration-300', mobileOpen ? 'translate-x-0' : '-translate-x-full', 'lg:static lg:z-auto lg:translate-x-0'].join(' ')}>
        <div className="border-b border-[var(--os-border)]">
          <div className="flex h-[76px] items-center px-6">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--os-accent)] text-sm font-bold text-white shadow-[0_0_25px_rgba(139,124,255,0.25)]">OS</div>
              <div className="min-w-0"><p className="truncate text-sm font-semibold tracking-tight text-[var(--os-text)]">{portalName}</p><p className="truncate text-[11px] text-[var(--os-text-muted)]">{portalSubtitle}</p></div>
            </div>
          </div>

          <div ref={workspaceMenuRef} className="relative px-3 pb-3">
            <button type="button" aria-haspopup={workspaceMenuAvailable ? 'menu' : undefined} aria-expanded={workspaceMenuAvailable ? workspaceOpen : undefined} disabled={loading || !workspace || !workspaceMenuAvailable} onClick={() => setWorkspaceOpen((current) => !current)} className={['group flex w-full items-center gap-3 rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] px-3 py-2.5 text-left transition-all duration-200', workspaceMenuAvailable ? 'hover:border-[var(--os-border-strong)] hover:bg-[var(--os-surface-hover)]' : 'cursor-default', 'disabled:opacity-70'].join(' ')}>
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--os-accent-soft)] text-xs font-bold text-[var(--os-accent)]">{loading ? '...' : workspaceInitials}</div>
              <div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold text-[var(--os-text)]">{loading ? 'Loading workspace...' : workspace?.name || 'No workspace'}</p><p className="mt-0.5 text-[10px] text-[var(--os-text-muted)]">Active workspace</p></div>
              {workspaceMenuAvailable && <ChevronDown size={15} className={['shrink-0 text-[var(--os-text-muted)] transition-transform duration-200', workspaceOpen ? 'rotate-180' : '', 'group-hover:text-[var(--os-text-secondary)]'].join(' ')} />}
            </button>

            {workspaceOpen && workspace && workspaceMenuAvailable && (
              <div role="menu" className="absolute left-3 right-3 top-[calc(100%-4px)] z-[70] overflow-hidden rounded-2xl border border-[var(--os-border-strong)] bg-[var(--os-surface-raised)] shadow-[var(--os-shadow-lg)]">
                <div className="border-b border-[var(--os-border)] p-3"><p className="px-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--os-text-muted)]">Workspace</p></div>
                <div className="p-2"><button type="button" role="menuitem" onClick={handleWorkspaceAction} className="flex w-full items-center gap-3 rounded-xl bg-[var(--os-accent-soft)] px-3 py-3 text-left"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--os-accent)] text-xs font-bold text-white">{workspaceInitials}</div><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold text-[var(--os-text)]">{workspace.name}</p><p className="mt-0.5 text-[10px] text-[var(--os-text-muted)]">Current workspace</p></div><Check size={16} className="shrink-0 text-[var(--os-accent)]" /></button></div>
                <div className="border-t border-[var(--os-border)] p-2">
                  {canManageWorkspace && <button type="button" role="menuitem" onClick={handleWorkspaceAction} className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-[var(--os-surface-hover)]"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-dashed border-[var(--os-border-strong)] text-[var(--os-text-muted)] transition-colors group-hover:border-[var(--os-accent)] group-hover:text-[var(--os-accent)]"><Plus size={15} /></span><span className="min-w-0"><span className="block text-xs font-medium text-[var(--os-text)]">Create workspace</span><span className="mt-0.5 block text-[10px] text-[var(--os-text-muted)]">Add another workspace</span></span></button>}
                  {canManageWorkspace && <NavLink to="/settings" role="menuitem" onClick={() => { handleWorkspaceAction(); onClose() }} className="group mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-[var(--os-surface-hover)]"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--os-surface-hover)] text-[var(--os-text-muted)] transition-colors group-hover:text-[var(--os-accent)]"><Settings2 size={15} /></span><span className="min-w-0"><span className="block text-xs font-medium text-[var(--os-text)]">Workspace settings</span><span className="mt-0.5 block text-[10px] text-[var(--os-text-muted)]">Manage workspace</span></span></NavLink>}
                </div>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-5"><div className="space-y-6">{navigationSections.map((section) => <div key={section.label}><p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--os-text-muted)]">{section.label}</p><div className="space-y-1">{section.items.map((item) => { if (item.permission && !hasPermission(item.permission)) return null; const Icon = item.icon; return <NavLink key={item.path} to={item.path} onClick={onClose} end={item.path === '/'} className={({ isActive }) => ['group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200', isActive ? 'bg-[var(--os-accent-soft)] text-[var(--os-text)]' : 'text-[var(--os-text-secondary)] hover:bg-[var(--os-surface-hover)] hover:text-[var(--os-text)]'].join(' ')}>{({ isActive }) => <><Icon size={17} strokeWidth={isActive ? 2.2 : 1.8} className={isActive ? 'text-[var(--os-accent)]' : 'text-[var(--os-text-muted)] transition-colors group-hover:text-[var(--os-text-secondary)]'} /><span className="truncate">{item.label}</span></>}</NavLink> })}{section.label === 'Operations' && hasPermission('members.approve') && <NavLink to="/team/approvals" onClick={onClose} className={({ isActive }) => ['group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200', isActive ? 'bg-[var(--os-accent-soft)] text-[var(--os-text)]' : 'text-[var(--os-text-secondary)] hover:bg-[var(--os-surface-hover)] hover:text-[var(--os-text)]'].join(' ')}>{({ isActive }) => <><ShieldCheck size={17} strokeWidth={isActive ? 2.2 : 1.8} className={isActive ? 'text-[var(--os-accent)]' : 'text-[var(--os-text-muted)] transition-colors group-hover:text-[var(--os-text-secondary)]'} /><span className="truncate">Member Approvals</span></>}</NavLink>}</div></div>)}</div></nav>

        <div className="border-t border-[var(--os-border)] p-3"><div className="rounded-xl bg-[var(--os-surface-raised)] p-2"><div className="flex items-center gap-3 px-2 py-2"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--os-accent-soft)] text-sm font-semibold text-[var(--os-accent)]">{currentUserInitials}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-[var(--os-text)]">{currentUserName}</p><p className="truncate text-xs text-[var(--os-text-muted)]">{user?.email || 'Workspace Member'}</p><p className="truncate text-[10px] font-medium text-[var(--os-accent)]">{currentUserPosition}</p></div></div><button type="button" onClick={async () => { try { const { logout } = await import('../../services/authService'); await logout() } catch (error) { console.error('Logout failed:', error) } }} className="mt-1 flex w-full items-center rounded-lg px-2 py-2 text-left text-xs font-medium text-[var(--os-text-secondary)] transition-colors hover:bg-[var(--os-surface-hover)] hover:text-[var(--os-danger)]">Sign out</button></div></div>
      </aside>
    </>
  )
}

export default Sidebar
