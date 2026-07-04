"use client"

import React from "react"
import { Header } from "@/components/dashboard/Header"
import { Sidebar } from "@/components/dashboard/Sidebar"
import { PowerMeter } from "@/components/dashboard/PowerMeter"
import { AlertsPanel } from "@/components/dashboard/AlertsPanel"
import { DeviceGrid } from "@/components/dashboard/DeviceGrid"
import { SimulationHud } from "@/components/dashboard/SimulationHud"
import { useDashboard } from "@/context/DashboardContext"

export default function Page() {
  const {
    devices,
    isNightMode,
    setIsNightMode,
    sidebarCollapsed,
    setSidebarCollapsed,
    handleDeviceToggle,
    handleRoomShutdown,
    roomPowers,
    totalPower,
    alerts,
    usage,
    powerHistory,
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

        <main className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-6">
          <div className="grid shrink-0 grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <PowerMeter
                totalPower={totalPower}
                roomPowers={roomPowers}
                usage={usage}
                powerHistory={powerHistory}
              />
            </div>
            <div>
              <AlertsPanel
                alerts={alerts}
                devices={devices}
                onDeviceToggle={handleDeviceToggle}
                onRoomShutdown={handleRoomShutdown}
              />
            </div>
          </div>

          <SimulationHud
            isNightMode={isNightMode}
            onToggle={setIsNightMode}
          />

          <div className="flex-1">
            <DeviceGrid
              devices={devices}
              onDeviceToggle={handleDeviceToggle}
            />
          </div>
        </main>
      </div>
    </div>
  )
}
