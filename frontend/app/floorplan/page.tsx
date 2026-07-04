"use client"

import React from "react"
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
    handleDeviceToggle,
  } = useDashboard()

  // Collapse sidebar by default on mobile
  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarCollapsed(true)
      }
    }
    handleResize() // run once on mount
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [setSidebarCollapsed])

  return (
    <div className="flex h-dvh bg-background text-foreground select-none">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
      />

      {/* Backdrop overlay for mobile drawer */}
      {!sidebarCollapsed && (
        <div
          onClick={() => setSidebarCollapsed(true)}
          className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm md:hidden"
        />
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <Header 
          activeAlertsCount={alerts.length} 
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        <main className="flex min-h-0 flex-1 flex-col p-6">
          <div className="flex-1 min-h-0 relative">
            <FloorplanViewer 
              devices={devices} 
              onDeviceToggle={handleDeviceToggle} 
            />
          </div>
        </main>
      </div>
    </div>
  )
}
