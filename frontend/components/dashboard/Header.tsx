"use client"

import React, { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { HugeiconsIcon } from "@hugeicons/react"
import { Alert02Icon } from "@hugeicons/core-free-icons"

interface HeaderProps {
  activeAlertsCount?: number
  onToggleSidebar?: () => void
}

function Header({ activeAlertsCount = 2, onToggleSidebar }: HeaderProps) {
  const [time, setTime] = useState("")
  const [mounted, setMounted] = useState(false)
  const { resolvedTheme, setTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
    const updateClock = () => {
      const now = new Date()
      const formatter = new Intl.DateTimeFormat("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
        timeZone: "Asia/Dhaka"
      })
      setTime(formatter.format(now))
    }
    updateClock()
    const interval = setInterval(updateClock, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-card/40 px-4 md:px-6 font-mono text-xs tracking-wider">
      {/* Brand Title */}
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="flex size-7 items-center justify-center border border-border bg-background/50 text-muted-foreground hover:text-foreground cursor-pointer md:hidden"
            title="Toggle Menu"
          >
            <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}
        {/* Animated Hexagonal Grid Core */}
        <div className="relative flex size-6 items-center justify-center">
          <svg
            className="absolute size-6 animate-spin text-primary/40"
            style={{ animationDuration: "12s" }}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <polygon points="12 2 22 8.5 22 20 12 22 2 20 2 8.5" />
          </svg>
          <svg
            className="absolute size-4 animate-spin text-primary"
            style={{ animationDuration: "6s", animationDirection: "reverse" }}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polygon points="12 5 18 8.5 18 15.5 12 19 6 15.5 6 8.5" />
          </svg>
          <div className="size-1.5 rounded-full bg-primary shadow-[0_0_8px_var(--primary)]" />
        </div>

        {/* Text Group */}
        <div className="flex items-baseline gap-2 font-mono">
          <span className="bg-gradient-to-r from-primary via-cyan-400 to-emerald-400 bg-clip-text text-sm font-extrabold tracking-[0.2em] text-transparent uppercase">
            MORPHEUS
          </span>
        </div>
      </div>
      
      {/* Stats and Info Bar */}
      <div className="flex items-center gap-2 md:gap-4">
        {/* Mock Live Connection Status */}
        <div className="flex items-center gap-2 border border-border bg-background/50 px-2 py-1 md:px-2.5 text-success">
          <span className="relative flex size-2">
            <span className="absolute inline-flex h-full w-full animate-ping bg-success opacity-75"></span>
            <span className="relative inline-flex size-2 bg-success"></span>
          </span>
          <span className="text-[10px] font-bold tracking-widest uppercase">
            <span className="hidden sm:inline">SIM_FEED: </span>CONNECTED
          </span>
        </div>

        {/* Mock Active Alerts Count */}
        <div className="flex items-center gap-2 border border-destructive/20 bg-destructive/5 px-2 py-1 md:px-2.5 text-destructive">
          <HugeiconsIcon icon={Alert02Icon} className="size-3.5" />
          <span className="text-[10px] font-bold tracking-widest uppercase">
            <span className="hidden sm:inline">ALERTS: </span>{activeAlertsCount} <span className="hidden sm:inline">ACTIVE</span>
          </span>
        </div>

        {/* Live Mock Server Clock */}
        <div className="flex items-center gap-2 border border-border bg-background/50 px-2 py-1 md:px-2.5 text-muted-foreground">
          <span className="text-[10px] font-bold tracking-widest uppercase">
            <span className="hidden md:inline">BST_TIME: </span>{time || "00:00:00"}
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
