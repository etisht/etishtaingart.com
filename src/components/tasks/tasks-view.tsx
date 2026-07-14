"use client"

import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { EmptyState } from "@/components/shared/empty-state"
import { useForm } from "react-hook-form"
import { formatDate } from "@/lib/utils"
import { Plus, Search, Pencil, Trash2, CheckCircle2, Circle, Clock, AlertCircle, CheckSquare } from "lucide-react"

const STATUS_CONFIG = {
  TODO:        { label: "לביצוע",   color: "bg-slate-100 text-slate-600",  icon: Circle },
  IN_PROGRESS: { label: "בתהליך",  color: "bg-blue-100 text-blue-700",    icon: Clock },
  DONE:        { label: "הושלם",   color: "bg-green-100 text-green-700",  icon: CheckCircle2 },
  BLOCKED:     { label: "חסום",    color: "bg-red-100 text-red-700",      icon: AlertCircle },
} as const

type TaskStatus = keyof typeof STATUS_CONFIG

interface Project {
  id: string
  name: string
  client: { name: string }
}

interface Task {
  id: string
  projectId: string
  name: string
  assignee: string | null
  targetDate: string | Date | null
  status: TaskStatus
  notes: string | null
  createdAt: string | Date
  project: Project
}

interface TasksViewProps {
  initialTasks: Task[]
  projects: Project[]
}

const EMPTY_FORM = {
  projectId: "", name: "", assignee: "", targetDate: "", status: "TODO" as TaskStatus, notes: "",
}

export function TasksView({ initialTasks, projects }: TasksViewProps) {
  const [tasks, setTasks] = useState(initialTasks)
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState<TaskStatus | "ALL">("ALL")
  const [filterProject, setFilterProject] = useState("ALL")
  const [open, setOpen] = useState(false)
  const [editTask, setEditTask] = useState<Task | null>(null)
  const [loading, setLoading] = useState(false)

  const form = useForm({ defaultValues: EMPTY_FORM })

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      if (filterStatus !== "ALL" && t.status !== filterStatus) return false
      if (filterProject !== "ALL" && t.projectId !== filterProject) return false
      if (search && !t.name.toLowerCase().includes(search.toLowerCase()) &&
          !t.project.name.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [tasks, filterStatus, filterProject, search])

  const counts = useMemo(() => {
    const c: Record<string, number> = { TODO: 0, IN_PROGRESS: 0, DONE: 0, BLOCKED: 0 }
    tasks.forEach((t) => { c[t.status] = (c[t.status] ?? 0) + 1 })
    return c
  }, [tasks])

  const openNew = () => {
    setEditTask(null)
    form.reset(EMPTY_FORM)
    setOpen(true)
  }

  const openEdit = (t: Task) => {
    setEditTask(t)
    form.reset({
      projectId: t.projectId,
      name: t.name,
      assignee: t.assignee ?? "",
      targetDate: t.targetDate ? new Date(t.targetDate).toISOString().split("T")[0] : "",
      status: t.status,
      notes: t.notes ?? "",
    })
    setOpen(true)
  }

  const onSubmit = async (values: typeof EMPTY_FORM) => {
    setLoading(true)
    try {
      if (editTask) {
        const res = await fetch(`/api/tasks/${editTask.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...values, assignee: values.assignee || null, notes: values.notes || null, targetDate: values.targetDate || null }),
        })
        const updated: Task = await res.json()
        setTasks((prev) => prev.map((t) => t.id === updated.id ? updated : t))
      } else {
        const res = await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...values, assignee: values.assignee || null, notes: values.notes || null, targetDate: values.targetDate || null }),
        })
        const created: Task = await res.json()
        setTasks((prev) => [created, ...prev])
      }
      setOpen(false)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    await fetch(`/api/tasks/${id}`, { method: "DELETE" })
    setTasks((prev) => prev.filter((t) => t.id !== id))
  }

  const toggleDone = async (t: Task) => {
    const newStatus = t.status === "DONE" ? "TODO" : "DONE"
    const res = await fetch(`/api/tasks/${t.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    })
    const updated: Task = await res.json()
    setTasks((prev) => prev.map((x) => x.id === updated.id ? updated : x))
  }

  const changeStatus = async (t: Task, status: TaskStatus) => {
    const res = await fetch(`/api/tasks/${t.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    const updated: Task = await res.json()
    setTasks((prev) => prev.map((x) => x.id === updated.id ? updated : x))
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">משימות</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{tasks.length} משימות</p>
        </div>
        <Button onClick={openNew}>
          <Plus className="h-4 w-4 ml-2" />
          משימה חדשה
        </Button>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-4 gap-3">
        {(Object.entries(STATUS_CONFIG) as [TaskStatus, typeof STATUS_CONFIG[TaskStatus]][]).map(([key, cfg]) => {
          const Icon = cfg.icon
          return (
            <Card
              key={key}
              className={`p-4 cursor-pointer transition-all ${filterStatus === key ? "ring-2 ring-blue-400" : "hover:bg-slate-50"}`}
              onClick={() => setFilterStatus(filterStatus === key ? "ALL" : key)}
            >
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">{cfg.label}</p>
              </div>
              <p className="text-2xl font-bold mt-1">{counts[key] ?? 0}</p>
            </Card>
          )
        })}
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="חיפוש משימה..." value={search} onChange={(e) => setSearch(e.target.value)} className="pr-9" />
        </div>
        <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as TaskStatus | "ALL")}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">כל הסטטוסים</SelectItem>
            {Object.entries(STATUS_CONFIG).map(([k, c]) => (
              <SelectItem key={k} value={k}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterProject} onValueChange={(v) => setFilterProject(v ?? "ALL")}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">כל הפרויקטים</SelectItem>
            {projects.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Task list */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="אין משימות"
          description="הוסף משימה ראשונה"
          action={<Button onClick={openNew} variant="outline" size="sm"><Plus className="h-4 w-4 ml-2" />משימה חדשה</Button>}
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((t) => {
            const cfg = STATUS_CONFIG[t.status]
            const Icon = cfg.icon
            const isOverdue = t.targetDate && t.status !== "DONE" && new Date(t.targetDate) < new Date()
            return (
              <Card key={t.id} className={`transition-all ${t.status === "DONE" ? "opacity-60" : ""}`}>
                <div className="px-4 py-3 flex items-center gap-3">
                  <button onClick={() => toggleDone(t)} className="shrink-0 text-muted-foreground hover:text-green-600 transition-colors">
                    {t.status === "DONE"
                      ? <CheckCircle2 className="h-5 w-5 text-green-600" />
                      : <Circle className="h-5 w-5" />}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`font-medium text-sm ${t.status === "DONE" ? "line-through text-muted-foreground" : ""}`}>
                        {t.name}
                      </span>
                      <Select value={t.status} onValueChange={(v) => changeStatus(t, v as TaskStatus)}>
                        <SelectTrigger className={`h-5 text-xs px-2 rounded-full border-0 ${cfg.color} hover:opacity-80`} style={{ width: "auto", minWidth: "5rem" }}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(STATUS_CONFIG).map(([k, c]) => (
                            <SelectItem key={k} value={k}>{c.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-3 mt-0.5 text-xs text-muted-foreground flex-wrap">
                      <span className="font-medium text-slate-600">{t.project.name}</span>
                      <span>{t.project.client.name}</span>
                      {t.assignee && <span>← {t.assignee}</span>}
                      {t.targetDate && (
                        <span className={isOverdue ? "text-red-500 font-medium" : ""}>
                          {isOverdue ? "⚠ " : ""}יעד: {formatDate(t.targetDate)}
                        </span>
                      )}
                    </div>
                    {t.notes && <p className="text-xs text-muted-foreground mt-1 truncate max-w-lg">{t.notes}</p>}
                  </div>

                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(t)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <ConfirmDialog
                      trigger={
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      }
                      onConfirm={() => handleDelete(t.id)}
                    />
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Add/Edit dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editTask ? "עריכת משימה" : "משימה חדשה"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
              {!editTask && (
                <FormField control={form.control} name="projectId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>פרויקט *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="בחר פרויקט" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {projects.map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.name} — {p.client.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
              )}
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>שם משימה *</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
              )} />
              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="status" render={({ field }) => (
                  <FormItem>
                    <FormLabel>סטטוס</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        {Object.entries(STATUS_CONFIG).map(([k, c]) => (
                          <SelectItem key={k} value={k}>{c.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
                <FormField control={form.control} name="targetDate" render={({ field }) => (
                  <FormItem><FormLabel>תאריך יעד</FormLabel><FormControl><Input type="date" {...field} /></FormControl></FormItem>
                )} />
              </div>
              <FormField control={form.control} name="assignee" render={({ field }) => (
                <FormItem><FormLabel>אחראי</FormLabel><FormControl><Input placeholder="שם האחראי" {...field} /></FormControl></FormItem>
              )} />
              <FormField control={form.control} name="notes" render={({ field }) => (
                <FormItem><FormLabel>הערות</FormLabel><FormControl><Textarea rows={2} {...field} /></FormControl></FormItem>
              )} />
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>ביטול</Button>
                <Button type="submit" disabled={loading}>{loading ? "שומר..." : "שמור"}</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
