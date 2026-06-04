import { cn } from "@/lib/utils"
import { STATUS_CONFIG } from "@/lib/constants"
import type { StatusCode } from "@/generated/prisma/client"

interface StatusBadgeProps {
  code: StatusCode
  className?: string
  size?: "sm" | "md"
}

export function StatusBadge({ code, className, size = "sm" }: StatusBadgeProps) {
  const config = STATUS_CONFIG[code]
  if (!config) return null

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium border whitespace-nowrap",
        size === "sm" ? "px-2.5 py-0.5 text-xs" : "px-3 py-1 text-sm",
        config.bgColor,
        config.color,
        className
      )}
    >
      {config.label}
    </span>
  )
}
