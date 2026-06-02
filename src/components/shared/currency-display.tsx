import { formatCurrency } from "@/lib/utils"
import { cn } from "@/lib/utils"

interface CurrencyDisplayProps {
  amount: number | string | null | undefined
  currency?: string
  className?: string
  highlightPositive?: boolean
}

export function CurrencyDisplay({ amount, currency = "ILS", className, highlightPositive }: CurrencyDisplayProps) {
  const num = typeof amount === "string" ? parseFloat(amount) : (amount ?? 0)
  const isPositive = num > 0
  const isNegative = num < 0

  return (
    <span
      className={cn(
        "font-mono tabular-nums",
        highlightPositive && isPositive && "text-green-600",
        highlightPositive && isNegative && "text-red-600",
        className
      )}
    >
      {formatCurrency(amount, currency)}
    </span>
  )
}
