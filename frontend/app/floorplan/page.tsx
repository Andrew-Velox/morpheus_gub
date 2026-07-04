"use client"

import { Header } from "@/components/dashboard/Header"
import { Sidebar } from "@/components/dashboard/Sidebar"
import { FloorplanViewer } from "@/components/dashboard/FloorplanViewer"
import { useDashboard } from "@/context/DashboardContext"

export default function FloorplanPage() {
  const {
    devices,
    sidebarCollapsed,
    setSidebarCollapsed,
    alerts,
  } = useDashboard()

  return (
    <div className="flex h-dvh bg-background text-foreground select-none">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header activeAlertsCount={alerts.length} />

        <main className="flex min-h-0 flex-1 flex-col p-6">
          <div className="flex-1 min-h-0 relative">
            <FloorplanViewer devices={devices} />
          </div>
        </main>
      </div>
    </div>
  )
}
