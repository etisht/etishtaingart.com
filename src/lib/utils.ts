import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, formatDistanceToNow } from "date-fns"
import { he } from "date-fns/locale"
import { CURRENCY_SYMBOLS } from "./constants"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(
  amount: number | string | null | undefined,
  currency = "ILS"
): string {
  if (amount == null) return "—"
  const num = typeof amount === "string" ? parseFloat(amount) : amount
  if (isNaN(num)) return "—"
  const symbol = CURRENCY_SYMBOLS[currency] ?? currency
  return `${symbol}${num.toLocaleString("he-IL", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—"
  const d = typeof date === "string" ? new Date(date) : date
  return format(d, "dd/MM/yyyy")
}

export function formatDateRelative(date: Date | string | null | undefined): string {
  if (!date) return "—"
  const d = typeof date === "string" ? new Date(date) : date
  return formatDistanceToNow(d, { addSuffix: true, locale: he })
}

export function formatHours(hours: number | string | null | undefined): string {
  if (hours == null) return "—"
  const h = typeof hours === "string" ? parseFloat(hours) : hours
  if (isNaN(h)) return "—"
  return `${h.toFixed(1)} שעות`
}

export function calcHoursFromTimeRange(start: string, end: string): number {
  const [sh, sm] = start.split(":").map(Number)
  const [eh, em] = end.split(":").map(Number)
  const diff = (eh * 60 + em) - (sh * 60 + sm)
  return Math.max(0, diff / 60)
}

export function toDecimal(value: number | string | null | undefined): number {
  if (value == null) return 0
  const n = typeof value === "string" ? parseFloat(value) : value
  return isNaN(n) ? 0 : n
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0].toUpperCase())
    .slice(0, 2)
    .join("")
}
