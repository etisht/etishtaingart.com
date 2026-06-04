"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { StatusBadge } from "./status-badge"
import { ProjectsKanban } from "./projects-kanban"
import { ProjectForm } from "./project-form"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { formatDate, formatCurrency } from "@/lib/utils"
import { PRIORITY_CONFIG } from "@/lib/constants"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Plus, Search, LayoutList, KanbanSquare, MoreHorizontal, Eye, Trash2 } from "lucide-react"
import { EmptyState } from "@/components/shared/empty-state"
import { SortableHeader } from "@/components/shared/sortable-header"
import type { Project, Client, BusinessEntity, ProjectStatus, Cost } from "@/generated/prisma/client"

type ProjectRow = Project & {
  client: Client
  businessEntity: BusinessEntity
  status: ProjectStatus
  costs: Cost[]
  _count: { milestones: number; tasks: number }
}

function calcSalePrice(costs: Cost[]) {
  const oneTime = costs
    .filter((c) => !c.billingType || c.billingType === "ONE_TIME")
    .reduce((s, c) => s + Number(c.amount), 0)
  const annual = costs
    .filter((c) => c.billingType === "MONTHLY")
    .reduce((s, c) => s + Number(c.amount) * 12, 0)
    + costs
    .filter((c) => c.billingType === "YEARLY")
    .reduce((s, c) => s + Number(c.amount), 0)
  return { oneTime, annual, total: oneTime + annual }
}

interface ProjectsViewProps {
  initialProjects: ProjectRow[]
  statuses: ProjectStatus[]
  businessEntities: BusinessEntity[]
}

export function ProjectsView({ initialProjects, statuses, businessEntities }: ProjectsViewProps) {
  const router = useRouter()
  const [projects, setProjects] = useState(initialProjects)
  const [view, setView] = useState<"table" | "kanban">("table")
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState("ALL")
  const [filterEntity, setFilterEntity] = useState("ALL")
  const [showForm, setShowForm] = useState(false)
  const [sortField, setSortField] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<"asc" | "desc" | null>(null)

  const handleSort = (field: string) => {
    if (sortField === field) {
      if (sortDir === "asc") { setSortDir("desc") }
      else if (sortDir === "desc") { setSortField(null); setSortDir(null) }
    } else {
      setSortField(field)
      setSortDir("asc")
    }
  }

  const filtered = useMemo(() => {
    let list = projects.filter((p) => {
      if (filterStatus !== "ALL" && p.status.code !== filterStatus) return false
      if (filterEntity !== "ALL" && p.businessEntityId !== filterEntity) return false
      if (search) {
        const s = search.toLowerCase()
        if (!p.name.toLowerCase().includes(s) && !p.client.name.toLowerCase().includes(s)) return false
      }
      return true
    })
    if (sortField && sortDir) {
      list = [...list].sort((a, b) => {
        let av: unknown, bv: unknown
        if (sortField === "name") { av = a.name; bv = b.name }
        else if (sortField === "client") { av = a.client.name; bv = b.client.name }
        else if (sortField === "status") { av = a.status.order; bv = b.status.order }
        else if (sortField === "value") { av = Number(a.totalContractValue ?? 0); bv = Number(b.totalContractValue ?? 0) }
        else if (sortField === "targetDate") { av = a.targetDate?.toString() ?? ""; bv = b.targetDate?.toString() ?? "" }
        else if (sortField === "updatedAt") { av = a.updatedAt?.toString() ?? ""; bv = b.updatedAt?.toString() ?? "" }
        if (av == null) return 1
        if (bv == null) return -1
        const cmp = av < bv ? -1 : av > bv ? 1 : 0
        return sortDir === "asc" ? cmp : -cmp
      })
    }
    return list
  }, [projects, filterStatus, filterEntity, search, sortField, sortDir])

  const handleDelete = async (id: string) => {
    await fetch(`/api/projects/${id}`, { method: "DELETE" })
    setProjects((prev) => prev.filter((p) => p.id !== id))
  }

  const handleStatusChange = async (projectId: string, statusId: string) => {
    await fetch(`/api/projects/${projectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statusId }),
    })
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p
        const newStatus = statuses.find((s) => s.id === statusId)!
        return { ...p, statusId, status: newStatus }
      })
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">פרויקטים</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{filtered.length} פרויקטים</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={view === "table" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("table")}
          >
            <LayoutList className="h-4 w-4" />
          </Button>
          <Button
            variant={view === "kanban" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("kanban")}
          >
            <KanbanSquare className="h-4 w-4" />
          </Button>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 ml-2" />
            פרויקט חדש
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48 max-w-sm">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="חיפוש פרויקט או לקוח..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-9"
          />
        </div>
        <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v ?? "ALL")}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="כל הסטטוסים" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">כל הסטטוסים</SelectItem>
            {statuses.map((s) => (
              <SelectItem key={s.code} value={s.code}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterEntity} onValueChange={(v) => setFilterEntity(v ?? "ALL")}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="כל הישויות" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">כל הישויות</SelectItem>
            {businessEntities.map((e) => (
              <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {view === "kanban" ? (
        <ProjectsKanban
          projects={filtered}
          statuses={statuses}
          onStatusChange={handleStatusChange}
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            {filtered.length === 0 ? (
              <EmptyState
                title="אין פרויקטים"
                description="צור פרויקט ראשון"
                action={
                  <Button onClick={() => setShowForm(true)} variant="outline" size="sm">
                    <Plus className="h-4 w-4 ml-2" />
                    פרויקט חדש
                  </Button>
                }
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead><SortableHeader label="פרויקט" field="name" sortField={sortField} sortDir={sortDir} onSort={handleSort} /></TableHead>
                    <TableHead><SortableHeader label="לקוח" field="client" sortField={sortField} sortDir={sortDir} onSort={handleSort} /></TableHead>
                    <TableHead><SortableHeader label="סטטוס" field="status" sortField={sortField} sortDir={sortDir} onSort={handleSort} /></TableHead>
                    <TableHead><SortableHeader label="שווי חוזה" field="value" sortField={sortField} sortDir={sortDir} onSort={handleSort} /></TableHead>
                    <TableHead className="text-right">מחיר מכירה</TableHead>
                    <TableHead><SortableHeader label="דדליין" field="targetDate" sortField={sortField} sortDir={sortDir} onSort={handleSort} /></TableHead>
                    <TableHead className="text-right">עדיפות</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((p) => {
                    const priority = PRIORITY_CONFIG[p.priority]
                    const sale = calcSalePrice(p.costs)
                    return (
                      <TableRow key={p.id} className="hover:bg-slate-50">
                        <TableCell>
                          <Link href={`/projects/${p.id}`} className="font-medium hover:text-blue-600 transition-colors">
                            {p.name}
                          </Link>
                          <p className="text-xs text-muted-foreground">{p.businessEntity.name}</p>
                        </TableCell>
                        <TableCell className="text-sm">{p.client.name}</TableCell>
                        <TableCell>
                          <StatusBadge code={p.status.code} />
                        </TableCell>
                        <TableCell className="text-sm">
                          {p.contractOneTime || p.contractRecurring ? (
                            <div>
                              <p className="font-semibold">{formatCurrency(Number(p.totalContractValue ?? 0), p.currency)}/שנה</p>
                              <p className="text-xs text-muted-foreground">
                                {Number(p.contractOneTime ?? 0) > 0 && `${formatCurrency(Number(p.contractOneTime), p.currency)} חד-פעמי`}
                                {Number(p.contractOneTime ?? 0) > 0 && Number(p.contractRecurring ?? 0) > 0 && " + "}
                                {Number(p.contractRecurring ?? 0) > 0 && `${formatCurrency(Number(p.contractRecurring), p.currency)}/${p.contractRecurringType === "MONTHLY" ? "חודש" : "שנה"}`}
                              </p>
                            </div>
                          ) : p.totalContractValue ? (
                            formatCurrency(Number(p.totalContractValue), p.currency)
                          ) : "—"}
                        </TableCell>
                        <TableCell className="text-sm">
                          {sale.total > 0 ? (
                            <div>
                              <p className="font-semibold text-green-700">{formatCurrency(sale.total, p.currency)}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatCurrency(sale.oneTime, p.currency)} + {formatCurrency(sale.annual, p.currency)}/שנה
                              </p>
                            </div>
                          ) : "—"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(p.targetDate)}
                        </TableCell>
                        <TableCell>
                          <span className={`text-xs font-medium ${priority.color}`}>{priority.label}</span>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-muted transition-colors">
                              <MoreHorizontal className="h-4 w-4" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => router.push(`/projects/${p.id}`)}>
                                <Eye className="h-4 w-4 ml-2" />
                                פתח פרויקט
                              </DropdownMenuItem>
                              <ConfirmDialog
                                trigger={
                                  <DropdownMenuItem
                                    onSelect={(e) => e.preventDefault()}
                                    className="text-red-600 focus:text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4 ml-2" />
                                    מחיקה
                                  </DropdownMenuItem>
                                }
                                onConfirm={() => handleDelete(p.id)}
                              />
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {showForm && (
        <ProjectForm
          businessEntities={businessEntities}
          onSaved={(saved) => {
            setShowForm(false)
            setProjects((prev) => [saved as unknown as ProjectRow, ...prev])
          }}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  )
}
