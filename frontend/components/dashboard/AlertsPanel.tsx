"use client"

import React, { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Alert02Icon, Clock01Icon } from "@hugeicons/core-free-icons"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Device } from "./DeviceGrid"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

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

interface AlertsPanelProps {
  alerts: AlertItem[]
  devices?: Device[]
  onDeviceToggle?: (id: string) => void
  onRoomShutdown?: (roomId: string) => void
}

const mapAlertRoomToDeviceRoom = (alertRoom: string | undefined): string => {
  if (!alertRoom) return ""
  const normalized = alertRoom.toLowerCase().replace(/\s+/g, "")
  if (normalized.includes("drawing")) return "drawingRoom"
  if (normalized.includes("work1") || normalized.includes("workroom1")) return "workRoom1"
  if (normalized.includes("work2") || normalized.includes("workroom2")) return "workRoom2"
  return ""
}

function AlertsPanel({
  alerts,
  devices = [],
  onDeviceToggle,
  onRoomShutdown,
}: AlertsPanelProps) {
  const [selectedAlert, setSelectedAlert] = useState<AlertItem | null>(null)

  // Automatically close or sync the dialog if the selected alert is resolved / gone from the live feed
  React.useEffect(() => {
    if (selectedAlert) {
      const latestAlert = alerts.find((a) => a.id === selectedAlert.id)
      if (!latestAlert) {
        setSelectedAlert(null)
        // Show explanation toast so the user knows why the dialog suddenly closed
        const roomName = selectedAlert.room || "Room"
        const alertType = selectedAlert.code?.replace(/_/g, " ") || "Alert"
        toast.success("Alert Resolved", {
          description: `The active ${alertType} for ${roomName} has been cleared. The details dialog has been closed.`,
        })
      } else if (
        latestAlert.message !== selectedAlert.message ||
        latestAlert.currentWatts !== selectedAlert.currentWatts ||
        latestAlert.continuous_hours !== selectedAlert.continuous_hours ||
        latestAlert.roomId !== selectedAlert.roomId
      ) {
        setSelectedAlert(latestAlert)
      }
    }
  }, [alerts, selectedAlert])

  // Find devices in the room associated with the selected alert
  const roomDevices = selectedAlert
    ? devices.filter((d) => d.room === mapAlertRoomToDeviceRoom(selectedAlert.room))
    : []

  return (
    <>
      <Card className="flex h-full flex-col font-mono">
        <CardHeader className="flex-row items-center justify-between border-b border-border/50 pb-3 p-6">
          <div className="flex items-center gap-2">
            <HugeiconsIcon
              icon={Alert02Icon}
              className="size-4 animate-pulse text-destructive"
            />
            <CardTitle className="text-xs font-bold tracking-wider text-foreground uppercase">
              Active Alerts Feed
            </CardTitle>
          </div>
          <span className="text-[10px] text-muted-foreground uppercase">
            Live Log
          </span>
        </CardHeader>

        <CardContent className="flex flex-1 min-h-0 flex-col gap-4 p-6">
          <div className="flex flex-1 min-h-[150px] flex-col gap-2 overflow-y-auto pr-1">
            {alerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center border border-dashed border-border/30 bg-background/20 p-4 py-10 text-center">
                <span className="mb-1 text-[10px] font-bold tracking-wider text-success uppercase">
                  SYSTEM_SECURE
                </span>
                <span className="text-[10px] leading-relaxed text-muted-foreground uppercase">
                  No anomalies detected. Energy consumption nominal.
                </span>
              </div>
            ) : (
              alerts.map((alert) => (
                <div
                  key={alert.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedAlert(alert)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      setSelectedAlert(alert)
                      e.preventDefault()
                    }
                  }}
                  className={`flex cursor-pointer flex-col gap-2 border p-3 transition-all hover:brightness-110 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none ${
                    alert.type === "critical"
                      ? "border-destructive/30 bg-destructive/5 text-destructive"
                      : "border-warning/30 bg-warning/5 text-warning"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`border px-1.5 py-0.5 text-[9px] font-bold ${
                        alert.type === "critical"
                          ? "border-destructive/40 bg-destructive/10"
                          : "border-warning/40 bg-warning/10"
                      } tracking-widest uppercase`}
                    >
                      {alert.type}
                    </span>
                    <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
                      <HugeiconsIcon icon={Clock01Icon} className="size-3" />
                      <span>{alert.timestamp}</span>
                    </div>
                  </div>
                  <p className="text-xs leading-relaxed tracking-wide text-foreground uppercase">
                    {alert.message}
                  </p>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedAlert} onOpenChange={(open) => !open && setSelectedAlert(null)}>
        <DialogContent className="max-w-md border border-border/80 bg-background-base p-6 font-mono rounded-lg shadow-2xl">
          {selectedAlert && (
            <div className="flex flex-col gap-5">
              <DialogHeader className="border-b border-border/40 pb-3 p-0 flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span
                    className={`border px-2 py-0.5 text-[10px] font-bold tracking-widest uppercase rounded-sm ${
                      selectedAlert.type === "critical"
                        ? "border-destructive/40 bg-destructive/15 text-destructive"
                        : "border-warning/40 bg-warning/15 text-warning"
                    }`}
                  >
                    {selectedAlert.type}
                  </span>
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <HugeiconsIcon icon={Clock01Icon} className="size-3.5" />
                    <span>{selectedAlert.timestamp}</span>
                  </div>
                </div>
                <DialogTitle className="mt-2 text-sm font-bold tracking-wider text-foreground uppercase">
                  {selectedAlert.code?.replace(/_/g, " ") || "ANOMALY DETECTED"}
                </DialogTitle>
                <DialogDescription className="text-[11px] text-muted-foreground uppercase">
                  Detailed inspection & resolution tools
                </DialogDescription>
              </DialogHeader>

              {/* Alert message block */}
              <div className="border border-border/40 bg-muted/5 p-3.5 text-xs text-foreground uppercase leading-relaxed font-mono">
                {selectedAlert.message}
              </div>

              {/* Details table/grid */}
              <div className="grid grid-cols-2 gap-3 border border-border/30 p-4 bg-muted/10 text-xs rounded-sm">
                <div className="flex flex-col gap-1 border-r border-border/20 pr-2">
                  <span className="text-[10px] text-muted-foreground uppercase">Location</span>
                  <span className="font-bold text-foreground capitalize">
                    {selectedAlert.room || "Unknown"}
                  </span>
                </div>
                <div className="flex flex-col gap-1 pl-2">
                  <span className="text-[10px] text-muted-foreground uppercase">Power Draw</span>
                  <span className="font-bold text-primary">
                    {selectedAlert.currentWatts !== undefined ? `${selectedAlert.currentWatts} W` : "N/A"}
                  </span>
                </div>
                {selectedAlert.continuous_hours !== undefined && (
                  <div className="col-span-2 border-t border-border/20 mt-1 pt-2 flex flex-col gap-1">
                    <span className="text-[10px] text-muted-foreground uppercase">Continuous Hours Active</span>
                    <span className="font-bold text-rose-500">
                      {selectedAlert.continuous_hours} hrs
                    </span>
                  </div>
                )}
              </div>

              {/* Affected Devices List */}
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between border-b border-border/30 pb-1.5">
                  <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                    Devices in Room
                  </span>
                  <span className="text-[9px] text-muted-foreground uppercase">
                    {roomDevices.filter((d) => d.checked).length} Active
                  </span>
                </div>

                {roomDevices.length === 0 ? (
                  <div className="py-4 text-center text-xs text-muted-foreground uppercase">
                    No connected devices found in this room.
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 max-h-[160px] overflow-y-auto pr-1">
                    {roomDevices.map((device) => {
                      const isActive = device.checked
                      return (
                        <div
                          key={device.id}
                          className={`flex items-center justify-between border p-2.5 transition-all rounded-sm ${
                            isActive
                              ? "border-primary/30 bg-primary/5"
                              : "border-border/30 bg-background/20"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            {/* Device Icon */}
                            <div
                              className={`flex size-7 items-center justify-center border rounded-sm ${
                                isActive
                                  ? "border-primary/30 bg-primary/10 text-primary"
                                  : "border-border/30 bg-muted/10 text-muted-foreground"
                              }`}
                            >
                              {device.type === "fan" ? (
                                <svg
                                  className={`size-4.5 ${isActive ? "animate-spin" : ""}`}
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  style={{ animationDuration: "1.5s" }}
                                >
                                  <circle cx="12" cy="12" r="2" />
                                  <path d="M12 2v8M12 14v8M2 12h8M14 12h8" />
                                  <path d="M12 10c1.5-1.5 1.5-3.5 0-5s-3.5-1.5-5 0" />
                                  <path d="M14 12c1.5 1.5 3.5 1.5 5 0s1.5-3.5 0-5" />
                                  <path d="M12 14c-1.5 1.5-1.5 3.5 0 5s3.5 1.5 5 0" />
                                  <path d="M10 12c-1.5-1.5-3.5-1.5-5 0s-1.5 3.5 0 5" />
                                </svg>
                              ) : (
                                <svg
                                  className="size-4.5"
                                  viewBox="0 0 24 24"
                                  fill={isActive ? "currentColor" : "none"}
                                  stroke="currentColor"
                                  strokeWidth="2"
                                >
                                  <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .5 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
                                  <path d="M9 18h6M10 22h4" />
                                </svg>
                              )}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[10px] font-bold text-foreground uppercase">
                                {device.name}
                              </span>
                              <span className="text-[8px] text-muted-foreground uppercase">
                                {device.wattage}W • {isActive ? "ON" : "OFF"}
                              </span>
                            </div>
                          </div>

                          <Switch
                            checked={isActive}
                            disabled={!onDeviceToggle}
                            onCheckedChange={() => onDeviceToggle && onDeviceToggle(device.id)}
                          />
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2 border-t border-border/40">
                {roomDevices.some((d) => d.checked) && (
                  <Button
                    variant="destructive"
                    size="sm"
                    className="flex-1 text-[10px] font-bold"
                    onClick={() => {
                      if (onRoomShutdown && selectedAlert.roomId) {
                        onRoomShutdown(selectedAlert.roomId)
                      } else if (onDeviceToggle) {
                        // Fallback to individual toggle
                        roomDevices.filter((d) => d.checked).forEach((d) => onDeviceToggle(d.id))
                      }
                    }}
                  >
                    RESOLVE: SHUTDOWN ROOM
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-[10px] font-bold"
                  onClick={() => setSelectedAlert(null)}
                >
                  DISMISS VIEW
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

export { AlertsPanel }

