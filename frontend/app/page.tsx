"use client"

import { Header } from "@/components/dashboard/Header"
import { Sidebar } from "@/components/dashboard/Sidebar"
import { PowerMeter } from "@/components/dashboard/PowerMeter"
import { AlertsPanel } from "@/components/dashboard/AlertsPanel"
import { DeviceGrid } from "@/components/dashboard/DeviceGrid"
import { FloorplanViewer } from "@/components/dashboard/FloorplanViewer"
import { SimulationHud } from "@/components/dashboard/SimulationHud"
import { useDashboard } from "@/hooks/useDashboard"

export default function Page() {
  const {
    devices,
    activeTab,
    setActiveTab,
    isNightMode,
    setIsNightMode,
    sidebarCollapsed,
    setSidebarCollapsed,
    handleDeviceToggle,
    roomPowers,
    totalPower,
    alerts,
  } = useDashboard()

  return (
    <div className="flex h-dvh bg-background text-foreground select-none">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header activeAlertsCount={alerts.length} />

        <main className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-6">
          <div className="grid shrink-0 grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <PowerMeter totalPower={totalPower} roomPowers={roomPowers} />
            </div>
            <div>
              <AlertsPanel alerts={alerts} />
            </div>
          </div>

          <SimulationHud
            isNightMode={isNightMode}
            onToggle={() => setIsNightMode((p) => !p)}
          />

          <div className="flex-1">
            {activeTab === "grid" ? (
              <DeviceGrid
                devices={devices}
                onDeviceToggle={handleDeviceToggle}
              />
            ) : (
              <FloorplanViewer devices={devices} />
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
