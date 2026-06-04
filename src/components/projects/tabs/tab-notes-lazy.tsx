"use client"

import { useState, useEffect } from "react"
import { TabNotes } from "./tab-notes"
import type { Note, ActivityLog } from "@/generated/prisma/client"

interface Props {
  projectId: string
}

export function TabNotesLazy({ projectId }: Props) {
  const [notes, setNotes] = useState<Note[] | null>(null)
  const [activities, setActivities] = useState<ActivityLog[]>([])

  useEffect(() => {
    Promise.all([
      fetch(`/api/projects/${projectId}/notes`).then((r) => r.json()),
      fetch(`/api/projects/${projectId}/activities`).then((r) => r.json()).catch(() => []),
    ]).then(([n, a]) => {
      setNotes(n)
      setActivities(a)
    })
  }, [projectId])

  if (notes === null) {
    return (
      <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
        <span className="animate-pulse">טוען הערות...</span>
      </div>
    )
  }

  return <TabNotes projectId={projectId} notes={notes} activities={activities} />
}
