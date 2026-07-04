"use client"

import { useRef } from "react"
import { cn } from "@/lib/utils"

function Switch({
  checked,
  className,
  disabled,
  id,
  onCheckedChange,
  soundType = "ui",
}: {
  checked: boolean
  className?: string
  disabled?: boolean
  id?: string
  onCheckedChange: (checked: boolean) => void
  soundType?: "light" | "fan" | "ui"
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const handlePlaySound = () => {
    if (typeof window !== "undefined") {
      try {
        const soundPath = soundType === "fan" 
          ? "/sounds/fan-toggle.wav" 
          : "/sounds/light-toggle.wav"

        let speed = checked ? 0.85 : 1.15
        if (soundType === "fan") {
          speed = checked ? 0.9 : 1.1
        }

        if (!audioRef.current) {
          audioRef.current = new Audio(soundPath)
        } else if (!audioRef.current.src.endsWith(soundPath)) {
          audioRef.current.src = soundPath
        }

        audioRef.current.playbackRate = speed
        audioRef.current.currentTime = 0
        audioRef.current.play().catch((err) => {
          console.warn("Switch sound play blocked:", err)
        })
      } catch (err) {
        console.error("Error playing switch sound:", err)
      }
    }
  }

  return (
    <button
      aria-checked={checked}
      className={cn(
        "peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center border transition-colors",
        "focus-visible:ring-1 focus-visible:ring-midground/30 focus-visible:outline-none",
        "disabled:cursor-not-allowed disabled:opacity-50",
        checked
          ? "border-midground/30 bg-midground/15"
          : "border-midground/20 bg-background",
        className
      )}
      disabled={disabled}
      id={id}
      onClick={() => {
        handlePlaySound()
        onCheckedChange(!checked)
      }}
      role="switch"
      type="button"
    >
      <span
        aria-hidden
        className={cn(
          "pointer-events-none block h-3.5 w-3.5 transition-transform",
          checked
            ? "translate-x-4 bg-midground"
            : "translate-x-0.5 bg-midground/40"
        )}
      />
    </button>
  )
}

export { Switch }
