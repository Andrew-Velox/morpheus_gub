"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import { initialDevices, type Device } from "@/lib/initialDevices"

export interface AlertItem {
  id: string
  type: "warning" | "critical"
  message: string
  timestamp: string
  code?: string
  room?: string
  deviceIds?: string[]
  currentWatts?: number
  continuous_hours?: number
  roomId?: string
}

export interface RoomPowers {
  drawingRoom: number
  workRoom1: number
  workRoom2: number
}

// Backend URL: defaults to the deployed Render backend so Vercel works
// out of the box. Override via NEXT_PUBLIC_API_BASE for local development
// (e.g. "http://localhost:4000" in .env.local).
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "https://morpheus-gub.onrender.com"

// Derive the WebSocket URL from the API base (http->ws, https->wss).
const WS_BASE = API_BASE.replace(/^http/, "ws")

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
  const [diagnostics, setDiagnostics] = useState<{
    discordBot: string
    database: string
    apiGateway: string
    latency: string
  }>({
    discordBot: "CONNECTING...",
    database: "LOCAL_IN_MEM",
    apiGateway: "CONNECTING...",
    latency: "..."
  })

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

  const handleRoomShutdown = useCallback(async (roomId: string) => {
    const mapSlugToRoom = (slug: string): "drawingRoom" | "workRoom1" | "workRoom2" => {
      if (slug === "work_room_1") return "workRoom1"
      if (slug === "work_room_2") return "workRoom2"
      return "drawingRoom"
    }

    const roomName = mapSlugToRoom(roomId)
    setDevices((prev) =>
      prev.map((d) => (d.room === roomName ? { ...d, checked: false } : d))
    )

    try {
      await fetch(`${API_BASE}/api/simulator/room/${roomId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: false }),
      })
    } catch (error) {
      console.error("Failed to shutdown room:", error)
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
          let timeStr = "12:00:00 AM"
          try {
            if (alert.timestamp) {
              const d = new Date(alert.timestamp)
              timeStr = new Intl.DateTimeFormat("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: true,
                timeZone: "Asia/Dhaka",
              }).format(d)
            }
          } catch (e) {
            console.error("Error parsing alert timestamp:", e)
          }

          return {
            id: alert.id || alert.key,
            type: alert.severity === "critical" ? "critical" : "warning",
            message: alert.message,
            timestamp: timeStr,
            code: alert.code,
            room: alert.room,
            deviceIds: alert.deviceIds || alert.device_ids,
            currentWatts: alert.currentWatts,
            continuous_hours: alert.continuous_hours,
            roomId: alert.roomId || alert.room_id,
          }
        })
        setAlerts((prevAlerts) => {
          // If we already have alerts and a new one arrives, play the chime
          const newAlerts = mappedAlerts.filter(
            (ma) => !prevAlerts.some((pa) => pa.id === ma.id)
          )
          if (prevAlerts.length > 0 && newAlerts.length > 0) {
            if (typeof window !== "undefined") {
              const audio = new Audio("/sounds/alert-warning.wav")
              audio.play().catch((err) => {
                console.warn("Alert sound play blocked:", err)
              })
            }
          }
          return mappedAlerts
        })
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

  // Poll /api/health to check server diagnostics
  useEffect(() => {
    let active = true
    let timer: NodeJS.Timeout

    const fetchHealth = async () => {
      const startTime = performance.now()
      try {
        const res = await fetch(`${API_BASE}/api/health`)
        const endTime = performance.now()
        const lat = Math.round(endTime - startTime)
        
        if (!active) return

        if (res.ok) {
          const data = await res.json()
          setDiagnostics({
            discordBot: data.realtime ? "ONLINE" : "OFFLINE",
            database: "LOCAL_IN_MEM",
            apiGateway: data.status === "ok" ? "OK" : "ERROR",
            latency: `${lat}ms`,
          })
        } else {
          setDiagnostics((prev) => ({
            ...prev,
            discordBot: "OFFLINE",
            apiGateway: "ERROR",
            latency: "N/A",
          }))
        }
      } catch (err) {
        if (!active) return
        setDiagnostics({
          discordBot: "OFFLINE",
          database: "OFFLINE",
          apiGateway: "OFFLINE",
          latency: "N/A",
        })
      }
    }

    fetchHealth()
    timer = setInterval(fetchHealth, 10000)

    return () => {
      active = false
      clearInterval(timer)
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
    handleRoomShutdown,
    roomPowers,
    totalPower,
    alerts,
    usage,
    powerHistory,
    diagnostics,
  }
}
