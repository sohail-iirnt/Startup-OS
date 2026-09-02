import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'

import Sidebar from './Sidebar'
import Topbar from './Topbar'
import { useWorkspace } from '../../context/useWorkspace'

function AppShell() {
  const [mobileOpen, setMobileOpen] =
    useState(false)
  const { workspace } = useWorkspace()

  useEffect(() => {
    document.title = workspace?.portalName?.trim() || 'Startup OS'
  }, [workspace?.portalName])

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--os-bg)]">
      <Sidebar
        mobileOpen={mobileOpen}
        onClose={() =>
          setMobileOpen(false)
        }
      />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar
          onMenuClick={() =>
            setMobileOpen(true)
          }
        />

        <main className="min-h-0 min-w-0 flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AppShell