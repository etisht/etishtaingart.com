"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { StatusBadge } from "./status-badge"
import { STATUS_CONFIG } from "@/lib/constants"
import { ChevronDown, Check } from "lucide-react"
import type { StatusCode } from "@/generated/prisma/client"

interface StatusSelectProps {
  projectId: string
  currentStatusId: string
  currentCode: StatusCode
  statuses: { id: string; code: StatusCode; label: string; order: number }[]
}

export function StatusSelect({ projectId, currentStatusId, currentCode, statuses }: StatusSelectProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleChange = async (statusId: string) => {
    if (statusId === currentStatusId) return
    setLoading(true)
    await fetch(`/api/projects/${projectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statusId }),
    })
    setLoading(false)
    router.refresh()
  }

  const sorted = [...statuses].sort((a, b) => a.order - b.order)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={loading}
        title="שנה סטטוס"
        className="flex items-center gap-1.5 rounded-full transition-opacity hover:opacity-80 disabled:opacity-50 cursor-pointer"
      >
        <StatusBadge code={currentCode} />
        <ChevronDown className="h-3 w-3 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52" dir="rtl">
        {sorted.map((s) => {
          const cfg = STATUS_CONFIG[s.code]
          const isActive = s.id === currentStatusId
          return (
            <DropdownMenuItem
              key={s.id}
              onClick={() => handleChange(s.id)}
              className="flex items-center justify-between cursor-pointer"
            >
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.bgColor} ${cfg.color}`}>
                {cfg.label}
              </span>
              {isActive && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
