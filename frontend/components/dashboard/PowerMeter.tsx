"use client"

import React from "react"

interface PowerMeterProps {
  totalPower: number // calculated in parent
  roomPowers: {
    drawingRoom: number
    workRoom1: number
    workRoom2: number
  }
}

function PowerMeter({ totalPower, roomPowers }: PowerMeterProps) {
  const maxCapacity = 495 // 6 fans * 60W + 9 lights * 15W = 495W
  const percentage = Math.min(100, Math.round((totalPower / maxCapacity) * 100))

  return (
    <div className="flex flex-col gap-6 border border-border bg-card/20 p-6 font-mono">
      <div className="flex items-center justify-between border-b border-border/50 pb-3">
        <div className="flex items-center gap-2">
          {/* Custom SVG Flash/Energy Icon */}
          <svg
            className="size-4 animate-pulse text-warning"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M13 2L3 14h9v8l10-12h-9z" />
          </svg>
          <span className="text-xs font-bold tracking-wider text-foreground uppercase">
            Power Monitor
          </span>
        </div>
        <span className="text-[10px] text-muted-foreground uppercase">
          Unit: Watts (W)
        </span>
      </div>

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
    </div>
  )
}

export { PowerMeter }
