"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Clock, FolderKanban } from "lucide-react"
import { format, subMonths } from "date-fns"
import { he } from "date-fns/locale"

interface ProjectHours {
  projectId: string
  projectName: string
  clientName: string
  hours: number
}

interface ReportData {
  totalHours: number
  projects: ProjectHours[]
}

function getMonthOptions() {
  const now = new Date()
  return Array.from({ length: 13 }, (_, i) => {
    const d = subMonths(now, i)
    return { value: format(d, "yyyy-MM"), label: format(d, "MMMM yyyy", { locale: he }) }
  })
}

export function HoursReportTab() {
  const monthOptions = getMonthOptions()
  const [month, setMonth] = useState(monthOptions[0].value)
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/worklogs/hours-report?month=${month}`)
      .then((res) => res.json())
      .then((d) => setData(d))
      .finally(() => setLoading(false))
  }, [month])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">השעות שלי לפי פרויקט</h3>
        <Select value={month} onValueChange={(value) => value && setMonth(value)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {monthOptions.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="p-4 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
          <Clock className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">סה״כ שעות החודש</p>
          <p className="text-2xl font-bold tabular-nums">{(data?.totalHours ?? 0).toFixed(1)}</p>
        </div>
      </Card>

      <div className="bg-white rounded-xl border border-border/60 overflow-hidden">
        <div className="divide-y divide-border/40">
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-10">טוען...</p>
          ) : !data || data.projects.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-10">לא נרשמו שעות בחודש זה</p>
          ) : (
            data.projects.map((p) => (
              <Link key={p.projectId} href={`/projects/${p.projectId}`}
                className="flex items-center justify-between px-5 py-3 hover:bg-muted/40 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <FolderKanban className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{p.projectName}</p>
                    <p className="text-xs text-muted-foreground truncate">{p.clientName}</p>
                  </div>
                </div>
                <p className="text-sm font-semibold text-blue-600 shrink-0 mr-4 tabular-nums">{p.hours.toFixed(1)} שעות</p>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
