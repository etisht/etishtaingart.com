"use client"

import { useState, useEffect } from "react"
import { TabTimeTracking } from "./tab-time-tracking"
import { calculateProjectFinancials } from "@/lib/calculations"
import type { WorkLog } from "@/generated/prisma/client"

interface Props {
  projectId: string
  currency: string
}

export function TabTimeTrackingLazy({ projectId, currency }: Props) {
  const [worklogs, setWorklogs] = useState<WorkLog[] | null>(null)

  useEffect(() => {
    fetch(`/api/projects/${projectId}/worklogs`)
      .then((r) => r.json())
      .then(setWorklogs)
  }, [projectId])

  if (worklogs === null) {
    return (
      <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
        <span className="animate-pulse">טוען שעות עבודה...</span>
      </div>
    )
  }

  const financials = calculateProjectFinancials(null, [], [], worklogs)

  return (
    <TabTimeTracking
      projectId={projectId}
      worklogs={worklogs}
      financials={financials}
      currency={currency}
    />
  )
}
