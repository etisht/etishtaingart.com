import { cn } from "@/lib/utils"
import { STATUS_CONFIG } from "@/lib/constants"
import type { StatusCode } from "@/generated/prisma/client"

interface StatusBadgeProps {
  code: StatusCode
  className?: string
}

export function StatusBadge({ code, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[code]
  if (!config) return null

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
        config.bgColor,
        config.color,
        className
      )}
    >
      {config.label}
    </span>
  )
}
