"use client"

import { useState } from "react"
import Link from "next/link"
import { StatusBadge } from "./status-badge"
import { STATUS_CONFIG } from "@/lib/constants"
import { formatDate, formatCurrency } from "@/lib/utils"
import { cn } from "@/lib/utils"
import type { Project, Client, BusinessEntity, ProjectStatus } from "@/generated/prisma/client"

type ProjectRow = Project & {
  client: Client
  businessEntity: BusinessEntity
  status: ProjectStatus
  _count: { milestones: number; tasks: number }
}

interface ProjectsKanbanProps {
  projects: ProjectRow[]
  statuses: ProjectStatus[]
  onStatusChange: (projectId: string, statusId: string) => void
}

const PRIORITY_DOTS: Record<string, string> = {
  LOW:    "bg-slate-300",
  MEDIUM: "bg-blue-400",
  HIGH:   "bg-orange-400",
  URGENT: "bg-red-500",
}

export function ProjectsKanban({ projects, statuses, onStatusChange }: ProjectsKanbanProps) {
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [overColumnId, setOverColumnId] = useState<string | null>(null)

  const projectsByStatus = (statusId: string) =>
    projects.filter((p) => p.statusId === statusId)

  const handleDragStart = (e: React.DragEvent, projectId: string) => {
    setDraggedId(projectId)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDrop = (e: React.DragEvent, statusId: string) => {
    e.preventDefault()
    if (draggedId) {
      const project = projects.find((p) => p.id === draggedId)
      if (project && project.statusId !== statusId) {
        onStatusChange(draggedId, statusId)
      }
    }
    setDraggedId(null)
    setOverColumnId(null)
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-4" style={{ minHeight: "65vh" }}>
      {statuses.map((status) => {
        const cols = projectsByStatus(status.id)
        const isOver = overColumnId === status.id

        return (
          <div
            key={status.id}
            className={cn(
              "flex flex-col rounded-xl transition-all min-w-[232px] w-[232px] border",
              isOver
                ? "border-primary/40 bg-primary/5 shadow-sm"
                : "border-border/60 bg-muted/40"
            )}
            onDragOver={(e) => { e.preventDefault(); setOverColumnId(status.id) }}
            onDragLeave={() => setOverColumnId(null)}
            onDrop={(e) => handleDrop(e, status.id)}
          >
            {/* Column header */}
            <div className="px-3 py-3 flex items-center justify-between">
              <StatusBadge code={status.code} />
              {cols.length > 0 && (
                <span className="text-xs text-muted-foreground font-semibold bg-background rounded-full w-5 h-5 flex items-center justify-center border border-border/60">
                  {cols.length}
                </span>
              )}
            </div>

            {/* Cards */}
            <div className="flex-1 px-2 pb-2 space-y-2 overflow-y-auto">
              {cols.map((p) => (
                <div
                  key={p.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, p.id)}
                  className={cn(
                    "bg-white rounded-lg border border-border/60 p-3 cursor-grab active:cursor-grabbing",
                    "hover:shadow-md hover:border-primary/30 transition-all duration-150",
                    draggedId === p.id && "opacity-40 scale-95"
                  )}
                >
                  {/* Priority dot + name */}
                  <div className="flex items-start gap-2">
                    <div className={cn("w-1.5 h-1.5 rounded-full mt-1.5 shrink-0", PRIORITY_DOTS[p.priority])} />
                    <Link
                      href={`/projects/${p.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-sm font-semibold text-foreground hover:text-primary transition-colors leading-snug"
                    >
                      {p.name}
                    </Link>
                  </div>

                  {/* Client */}
                  <p className="text-xs text-muted-foreground mt-1.5 mr-3.5">{p.client.name}</p>

                  {/* Footer */}
                  <div className="flex items-center justify-between mt-2.5 mr-3.5">
                    {p.totalContractValue ? (
                      <span className="text-xs font-bold text-foreground/80">
                        {formatCurrency(Number(p.totalContractValue), p.currency)}
                      </span>
                    ) : <span />}
                    {p.targetDate && (
                      <span className="text-xs text-muted-foreground">
                        {formatDate(p.targetDate)}
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {/* Drop zone hint when empty */}
              {cols.length === 0 && isOver && (
                <div className="border-2 border-dashed border-primary/30 rounded-lg h-16 flex items-center justify-center">
                  <span className="text-xs text-primary/60">שחרר כאן</span>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
