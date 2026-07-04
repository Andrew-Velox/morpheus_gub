"use client"

import { cn } from "@/lib/utils"

function Switch({
  checked,
  className,
  disabled,
  id,
  onCheckedChange,
}: {
  checked: boolean
  className?: string
  disabled?: boolean
  id?: string
  onCheckedChange: (checked: boolean) => void
}) {
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
      onClick={() => onCheckedChange(!checked)}
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
