import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "text-display inline-flex items-center px-2 py-1 leading-none tracking-[0.2em]",
  {
    variants: {
      variant: {
        default: "border border-midground/15 bg-midground/8 text-midground",
        outline: "border border-midground/30 bg-transparent text-midground/80",
        destructive:
          "border border-destructive/30 bg-destructive/15 text-destructive",
        success: "border border-success/30 bg-success/15 text-success",
        warning: "border border-warning/30 bg-warning/15 text-warning",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
