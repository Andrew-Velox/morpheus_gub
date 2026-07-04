"use client"

import { cn } from "@/lib/utils"

interface SimulationHudProps {
  isNightMode: boolean
  onToggle: () => void
}

function SimulationHud({ isNightMode, onToggle }: SimulationHudProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border border-border bg-card/15 p-4 font-mono text-xs">
      <div className="flex items-center gap-2">
        <div className="size-2 animate-ping bg-warning" />
        <span className="font-bold tracking-wider text-text-secondary uppercase">
          Simulation Controller HUD
        </span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-[10px] tracking-widest text-muted-foreground uppercase">
          OFFICE_HOURS:
        </span>
        <button
          onClick={onToggle}
          className={cn(
            "border px-3 py-1 text-[10px] font-bold tracking-widest uppercase transition-all",
            isNightMode
              ? "border-warning/45 bg-warning/10 text-warning"
              : "border-border bg-background/50 text-muted-foreground"
          )}
        >
          {isNightMode ? "NIGHT_MODE (9:00 PM)" : "DAY_MODE (2:00 PM)"}
        </button>
      </div>
    </div>
  )
}

export { SimulationHud }
