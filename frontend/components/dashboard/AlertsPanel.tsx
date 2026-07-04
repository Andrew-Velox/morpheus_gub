"use client"

import React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Alert02Icon, Clock01Icon } from "@hugeicons/core-free-icons"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

export interface AlertItem {
  id: string
  type: "warning" | "critical"
  message: string
  timestamp: string
}

interface AlertsPanelProps {
  alerts: AlertItem[]
}

function AlertsPanel({ alerts }: AlertsPanelProps) {
  return (
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
              className={`flex flex-col gap-2 border p-3 ${
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
  )
}

export { AlertsPanel }
