"use client"

import React, { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { HugeiconsIcon } from "@hugeicons/react"
import { Alert02Icon } from "@hugeicons/core-free-icons"

function Header({ activeAlertsCount = 2 }: { activeAlertsCount?: number }) {
  const [time, setTime] = useState("")
  const [mounted, setMounted] = useState(false)
  const { resolvedTheme, setTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
    const updateClock = () => {
      const now = new Date()
      const hrs = String(now.getHours()).padStart(2, "0")
      const mins = String(now.getMinutes()).padStart(2, "0")
      const secs = String(now.getSeconds()).padStart(2, "0")
      setTime(`${hrs}:${mins}:${secs}`)
    }
    updateClock()
    const interval = setInterval(updateClock, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-card/40 px-6 font-mono text-xs tracking-wider">
      {/* Brand Title */}
      <div className="flex items-center gap-3">
        <div className="size-2.5 animate-pulse bg-primary" />
        <span className="text-sm font-semibold tracking-[0.15em] text-foreground uppercase">
          MORPHEUS // ENERGY_COMMAND
        </span>
      </div>

      {/* Stats and Info Bar */}
      <div className="flex items-center gap-4">
        {/* Mock Live Connection Status */}
        <div className="flex items-center gap-2 border border-border bg-background/50 px-2.5 py-1 text-success">
          <span className="relative flex size-2">
            <span className="absolute inline-flex h-full w-full animate-ping bg-success opacity-75"></span>
            <span className="relative inline-flex size-2 bg-success"></span>
          </span>
          <span className="text-[10px] font-bold tracking-widest uppercase">
            SIM_FEED: CONNECTED
          </span>
        </div>

        {/* Mock Active Alerts Count */}
        <div className="flex items-center gap-2 border border-destructive/20 bg-destructive/5 px-2.5 py-1 text-destructive">
          <HugeiconsIcon icon={Alert02Icon} className="size-3.5" />
          <span className="text-[10px] font-bold tracking-widest uppercase">
            ALERTS: {activeAlertsCount} ACTIVE
          </span>
        </div>

        {/* Live Mock Server Clock */}
        <div className="flex items-center gap-2 border border-border bg-background/50 px-2.5 py-1 text-muted-foreground">
          <span className="text-[10px] font-bold tracking-widest uppercase">
            UTC_TIME: {time || "00:00:00"}
          </span>
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          className="flex size-7 cursor-pointer items-center justify-center border border-border bg-background/50 text-muted-foreground transition-colors hover:bg-muted/30 hover:text-foreground"
          title="Toggle Theme"
        >
          {!mounted || resolvedTheme === "dark" ? (
            /* Sun Icon SVG */
            <svg
              className="size-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
            </svg>
          ) : (
            /* Moon Icon SVG */
            <svg
              className="size-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2"
            >
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>
      </div>
    </header>
  )
}

export { Header }
