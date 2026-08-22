import { useState } from 'react'
import { Outlet } from 'react-router-dom'

import Sidebar from './Sidebar'
import Topbar from './Topbar'

function AppShell() {
  const [mobileOpen, setMobileOpen] =
    useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--os-bg)]">
      {/* Sidebar */}
      <Sidebar
        mobileOpen={mobileOpen}
        onClose={() =>
          setMobileOpen(false)
        }
      />

      {/* Main Application */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Persistent Topbar */}
        <Topbar
          onMenuClick={() =>
            setMobileOpen(true)
          }
        />

        {/* Scrollable Content */}
        <main className="min-h-0 min-w-0 flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AppShell