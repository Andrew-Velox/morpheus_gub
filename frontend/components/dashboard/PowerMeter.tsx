"use client"

import React, { useMemo, useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

interface PowerMeterProps {
  totalPower: number
  roomPowers: {
    drawingRoom: number
    workRoom1: number
    workRoom2: number
  }
  usage: {
    totalKwh: number
    estimatedCostBdt: number
    tariffRate: number
  }
  powerHistory: { time: string; value: number }[]
}

function PowerMeter({ totalPower, roomPowers, usage, powerHistory }: PowerMeterProps) {
  const [hoveredPoint, setHoveredPoint] = useState<any>(null)
  const maxCapacity = 495 // 6 fans * 60W + 9 lights * 15W = 495W
  const percentage = Math.min(100, Math.round((totalPower / maxCapacity) * 100))

  const chartPoints = useMemo(() => {
    if (!powerHistory || powerHistory.length < 2) return []
    const maxVal = Math.max(150, ...powerHistory.map((h) => h.value), 495)
    return powerHistory.map((h, idx) => {
      const x = (idx / (powerHistory.length - 1)) * 500
      const y = 100 - (h.value / maxVal) * 80
      return { x, y, ...h }
    })
  }, [powerHistory])

  const linePath = useMemo(() => {
    if (chartPoints.length < 2) return ""
    return chartPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ")
  }, [chartPoints])

  const areaPath = useMemo(() => {
    if (chartPoints.length < 2) return ""
    const startX = chartPoints[0].x.toFixed(1)
    const endX = chartPoints[chartPoints.length - 1].x.toFixed(1)
    return `${linePath} L ${endX} 120 L ${startX} 120 Z`
  }, [chartPoints, linePath])

  const lastPoint = chartPoints.length > 0 ? chartPoints[chartPoints.length - 1] : null

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (chartPoints.length < 2) return
    const rect = e.currentTarget.getBoundingClientRect()
    const mouseX = ((e.clientX - rect.left) / rect.width) * 500
    
    let closest = chartPoints[0]
    let minDist = Math.abs(closest.x - mouseX)
    
    for (let i = 1; i < chartPoints.length; i++) {
      const dist = Math.abs(chartPoints[i].x - mouseX)
      if (dist < minDist) {
        minDist = dist
        closest = chartPoints[i]
      }
    }
    setHoveredPoint(closest)
  }

  return (
    <Card className="font-mono">
      <CardHeader className="flex-row items-center justify-between border-b border-border/50 pb-3 p-6">
        <div className="flex items-center gap-2">
          {/* Custom SVG Flash/Energy Icon */}
          <svg
            className="size-4 animate-pulse text-warning"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M13 2L3 14h9v8l10-12h-9z" />
          </svg>
          <CardTitle className="text-xs font-bold tracking-wider text-foreground uppercase">
            Power Monitor
          </CardTitle>
        </div>
        <span className="text-[10px] text-muted-foreground uppercase">
          Unit: Watts (W)
        </span>
      </CardHeader>

      <CardContent className="flex flex-col gap-6 p-6">

      <div className="flex flex-col items-center justify-around gap-8 md:flex-row">
        {/* Total Wattage Radial/Number Display */}
        <div className="relative flex flex-col items-center justify-center">
          <svg className="size-32 -rotate-90 transform">
            {/* Background circle */}
            <circle
              cx="64"
              cy="64"
              r="54"
              className="stroke-muted-foreground/10"
              strokeWidth="6"
              fill="transparent"
            />
            {/* Accent circle indicating total power draw */}
            <circle
              cx="64"
              cy="64"
              r="54"
              className="stroke-primary transition-all duration-300"
              strokeWidth="6"
              fill="transparent"
              strokeDasharray={339.292}
              strokeDashoffset={339.292 - (339.292 * percentage) / 100}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-2xl font-bold tracking-tight text-foreground">
              {totalPower}
            </span>
            <span className="text-[9px] tracking-widest text-muted-foreground uppercase">
              OF {maxCapacity}W
            </span>
          </div>
        </div>

        {/* Per-Room Breakdown Progress Bars */}
        <div className="flex w-full flex-1 flex-col gap-4">
          <div className="text-[10px] tracking-wider text-muted-foreground uppercase">
            Room Breakdowns (Max 165W)
          </div>

          {/* Drawing Room */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-text-secondary uppercase">
                Drawing Room
              </span>
              <span className="font-semibold">{roomPowers.drawingRoom} W</span>
            </div>
            <div className="h-2 w-full border border-border/50 bg-muted/20">
              <div
                className="h-full bg-primary/80 transition-all duration-300"
                style={{ width: `${(roomPowers.drawingRoom / 165) * 100}%` }}
              />
            </div>
          </div>

          {/* Work Room 1 */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-text-secondary uppercase">Work Room 1</span>
              <span className="font-semibold">{roomPowers.workRoom1} W</span>
            </div>
            <div className="h-2 w-full border border-border/50 bg-muted/20">
              <div
                className="h-full bg-primary/80 transition-all duration-300"
                style={{ width: `${(roomPowers.workRoom1 / 165) * 100}%` }}
              />
            </div>
          </div>

          {/* Work Room 2 */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-text-secondary uppercase">Work Room 2</span>
              <span className="font-semibold">{roomPowers.workRoom2} W</span>
            </div>
            <div className="h-2 w-full border border-border/50 bg-muted/20">
              <div
                className="h-full bg-primary/80 transition-all duration-300"
                style={{ width: `${(roomPowers.workRoom2 / 165) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-2 gap-4 border-t border-border/50 pt-4 w-full">
        <div className="flex flex-col gap-1 border border-border bg-background/40 p-3">
          <span className="text-[9px] tracking-widest text-muted-foreground uppercase">
            Energy Consumption
          </span>
          <span className="text-sm font-bold text-foreground">
            {usage.totalKwh.toFixed(4)} kWh
          </span>
        </div>
        <div className="flex flex-col gap-1 border border-border bg-background/40 p-3">
          <span className="text-[9px] tracking-widest text-muted-foreground uppercase">
            Estimated Cost
          </span>
          <span className="text-sm font-bold text-foreground">
            BDT {usage.estimatedCostBdt.toFixed(2)}
          </span>
          <span className="text-[8px] text-muted-foreground uppercase mt-0.5">
            Tariff: {usage.tariffRate} BDT/kWh
          </span>
        </div>
      </div>

      {/* Live Power Load Line Chart (Last 5 Minutes) */}
      <div className="flex flex-col gap-2 border-t border-border/50 pt-4">
        <div className="flex items-center justify-between text-[10px] tracking-wider text-muted-foreground uppercase">
          <span>Live Load History (5m Window)</span>
          <span>Max: {Math.max(150, ...powerHistory.map((h) => h.value), 495)}W</span>
        </div>
        
        {powerHistory.length < 2 ? (
          <div className="flex h-24 items-center justify-center border border-dashed border-border/30 bg-background/10 text-[10px] text-muted-foreground uppercase">
            Awaiting realtime data stream...
          </div>
        ) : (
          <div className="relative w-full overflow-hidden border border-border/40 bg-background/20 p-2">
            <svg
              viewBox="0 0 500 120"
              className="w-full overflow-visible cursor-crosshair"
              onMouseMove={handleMouseMove}
              onMouseLeave={() => setHoveredPoint(null)}
            >
              <defs>
                <linearGradient id="chart-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              {/* Horizontal Grid lines */}
              <line x1="0" y1="20" x2="500" y2="20" stroke="currentColor" className="text-border/20" strokeDasharray="4 4" />
              <line x1="0" y1="60" x2="500" y2="60" stroke="currentColor" className="text-border/20" strokeDasharray="4 4" />
              <line x1="0" y1="100" x2="500" y2="100" stroke="currentColor" className="text-border/20" strokeDasharray="4 4" />
              
              {/* Area under the line */}
              <path d={areaPath} fill="url(#chart-grad)" />
              
              {/* Line path */}
              <path
                d={linePath}
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="text-primary"
              />
              
              {/* Hover grid guidelines */}
              {hoveredPoint && (
                <>
                  {/* Horizontal hover guide line */}
                  <line
                    x1="0"
                    y1={hoveredPoint.y}
                    x2="500"
                    y2={hoveredPoint.y}
                    stroke="var(--primary)"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                    className="opacity-40"
                  />
                  {/* Vertical hover guide line */}
                  <line
                    x1={hoveredPoint.x}
                    y1="0"
                    x2={hoveredPoint.x}
                    y2="120"
                    stroke="var(--primary)"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                    className="opacity-40"
                  />
                  {/* Highlight hovered dot */}
                  <circle
                    cx={hoveredPoint.x}
                    cy={hoveredPoint.y}
                    r="4.5"
                    fill="currentColor"
                    className="text-primary shadow-lg"
                  />
                </>
              )}

              {/* Glowing current value dot */}
              {lastPoint && !hoveredPoint && (
                <>
                  <circle cx={lastPoint.x} cy={lastPoint.y} r="4" fill="currentColor" className="text-primary" />
                  <circle cx={lastPoint.x} cy={lastPoint.y} r="8" fill="currentColor" className="animate-ping text-primary/30" />
                </>
              )}
            </svg>

            {/* Floating hover hint details tooltip */}
            {hoveredPoint && (
              <div
                className="absolute pointer-events-none border border-border/80 bg-background/95 backdrop-blur-md text-foreground px-2.5 py-1.5 text-[9px] font-mono shadow-xl z-50 rounded-sm border-primary/20"
                style={{
                  left: `${(hoveredPoint.x / 500) * 100}%`,
                  top: `${(hoveredPoint.y / 120) * 100}%`,
                  transform: "translate(-50%, -130%)",
                }}
              >
                <div className="font-bold text-primary tracking-wide">{hoveredPoint.value} W</div>
                <div className="text-[7px] text-muted-foreground mt-0.5">{hoveredPoint.time}</div>
              </div>
            )}

            <div className="mt-1 flex justify-between font-mono text-[8px] text-muted-foreground uppercase">
              <span>{powerHistory[0].time}</span>
              <span>{lastPoint?.time}</span>
            </div>
          </div>
        )}
      </div>
      </CardContent>
    </Card>
  )
}

export { PowerMeter }
