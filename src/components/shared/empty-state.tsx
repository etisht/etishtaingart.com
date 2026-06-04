import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 text-center px-4", className)}>
      {Icon && (
        <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
          <Icon className="h-6 w-6 text-muted-foreground/60" />
        </div>
      )}
      <h3 className="text-base font-semibold text-foreground mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground mb-5 max-w-xs">{description}</p>
      )}
      {action}
    </div>
  )
}
