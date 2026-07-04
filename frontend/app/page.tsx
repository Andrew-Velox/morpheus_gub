"use client"

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
    roomPowers,
    totalPower,
    alerts,
    usage,
    powerHistory,
  } = useDashboard()

  return (
    <div className="flex h-dvh bg-background text-foreground select-none">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header activeAlertsCount={alerts.length} />

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
              <AlertsPanel alerts={alerts} />
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
