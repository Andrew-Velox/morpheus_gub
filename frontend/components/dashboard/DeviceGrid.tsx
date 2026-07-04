"use client"

import React from "react"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

export interface Device {
  id: string
  name: string
  type: "fan" | "light"
  room: "drawingRoom" | "workRoom1" | "workRoom2"
  checked: boolean
  wattage: number
}

interface DeviceGridProps {
  devices: Device[]
  onDeviceToggle: (id: string) => void
}

function DeviceGrid({ devices, onDeviceToggle }: DeviceGridProps) {
  // Keep track of previous device states to trigger toasts when they change
  const prevDeviceStatusesRef = React.useRef<Map<string, boolean>>(new Map())

  React.useEffect(() => {
    const formatRoomName = (room: string) => {
      if (room === "drawingRoom") return "Drawing Room"
      if (room === "workRoom1") return "Work Room 1"
      if (room === "workRoom2") return "Work Room 2"
      return room
    }

    devices.forEach((device) => {
      const prevStatus = prevDeviceStatusesRef.current.get(device.id)
      
      // If we already had a recorded status and it changed, show a toast
      if (prevStatus !== undefined && prevStatus !== device.checked) {
        const roomLabel = formatRoomName(device.room)
        const title = device.checked ? "Device Activated" : "Device Deactivated"
        const description = `${device.name} in ${roomLabel} is now ${device.checked ? "ON" : "OFF"}`

        const toastFn = device.checked ? toast.success : toast

        toastFn(title, {
          description,
          action: {
            label: "Undo",
            onClick: () => onDeviceToggle(device.id),
          },
        })
      }
      
      // Update the recorded status
      prevDeviceStatusesRef.current.set(device.id, device.checked)
    })
  }, [devices, onDeviceToggle])

  const rooms = {
    drawingRoom: {
      name: "Drawing Room",
      devices: devices.filter((d) => d.room === "drawingRoom"),
    },
    workRoom1: {
      name: "Work Room 1",
      devices: devices.filter((d) => d.room === "workRoom1"),
    },
    workRoom2: {
      name: "Work Room 2",
      devices: devices.filter((d) => d.room === "workRoom2"),
    },
  }

  const renderRoom = (
    key: string,
    room: { name: string; devices: Device[] },
    columnsClass: string = "grid-cols-1 sm:grid-cols-2 md:grid-cols-3"
  ) => (
    <Card
      key={key}
      className="flex flex-col gap-4 p-6"
    >
      {/* Room Header */}
      <div className="flex items-center justify-between border-b border-border/50 pb-2">
        <span className="text-sm font-bold tracking-wider text-foreground uppercase">
          {room.name}
        </span>
        <span className="text-[10px] text-muted-foreground uppercase">
          {room.devices.filter((d) => d.checked).length} / {room.devices.length}{" "}
          Active
        </span>
      </div>

      {/* Room Devices Grid */}
      <div className={cn("grid gap-4", columnsClass)}>
        {room.devices.map((device) => {
          const isActive = device.checked
          return (
            <div
              key={device.id}
              className={`flex items-center justify-between border p-4 transition-all ${
                isActive
                  ? "border-primary/45 bg-primary/5"
                  : "border-border/60 bg-background/40"
              }`}
            >
              <div className="flex items-center gap-3">
                {/* Dynamic Graphic Icon */}
                <div
                  className={`flex size-10 items-center justify-center border transition-all ${
                    isActive
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "border-border/40 bg-muted/10 text-muted-foreground"
                  }`}
                >
                  {device.type === "fan" ? (
                    /* Fan SVG - spins when active */
                    <svg
                      className={`size-5 ${isActive ? "animate-spin" : ""}`}
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
                    /* Light Bulb SVG - glows yellow when active */
                    <svg
                      className="size-5 transition-all"
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

                {/* Device Label and Details */}
                <div className="flex flex-col">
                  <span className="text-xs font-bold tracking-wider text-foreground uppercase">
                    {device.name}
                  </span>
                  <span className="text-[9px] text-muted-foreground uppercase">
                    {device.wattage}W • {isActive ? "ON" : "OFF"}
                  </span>
                </div>
              </div>

              {/* Toggle Switch */}
              <Switch
                checked={isActive}
                onCheckedChange={() => onDeviceToggle(device.id)}
                soundType={device.type}
              />
            </div>
          )
        })}
      </div>
    </Card>
  )

  const activeAll = devices.filter((d) => d.checked).length
  const totalAll = devices.length

  const activeDr = rooms.drawingRoom.devices.filter((d) => d.checked).length
  const totalDr = rooms.drawingRoom.devices.length

  const activeWr1 = rooms.workRoom1.devices.filter((d) => d.checked).length
  const totalWr1 = rooms.workRoom1.devices.length

  const activeWr2 = rooms.workRoom2.devices.filter((d) => d.checked).length
  const totalWr2 = rooms.workRoom2.devices.length

  return (
    <div className="flex w-full flex-col gap-4 font-mono">
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="sticky top-0 z-10 -mx-6 bg-background px-6 pt-4 mb-6 flex flex-wrap gap-x-6 gap-y-2 border-b border-border/40 pb-0">
          <TabsTrigger
            value="all"
            className="flex items-center gap-2 pb-3 text-[10px] font-bold tracking-[0.2em] uppercase transition-all data-active:border-b-2 data-active:border-primary data-active:text-primary hover:text-foreground cursor-pointer"
          >
            <span>All Rooms</span>
            <span
              className={`ml-1 px-1.5 py-0.5 text-[9px] font-bold border rounded-full transition-all ${
                activeAll > 0
                  ? "bg-primary/10 text-primary border-primary/30"
                  : "bg-muted/10 text-muted-foreground border-border/40"
              }`}
            >
              {activeAll}/{totalAll}
            </span>
          </TabsTrigger>

          <TabsTrigger
            value="drawingRoom"
            className="flex items-center gap-2 pb-3 text-[10px] font-bold tracking-[0.2em] uppercase transition-all data-active:border-b-2 data-active:border-primary data-active:text-primary hover:text-foreground cursor-pointer"
          >
            <span>Drawing Room</span>
            <span
              className={`ml-1 px-1.5 py-0.5 text-[9px] font-bold border rounded-full transition-all ${
                activeDr > 0
                  ? "bg-primary/10 text-primary border-primary/30"
                  : "bg-muted/10 text-muted-foreground border-border/40"
              }`}
            >
              {activeDr}/{totalDr}
            </span>
          </TabsTrigger>

          <TabsTrigger
            value="workRoom1"
            className="flex items-center gap-2 pb-3 text-[10px] font-bold tracking-[0.2em] uppercase transition-all data-active:border-b-2 data-active:border-primary data-active:text-primary hover:text-foreground cursor-pointer"
          >
            <span>Work Room 1</span>
            <span
              className={`ml-1 px-1.5 py-0.5 text-[9px] font-bold border rounded-full transition-all ${
                activeWr1 > 0
                  ? "bg-primary/10 text-primary border-primary/30"
                  : "bg-muted/10 text-muted-foreground border-border/40"
              }`}
            >
              {activeWr1}/{totalWr1}
            </span>
          </TabsTrigger>

          <TabsTrigger
            value="workRoom2"
            className="flex items-center gap-2 pb-3 text-[10px] font-bold tracking-[0.2em] uppercase transition-all data-active:border-b-2 data-active:border-primary data-active:text-primary hover:text-foreground cursor-pointer"
          >
            <span>Work Room 2</span>
            <span
              className={`ml-1 px-1.5 py-0.5 text-[9px] font-bold border rounded-full transition-all ${
                activeWr2 > 0
                  ? "bg-primary/10 text-primary border-primary/30"
                  : "bg-muted/10 text-muted-foreground border-border/40"
              }`}
            >
              {activeWr2}/{totalWr2}
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {Object.entries(rooms).map(([key, room]) => renderRoom(key, room, "grid-cols-1"))}
        </TabsContent>

        <TabsContent value="drawingRoom" className="w-full">
          {renderRoom("drawingRoom", rooms.drawingRoom)}
        </TabsContent>

        <TabsContent value="workRoom1" className="w-full">
          {renderRoom("workRoom1", rooms.workRoom1)}
        </TabsContent>

        <TabsContent value="workRoom2" className="w-full">
          {renderRoom("workRoom2", rooms.workRoom2)}
        </TabsContent>
      </Tabs>
    </div>
  )
}

export { DeviceGrid }
