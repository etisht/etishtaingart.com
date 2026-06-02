"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatDateRelative, formatDate } from "@/lib/utils"
import { NOTE_TYPE_LABELS } from "@/lib/constants"
import { Plus, MessageSquare, Activity } from "lucide-react"
import type { Note, ActivityLog } from "@/generated/prisma/client"

interface TabNotesProps {
  projectId: string
  notes: Note[]
  activities: ActivityLog[]
}

export function TabNotes({ projectId, notes: initial, activities }: TabNotesProps) {
  const [notes, setNotes] = useState(initial)
  const [content, setContent] = useState("")
  const [noteType, setNoteType] = useState("general")
  const [tab, setTab] = useState<"notes" | "activity">("notes")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!content.trim()) return
    setLoading(true)
    const res = await fetch(`/api/projects/${projectId}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, noteType }),
    })
    const created: Note = await res.json()
    setNotes((prev) => [created, ...prev])
    setContent("")
    setLoading(false)
  }

  const ACTION_LABELS: Record<string, string> = {
    created:        "נוצר",
    updated:        "עודכן",
    status_changed: "סטטוס שונה",
    deleted:        "נמחק",
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 border-b pb-2">
        <Button
          variant={tab === "notes" ? "default" : "ghost"}
          size="sm"
          onClick={() => setTab("notes")}
        >
          <MessageSquare className="h-4 w-4 ml-2" />
          הערות ({notes.length})
        </Button>
        <Button
          variant={tab === "activity" ? "default" : "ghost"}
          size="sm"
          onClick={() => setTab("activity")}
        >
          <Activity className="h-4 w-4 ml-2" />
          היסטוריה ({activities.length})
        </Button>
      </div>

      {tab === "notes" && (
        <>
          {/* Add note */}
          <Card className="p-4">
            <div className="space-y-3">
              <div className="flex gap-2">
                <Select value={noteType} onValueChange={setNoteType}>
                  <SelectTrigger className="w-44">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(NOTE_TYPE_LABELS).map(([v, l]) => (
                      <SelectItem key={v} value={v}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Textarea
                placeholder="הוסף הערה..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={3}
              />
              <div className="flex justify-end">
                <Button size="sm" onClick={handleSubmit} disabled={loading || !content.trim()}>
                  <Plus className="h-3.5 w-3.5 ml-1.5" />
                  {loading ? "שומר..." : "הוסף הערה"}
                </Button>
              </div>
            </div>
          </Card>

          {/* Notes list */}
          {notes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">אין הערות עדיין</p>
          ) : (
            <div className="space-y-3">
              {notes.map((n) => (
                <Card key={n.id} className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs">
                          {NOTE_TYPE_LABELS[n.noteType ?? "general"] ?? n.noteType}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{formatDateRelative(n.createdAt)}</span>
                      </div>
                      <p className="text-sm text-slate-700 whitespace-pre-wrap">{n.content}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {tab === "activity" && (
        <div className="space-y-2">
          {activities.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">אין פעילות עדיין</p>
          ) : (
            activities.map((a) => (
              <div key={a.id} className="flex items-center gap-3 py-2 border-b last:border-0">
                <div className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
                <div className="flex-1">
                  <span className="text-sm font-medium">{ACTION_LABELS[a.action] ?? a.action}</span>
                  {a.action === "status_changed" && a.newValue && (
                    <span className="text-xs text-muted-foreground mr-2">
                      (עודכן סטטוס)
                    </span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground shrink-0">{formatDate(a.createdAt)}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
