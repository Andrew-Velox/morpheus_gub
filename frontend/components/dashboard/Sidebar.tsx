"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface SidebarProps {
  collapsed?: boolean
  onToggleCollapse?: () => void
}

function Sidebar({
  collapsed,
  onToggleCollapse,
}: SidebarProps) {
  const pathname = usePathname()
  const activeTab = pathname === "/floorplan" ? "floorplan" : "grid"

  return (
    <aside
      className={cn(
        "group/sidebar relative flex shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-200 select-none",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Brand Header */}
      <div className="flex h-14 items-center border-b border-sidebar-border px-5 py-3">
        {!collapsed && (
          <div>
            <span className="text-[10px] tracking-[0.25em] text-sidebar-foreground/50">
              MORPHEUS
            </span>
            <span className="block text-xs font-semibold tracking-[0.15em] text-sidebar-foreground uppercase">
              ENERGY COMMAND
            </span>
          </div>
        )}
      </div>

      {/* Collapse button hovering on the border */}
      <Button
        onClick={onToggleCollapse}
        variant="outline"
        size="icon-xs"
        className="absolute top-4 -right-3 z-50 flex border border-sidebar-border bg-sidebar text-sidebar-foreground/60 shadow-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        aria-label="Toggle Sidebar"
      >
        {collapsed ? (
          <svg
            className="size-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth="2.5"
          >
            <path d="M13 5l7 7-7 7M6 5l7 7-7 7" />
          </svg>
        ) : (
          <svg
            className="size-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth="2.5"
          >
            <path d="M11 19l-7-7 7-7M18 19l-7-7 7-7" />
          </svg>
        )}
      </Button>

      {/* Navigation */}
      <div className="flex flex-col gap-1 px-3 py-4">
        {!collapsed && (
          <span className="px-2 pb-1.5 font-mono text-[10px] tracking-[0.2em] text-sidebar-foreground/40 uppercase">
            Dashboard
          </span>
        )}
        <nav className="flex flex-col gap-0.5 font-mono">
          <Link
            href="/"
            className={cn(
              "group flex cursor-pointer items-center gap-3 border-l-2 px-3 py-2 text-xs tracking-[0.15em] uppercase transition-all",
              collapsed ? "justify-center px-0" : "",
              activeTab === "grid"
                ? "border-sidebar-primary bg-sidebar-accent text-sidebar-primary"
                : "border-transparent text-sidebar-foreground/60 hover:border-sidebar-border hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
          >
            <svg
              className="size-4 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2"
            >
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
            {!collapsed && <span>Status Grid</span>}
          </Link>

          <Link
            href="/floorplan"
            className={cn(
              "group flex cursor-pointer items-center gap-3 border-l-2 px-3 py-2 text-xs tracking-[0.15em] uppercase transition-all",
              collapsed ? "justify-center px-0" : "",
              activeTab === "floorplan"
                ? "border-sidebar-primary bg-sidebar-accent text-sidebar-primary"
                : "border-transparent text-sidebar-foreground/60 hover:border-sidebar-border hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
          >
            <svg
              className="size-4 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
            {!collapsed && <span>3D Floorplan</span>}
          </Link>
        </nav>
      </div>

      {/* Diagnostics footer / floating card when collapsed */}
      <div className="relative mt-auto border-t border-sidebar-border font-mono">
        {collapsed ? (
          <div className="absolute bottom-8 left-24 z-40 w-52 border border-sidebar-border bg-sidebar p-4 shadow-xl">
            <div className="mb-3 flex items-center gap-1.5 text-[10px] font-bold tracking-[0.25em] text-sidebar-foreground/50 uppercase">
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75"></span>
                <span className="relative inline-flex size-1.5 rounded-full bg-success"></span>
              </span>
              DIAGNOSTICS
            </div>
            <div className="flex flex-col gap-1.5 text-[10px] leading-relaxed text-sidebar-foreground/75">
              <div className="flex justify-between">
                <span>DISCORD_BOT:</span>
                <span className="font-semibold text-success">ONLINE</span>
              </div>
              <div className="flex justify-between">
                <span>DATABASE:</span>
                <span className="text-sidebar-foreground/45">LOCAL_IN_MEM</span>
              </div>
              <div className="flex justify-between">
                <span>API_GATEWAY:</span>
                <span className="font-semibold text-success">OK</span>
              </div>
              <div className="flex justify-between">
                <span>LATENCY:</span>
                <span className="font-semibold text-success">2ms</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-5">
            <div className="mb-3 text-[10px] tracking-[0.2em] text-sidebar-foreground/40 uppercase">
              System Diagnostics
            </div>
            <div className="flex flex-col gap-1.5 text-[10px] leading-relaxed text-sidebar-foreground/60">
              <div className="flex justify-between">
                <span>DISCORD_BOT:</span>
                <span className="font-semibold text-success">ONLINE</span>
              </div>
              <div className="flex justify-between">
                <span>DATABASE:</span>
                <span className="text-sidebar-foreground/40">LOCAL_IN_MEM</span>
              </div>
              <div className="flex justify-between">
                <span>API_GATEWAY:</span>
                <span className="font-semibold text-success">OK</span>
              </div>
              <div className="flex justify-between">
                <span>LATENCY:</span>
                <span className="font-semibold text-success">2ms</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}

export { Sidebar }
