import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"

interface KpiCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: LucideIcon
  iconColor?: string
  iconBg?: string
  className?: string
  valueClassName?: string
}

export function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = "text-primary",
  iconBg = "bg-primary/10",
  className,
  valueClassName,
}: KpiCardProps) {
  return (
    <div className={cn(
      "bg-white rounded-xl p-5 flex items-start gap-4 transition-shadow hover:shadow-md",
      "border border-border/60",
      className
    )}>
      {Icon && (
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", iconBg)}>
          <Icon className={cn("h-5 w-5", iconColor)} />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</p>
        <p className={cn("text-2xl font-bold mt-0.5 tabular-nums", valueClassName)}>{value}</p>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
    </div>
  )
}
