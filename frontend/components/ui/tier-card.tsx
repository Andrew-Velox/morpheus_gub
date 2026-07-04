"use client"

import { cn } from "@/lib/utils"
import { HugeiconsIcon } from "@hugeicons/react"
import { Tick02Icon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"

interface TierCardProps {
  name: string
  price: string
  description?: string
  features: string[]
  ctaText?: string
  onCtaClick?: () => void
  highlighted?: boolean
  className?: string
}

function TierCard({
  name,
  price,
  description,
  features,
  ctaText = "Get Started",
  onCtaClick,
  highlighted,
  className,
}: TierCardProps) {
  return (
    <div
      className={cn(
        "w-full border border-midground/15 bg-background-base/80 text-midground",
        highlighted && "border-midground/30",
        className
      )}
    >
      <div className="p-4">
        <h3 className="text-xs tracking-[0.2em] uppercase text-midground/60">
          {name}
        </h3>
        <p className="mt-2 text-2xl tracking-tight">{price}</p>
        {description && (
          <p className="mt-1 text-xs text-midground/50">{description}</p>
        )}
      </div>
      <div className="h-px bg-midground/15" />
      <ul className="space-y-2 p-4">
        {features.map((feature) => (
          <li
            key={feature}
            className="flex items-center gap-2 text-xs tracking-[0.1em] text-midground/70"
          >
            <HugeiconsIcon
              icon={Tick02Icon}
              strokeWidth={2}
              className="size-3 shrink-0 text-midground/50"
            />
            {feature}
          </li>
        ))}
      </ul>
      <div className="border-t border-midground/15 p-4">
        <Button
          variant={highlighted ? "default" : "outline"}
          className="w-full"
          onClick={onCtaClick}
        >
          {ctaText}
        </Button>
      </div>
    </div>
  )
}

export { TierCard }
