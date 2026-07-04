"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
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

const API_BASE = "http://localhost:4000"
const WS_BASE = "ws://localhost:4000"

const mapBackendRoomToFrontend = (roomId: string): "drawingRoom" | "workRoom1" | "workRoom2" => {
  if (roomId === "work_room_1") return "workRoom1"
  if (roomId === "work_room_2") return "workRoom2"
  return "drawingRoom"
}

export function useDashboard() {
  const [devices, setDevices] = useState<Device[]>(initialDevices)
  const [activeTab, setActiveTab] = useState<"grid" | "floorplan">("grid")
  const [isNightMode, setIsNightMode] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [alerts, setAlerts] = useState<AlertItem[]>([])
  const [usage, setUsage] = useState<{
    totalKwh: number
    estimatedCostBdt: number
    tariffRate: number
  }>({ totalKwh: 0, estimatedCostBdt: 0, tariffRate: 12 })
  const [powerHistory, setPowerHistory] = useState<{ time: string; value: number }[]>([])

  const handleDeviceToggle = useCallback(async (id: string) => {
    // Optimistic update
    setDevices((prev) =>
      prev.map((d) => (d.id === id ? { ...d, checked: !d.checked } : d))
    )

    try {
      await fetch(`${API_BASE}/api/simulator/toggle/${id}`, {
        method: "POST",
      })
    } catch (error) {
      console.error("Failed to toggle device:", error)
    }
  }, [])

  // Sync with backend
  useEffect(() => {
    let ws: WebSocket
    let reconnectTimeout: NodeJS.Timeout

    const processSnapshot = (snapshot: any) => {
      if (!snapshot) return

      // Map devices
      const backendDevices: any[] = []
      if (snapshot.rooms) {
        Object.keys(snapshot.rooms).forEach((roomName) => {
          backendDevices.push(...snapshot.rooms[roomName])
        })
      }

      if (backendDevices.length > 0) {
        const mappedDevices: Device[] = backendDevices.map((d: any) => ({
          id: d.id,
          name: d.name,
          type: d.type as "fan" | "light",
          room: mapBackendRoomToFrontend(d.roomId || d.room_id),
          checked: d.status,
          wattage: d.ratedWattage || d.rated_wattage || 0,
        }))
        setDevices(mappedDevices)
      }

      // Map alerts
      if (Array.isArray(snapshot.alerts)) {
        const mappedAlerts: AlertItem[] = snapshot.alerts.map((alert: any) => {
          let timeStr = "00:00:00"
          try {
            if (alert.timestamp) {
              const d = new Date(alert.timestamp)
              timeStr = d.toTimeString().split(" ")[0]
            }
          } catch (e) {
            console.error("Error parsing alert timestamp:", e)
          }

          return {
            id: alert.id || alert.key,
            type: alert.severity === "critical" ? "critical" : "warning",
            message: alert.message,
            timestamp: timeStr,
          }
        })
        setAlerts(mappedAlerts)
      }

      // Map isNightMode from clock
      if (snapshot.clock && snapshot.clock.now) {
        try {
          const now = new Date(snapshot.clock.now)
          const hourStr = new Intl.DateTimeFormat("en-US", {
            hour: "2-digit",
            hour12: false,
            timeZone: snapshot.clock.timezone || "Asia/Dhaka",
          }).formatToParts(now).find((part) => part.type === "hour")?.value || "0"
          
          const hour = Number(hourStr) === 24 ? 0 : Number(hourStr)
          setIsNightMode(hour < 9 || hour >= 17)
        } catch (e) {
          console.error("Error parsing clock for night mode:", e)
        }
      }

      // Map usage
      if (snapshot.usage) {
        setUsage({
          totalKwh: snapshot.usage.total_usage_kwh ?? 0,
          estimatedCostBdt: snapshot.usage.estimated_cost_bdt ?? 0,
          tariffRate: snapshot.usage.tariff_bdt_per_kwh ?? 12,
        })

        // Track power history
        const totalPower = snapshot.usage.total_power_watts ?? 0
        const now = new Date()
        const bstFormatter = new Intl.DateTimeFormat("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
          timeZone: "Asia/Dhaka",
        })
        const timeLabel = bstFormatter.format(now)

        setPowerHistory((prev) => {
          const updated = [...prev, { time: timeLabel, value: totalPower }]
          if (updated.length > 30) {
            return updated.slice(updated.length - 30)
          }
          return updated
        })
      }
    }

    const fetchInitial = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/snapshot`)
        if (res.ok) {
          const snapshot = await res.json()
          processSnapshot(snapshot)
        }
      } catch (err) {
        console.error("Failed to fetch initial snapshot:", err)
      }
    }

    function connect() {
      ws = new WebSocket(`${WS_BASE}/ws`)

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data && data.payload) {
            processSnapshot(data.payload)
          }
        } catch (e) {
          console.error("Failed to parse websocket message:", e)
        }
      }

      ws.onclose = () => {
        console.log("WebSocket disconnected. Reconnecting in 3s...")
        reconnectTimeout = setTimeout(connect, 3000)
      }

      ws.onerror = (err) => {
        console.error("WebSocket error:", err)
        ws.close()
      }
    }

    fetchInitial()
    connect()

    return () => {
      if (ws) ws.close()
      if (reconnectTimeout) clearTimeout(reconnectTimeout)
    }
  }, [])

  const handleToggleNightMode = useCallback(async () => {
    const nextIsNight = !isNightMode
    const targetHour = nextIsNight ? 21 : 14
    const date = new Date()
    date.setHours(targetHour, 0, 0, 0)

    try {
      await fetch(`${API_BASE}/api/simulator/time`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentTime: date.toISOString() }),
      })
      setIsNightMode(nextIsNight)
    } catch (err) {
      console.error("Failed to set simulator time:", err)
    }
  }, [isNightMode])

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

  return {
    devices,
    activeTab,
    setActiveTab,
    isNightMode,
    setIsNightMode: handleToggleNightMode,
    sidebarCollapsed,
    setSidebarCollapsed,
    handleDeviceToggle,
    roomPowers,
    totalPower,
    alerts,
    usage,
    powerHistory,
  }
}
