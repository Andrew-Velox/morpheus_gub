"use client"

import React, { createContext, useContext } from "react"
import { useDashboard as useDashboardHook } from "@/hooks/useDashboard"

type DashboardContextType = ReturnType<typeof useDashboardHook>

const DashboardContext = createContext<DashboardContextType | null>(null)

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const value = useDashboardHook()
  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  )
}

export function useDashboard() {
  const context = useContext(DashboardContext)
  if (!context) {
    throw new Error("useDashboard must be used within a DashboardProvider")
  }
  return context
}
