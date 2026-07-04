"use client"

import React, { useState } from "react"
import { Device } from "./DeviceGrid"

interface FloorplanViewerProps {
  devices: Device[]
}

function FloorplanViewer({ devices }: FloorplanViewerProps) {
  const [viewMode, setViewMode] = useState<"top" | "iso">("top")
  const [showGrid, setShowGrid] = useState(true)
  const [zoom, setZoom] = useState(100)

  // Find status of devices to render in floorplan
  const getDeviceState = (
    room: string,
    type: "fan" | "light",
    index: number
  ) => {
    const roomDevices = devices.filter(
      (d) => d.room === room && d.type === type
    )
    return roomDevices[index] ? roomDevices[index].checked : false
  }

  return (
    <div className="relative flex h-full flex-col gap-6 overflow-hidden border border-border bg-card/25 p-6 font-mono">
      {/* HUD Header */}
      <div className="z-10 flex items-center justify-between border-b border-border/50 pb-3">
        <div className="flex items-center gap-2">
          <svg
            className="size-4 animate-pulse text-primary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth="2"
          >
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          </svg>
          <span className="text-xs font-bold tracking-wider text-foreground uppercase">
            3D OFFICE_FLOORPLAN_RESOLVER
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode(viewMode === "top" ? "iso" : "top")}
            className="border border-border bg-background/60 px-2 py-0.5 text-[9px] font-bold tracking-widest text-text-secondary uppercase hover:bg-muted/50"
          >
            VIEW: {viewMode === "top" ? "2D_TOP" : "3D_ISOMETRIC"}
          </button>
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`border px-2 py-0.5 text-[9px] font-bold tracking-widest uppercase ${
              showGrid
                ? "border-primary/45 bg-primary/10 text-primary"
                : "border-border bg-background/60 text-muted-foreground"
            }`}
          >
            GRID: {showGrid ? "ON" : "OFF"}
          </button>
        </div>
      </div>

      {/* Orbit Controls Mock HUD Overlay */}
      <div className="absolute right-10 bottom-10 z-20 flex flex-col gap-1.5 border border-border/70 bg-background/85 p-3 text-[9px]">
        <div className="mb-1 border-b border-border/40 pb-1 text-center font-bold tracking-wider text-muted-foreground uppercase">
          Orbit Controls
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex gap-1">
            <button
              onClick={() => setZoom(Math.max(50, zoom - 10))}
              className="flex-1 border border-border bg-muted/20 px-1 py-0.5 text-center font-bold hover:bg-muted/50"
            >
              - ZOOM
            </button>
            <button
              onClick={() => setZoom(Math.min(150, zoom + 10))}
              className="flex-1 border border-border bg-muted/20 px-1 py-0.5 text-center font-bold hover:bg-muted/50"
            >
              + ZOOM
            </button>
          </div>
          <div className="mt-1 flex flex-col gap-0.5 px-1 text-center text-muted-foreground">
            <span>[HOLD LEFT_CLICK TO ROTATE]</span>
            <span>[HOLD RIGHT_CLICK TO PAN]</span>
          </div>
        </div>
      </div>

      {/* Viewport Canvas */}
      <div
        className={`relative flex min-h-[460px] flex-1 items-center justify-center overflow-hidden border border-border/40 bg-background/30 transition-all duration-500 ${
          showGrid
            ? "bg-[radial-gradient(rgba(255,230,203,0.04)_1px,transparent_1px)] [background-size:16px_16px]"
            : ""
        }`}
      >
        {/* Render Floorplan Container with dynamic zoom and 3D Isometric rotation */}
        <div
          className="origin-center scale-90 transform transition-all duration-300 sm:scale-100"
          style={{
            transform: `scale(${zoom / 100}) ${
              viewMode === "iso"
                ? "rotateX(60deg) rotateZ(-45deg)"
                : "rotateX(0deg) rotateZ(0deg)"
            }`,
            transformStyle: "preserve-3d",
            perspective: "1000px",
          }}
        >
          {/* Floorplan Frame */}
          <div
            className="relative h-[320px] w-[600px] border-[3px] border-border bg-background-base/80 shadow-2xl transition-all select-none"
            style={{
              boxShadow:
                viewMode === "iso" ? "20px 20px 60px rgba(0,0,0,0.8)" : "none",
            }}
          >
            {/* Outer Walls */}
            <div className="pointer-events-none absolute inset-0 border border-border/80" />

            {/* Room 1: Drawing Room (Left Section) */}
            <div className="absolute top-0 bottom-12 left-0 flex w-[190px] flex-col justify-between border-r-[3px] border-border px-4 py-3">
              <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                Drawing Room
              </span>

              {/* Custom SVG waiting sofa placeholder */}
              <div className="absolute top-14 left-4 flex h-24 w-8 rotate-0 items-center justify-center border border-border bg-card/25 text-[8px] text-muted-foreground/60">
                SOFA
              </div>

              {/* Devices Indicators on Blueprint */}
              <div className="flex h-full flex-col items-end justify-center gap-6 pl-12">
                {/* Light Indicators */}
                <div className="flex gap-4">
                  {[0, 1, 2].map((idx) => {
                    const active = getDeviceState("drawingRoom", "light", idx)
                    return (
                      <div
                        key={`dr-light-${idx}`}
                        className={`flex size-5 items-center justify-center border transition-all ${
                          active
                            ? "border-warning bg-warning/20 text-warning shadow-[0_0_12px_rgba(255,189,56,0.35)]"
                            : "border-border/50 bg-muted/10 text-muted-foreground/50"
                        }`}
                      >
                        💡
                      </div>
                    )
                  })}
                </div>

                {/* Fan Indicators */}
                <div className="flex gap-4">
                  {[0, 1].map((idx) => {
                    const active = getDeviceState("drawingRoom", "fan", idx)
                    return (
                      <div
                        key={`dr-fan-${idx}`}
                        className={`flex size-6 items-center justify-center border transition-all ${
                          active
                            ? "border-primary bg-primary/20 text-primary"
                            : "border-border/50 bg-muted/10 text-muted-foreground/50"
                        }`}
                      >
                        <span
                          className={active ? "animate-spin" : ""}
                          style={{ animationDuration: "1s" }}
                        >
                          🌀
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Room 2: Work Room 1 (Middle Section) */}
            <div className="absolute top-0 bottom-12 left-[190px] flex w-[205px] flex-col justify-between border-r-[3px] border-border px-4 py-3">
              <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                Work Room 1
              </span>

              {/* Desks Mock outlines */}
              <div className="absolute top-14 left-4 flex h-8 w-12 items-center justify-center border border-border/70 bg-card/10 text-[7px] text-muted-foreground/50">
                DESK
              </div>
              <div className="absolute top-14 right-4 flex h-8 w-12 items-center justify-center border border-border/70 bg-card/10 text-[7px] text-muted-foreground/50">
                DESK
              </div>
              <div className="absolute top-36 left-4 flex h-8 w-12 items-center justify-center border border-border/70 bg-card/10 text-[7px] text-muted-foreground/50">
                DESK
              </div>
              <div className="absolute top-36 right-4 flex h-8 w-12 items-center justify-center border border-border/70 bg-card/10 text-[7px] text-muted-foreground/50">
                DESK
              </div>

              {/* Devices Indicators on Blueprint */}
              <div className="flex h-full flex-col items-center justify-center gap-6 py-8">
                {/* Light Indicators */}
                <div className="flex gap-4">
                  {[0, 1, 2].map((idx) => {
                    const active = getDeviceState("workRoom1", "light", idx)
                    return (
                      <div
                        key={`wr1-light-${idx}`}
                        className={`flex size-5 items-center justify-center border transition-all ${
                          active
                            ? "border-warning bg-warning/20 text-warning shadow-[0_0_12px_rgba(255,189,56,0.35)]"
                            : "border-border/50 bg-muted/10 text-muted-foreground/50"
                        }`}
                      >
                        💡
                      </div>
                    )
                  })}
                </div>

                {/* Fan Indicators */}
                <div className="flex gap-4">
                  {[0, 1].map((idx) => {
                    const active = getDeviceState("workRoom1", "fan", idx)
                    return (
                      <div
                        key={`wr1-fan-${idx}`}
                        className={`flex size-6 items-center justify-center border transition-all ${
                          active
                            ? "border-primary bg-primary/20 text-primary"
                            : "border-border/50 bg-muted/10 text-muted-foreground/50"
                        }`}
                      >
                        <span
                          className={active ? "animate-spin" : ""}
                          style={{ animationDuration: "1s" }}
                        >
                          🌀
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Room 3: Work Room 2 (Right Section) */}
            <div className="absolute top-0 right-0 bottom-12 left-[395px] flex flex-col justify-between px-4 py-3">
              <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                Work Room 2
              </span>

              {/* Desks Mock outlines */}
              <div className="absolute top-14 left-4 flex h-8 w-12 items-center justify-center border border-border/70 bg-card/10 text-[7px] text-muted-foreground/50">
                DESK
              </div>
              <div className="absolute top-14 right-4 flex h-8 w-12 items-center justify-center border border-border/70 bg-card/10 text-[7px] text-muted-foreground/50">
                DESK
              </div>
              <div className="absolute top-36 left-4 flex h-8 w-12 items-center justify-center border border-border/70 bg-card/10 text-[7px] text-muted-foreground/50">
                DESK
              </div>
              <div className="absolute top-36 right-4 flex h-8 w-12 items-center justify-center border border-border/70 bg-card/10 text-[7px] text-muted-foreground/50">
                DESK
              </div>

              {/* Devices Indicators on Blueprint */}
              <div className="flex h-full flex-col items-center justify-center gap-6 py-8">
                {/* Light Indicators */}
                <div className="flex gap-4">
                  {[0, 1, 2].map((idx) => {
                    const active = getDeviceState("workRoom2", "light", idx)
                    return (
                      <div
                        key={`wr2-light-${idx}`}
                        className={`flex size-5 items-center justify-center border transition-all ${
                          active
                            ? "border-warning bg-warning/20 text-warning shadow-[0_0_12px_rgba(255,189,56,0.35)]"
                            : "border-border/50 bg-muted/10 text-muted-foreground/50"
                        }`}
                      >
                        💡
                      </div>
                    )
                  })}
                </div>

                {/* Fan Indicators */}
                <div className="flex gap-4">
                  {[0, 1].map((idx) => {
                    const active = getDeviceState("workRoom2", "fan", idx)
                    return (
                      <div
                        key={`wr2-fan-${idx}`}
                        className={`flex size-6 items-center justify-center border transition-all ${
                          active
                            ? "border-primary bg-primary/20 text-primary"
                            : "border-border/50 bg-muted/10 text-muted-foreground/50"
                        }`}
                      >
                        <span
                          className={active ? "animate-spin" : ""}
                          style={{ animationDuration: "1s" }}
                        >
                          🌀
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Hallway / Corridor (Bottom Section) */}
            <div className="absolute right-0 bottom-0 left-0 flex h-12 items-center justify-between border-t-[3px] border-border px-6">
              <span className="text-[9px] font-bold tracking-wider text-muted-foreground uppercase">
                Corridor / Hallway
              </span>
              <div className="flex items-center gap-6">
                {/* Plants/Water Dispenser indicators */}
                <span className="border border-border/50 px-1 py-0.5 text-[8px] text-muted-foreground/45">
                  WATER_DISPENSER
                </span>
                <span className="border border-border/50 px-1 py-0.5 text-[8px] text-muted-foreground/45">
                  PLANT_A
                </span>
                <span className="border border-border/50 px-1 py-0.5 text-[8px] text-muted-foreground/45">
                  PLANT_B
                </span>
                <div className="flex items-center gap-1 text-[10px] font-bold text-primary">
                  <span>← ENTRY</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export { FloorplanViewer }
