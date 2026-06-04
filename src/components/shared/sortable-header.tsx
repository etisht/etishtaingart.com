"use client"

import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"

export type SortDir = "asc" | "desc" | null

interface SortableHeaderProps {
  label: string
  field: string
  sortField: string | null
  sortDir: SortDir
  onSort: (field: string) => void
  className?: string
}

export function SortableHeader({ label, field, sortField, sortDir, onSort, className }: SortableHeaderProps) {
  const isActive = sortField === field
  return (
    <button
      onClick={() => onSort(field)}
      className={cn(
        "flex items-center gap-1 font-medium text-sm hover:text-foreground transition-colors group",
        isActive ? "text-foreground" : "text-muted-foreground",
        className
      )}
    >
      {label}
      <span className="opacity-60 group-hover:opacity-100">
        {isActive && sortDir === "asc" ? (
          <ChevronUp className="h-3.5 w-3.5" />
        ) : isActive && sortDir === "desc" ? (
          <ChevronDown className="h-3.5 w-3.5" />
        ) : (
          <ChevronsUpDown className="h-3.5 w-3.5 opacity-40" />
        )}
      </span>
    </button>
  )
}

export function useSort<T>(items: T[]) {
  return {
    sort: (field: keyof T | string, dir: SortDir) => {
      if (!dir) return items
      return [...items].sort((a, b) => {
        const av = (a as Record<string, unknown>)[field as string]
        const bv = (b as Record<string, unknown>)[field as string]
        if (av == null) return 1
        if (bv == null) return -1
        const cmp = av < bv ? -1 : av > bv ? 1 : 0
        return dir === "asc" ? cmp : -cmp
      })
    }
  }
}
