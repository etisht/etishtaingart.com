"use client"

import { useState } from "react"
import Link from "next/link"
import { StatusBadge } from "./status-badge"
import { STATUS_CONFIG, PRIORITY_CONFIG } from "@/lib/constants"
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
    <div className="flex gap-3 overflow-x-auto pb-4" style={{ minHeight: "60vh" }}>
      {statuses.map((status) => {
        const cols = projectsByStatus(status.id)
        const cfg = STATUS_CONFIG[status.code]

        return (
          <div
            key={status.id}
            className={cn(
              "flex flex-col rounded-xl border-2 transition-colors min-w-[240px] w-[240px]",
              overColumnId === status.id ? "border-blue-400 bg-blue-50" : "border-transparent bg-slate-100"
            )}
            onDragOver={(e) => { e.preventDefault(); setOverColumnId(status.id) }}
            onDragLeave={() => setOverColumnId(null)}
            onDrop={(e) => handleDrop(e, status.id)}
          >
            <div className="px-3 py-2.5 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <StatusBadge code={status.code} />
                <span className="text-xs text-muted-foreground font-medium ml-1">{cols.length}</span>
              </div>
            </div>

            <div className="flex-1 p-2 space-y-2 overflow-y-auto">
              {cols.map((p) => {
                const priority = PRIORITY_CONFIG[p.priority]
                return (
                  <div
                    key={p.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, p.id)}
                    className={cn(
                      "bg-white rounded-lg border border-slate-200 p-3 cursor-grab active:cursor-grabbing",
                      "hover:shadow-md hover:border-blue-300 transition-all",
                      draggedId === p.id && "opacity-50"
                    )}
                  >
                    <Link href={`/projects/${p.id}`} onClick={(e) => e.stopPropagation()}>
                      <p className="font-medium text-sm text-slate-800 hover:text-blue-600 transition-colors leading-snug">
                        {p.name}
                      </p>
                    </Link>
                    <p className="text-xs text-muted-foreground mt-1">{p.client.name}</p>

                    <div className="flex items-center justify-between mt-2">
                      {p.totalContractValue ? (
                        <span className="text-xs font-semibold text-slate-700">
                          {formatCurrency(Number(p.totalContractValue), p.currency)}
                        </span>
                      ) : <span />}
                      <span className={`text-xs font-medium ${priority.color}`}>
                        {priority.label}
                      </span>
                    </div>

                    {p.targetDate && (
                      <p className="text-xs text-muted-foreground mt-1.5">
                        יעד: {formatDate(p.targetDate)}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
