"use client"

import { useState, useMemo, useCallback } from "react"
import { initialDevices, type Device } from "@/lib/initialDevices"

export interface AlertItem {
  id: string
  type: "warning" | "critical"
  message: string
  timestamp: string
}

export interface RoomPowers {
  drawingRoom: number
  workRoom1: number
  workRoom2: number
}

const roomNameMap: Record<string, string> = {
  drawingRoom: "Drawing Room",
  workRoom1: "Work Room 1",
  workRoom2: "Work Room 2",
}

export function useDashboard() {
  const [devices, setDevices] = useState<Device[]>(initialDevices)
  const [activeTab, setActiveTab] = useState<"grid" | "floorplan">("grid")
  const [isNightMode, setIsNightMode] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const handleDeviceToggle = useCallback((id: string) => {
    setDevices((prev) =>
      prev.map((d) => (d.id === id ? { ...d, checked: !d.checked } : d))
    )
  }, [])

  const roomPowers: RoomPowers = useMemo(
    () => ({
      drawingRoom: devices
        .filter((d) => d.room === "drawingRoom" && d.checked)
        .reduce((sum, d) => sum + d.wattage, 0),
      workRoom1: devices
        .filter((d) => d.room === "workRoom1" && d.checked)
        .reduce((sum, d) => sum + d.wattage, 0),
      workRoom2: devices
        .filter((d) => d.room === "workRoom2" && d.checked)
        .reduce((sum, d) => sum + d.wattage, 0),
    }),
    [devices]
  )

  const totalPower =
    roomPowers.drawingRoom + roomPowers.workRoom1 + roomPowers.workRoom2

  const alerts: AlertItem[] = useMemo(() => {
    const result: AlertItem[] = []

    if (isNightMode) {
      for (const d of devices) {
        if (d.checked) {
          result.push({
            id: `after-hours-${d.id}`,
            type: "warning",
            message: `${roomNameMap[d.room]}: ${d.name} (${d.type.toUpperCase()}) left ON after office hours (9:00 PM)`,
            timestamp: "21:00:15",
          })
        }
      }
    }

    for (const roomKey of ["drawingRoom", "workRoom1", "workRoom2"] as const) {
      const roomDevices = devices.filter((d) => d.room === roomKey)
      if (roomDevices.every((d) => d.checked)) {
        result.push({
          id: `continuous-run-${roomKey}`,
          type: "critical",
          message: `${roomNameMap[roomKey]}: All 5 devices active continuously for over 2 hours. High load warning.`,
          timestamp: "14:15:00",
        })
      }
    }

    return result
  }, [devices, isNightMode])

  return {
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
  }
}
