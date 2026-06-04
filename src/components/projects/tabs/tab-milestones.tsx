"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form"
import { useForm } from "react-hook-form"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { CurrencyDisplay } from "@/components/shared/currency-display"
import { formatDate, formatCurrency } from "@/lib/utils"
import { Plus, Pencil, Trash2, Check } from "lucide-react"
import type { Milestone } from "@/generated/prisma/client"
import type { ProjectFinancials } from "@/lib/calculations"

const EXEC_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING:     { label: "טרם התחיל", color: "bg-gray-100 text-gray-600" },
  IN_PROGRESS: { label: "בתהליך",    color: "bg-blue-100 text-blue-700" },
  COMPLETED:   { label: "הושלם",     color: "bg-green-100 text-green-700" },
  BLOCKED:     { label: "חסום",      color: "bg-red-100 text-red-700" },
}

const PAY_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING:   { label: "לא שולם",      color: "bg-gray-100 text-gray-600" },
  REQUESTED: { label: "נשלחה דרישה", color: "bg-yellow-100 text-yellow-700" },
  PARTIAL:   { label: "חלקי",         color: "bg-orange-100 text-orange-700" },
  PAID:      { label: "שולם",         color: "bg-green-100 text-green-700" },
  OVERDUE:   { label: "באיחור",       color: "bg-red-100 text-red-700" },
  CANCELLED: { label: "בוטל",         color: "bg-gray-100 text-gray-400" },
}

interface TabMilestonesProps {
  projectId: string
  milestones: Milestone[]
  financials: ProjectFinancials
  currency: string
}

export function TabMilestones({ projectId, milestones: initial, financials, currency }: TabMilestonesProps) {
  const [milestones, setMilestones] = useState(initial)
  const [open, setOpen] = useState(false)
  const [editItem, setEditItem] = useState<Milestone | null>(null)
  const [loading, setLoading] = useState(false)

  const form = useForm({
    defaultValues: {
      name: "", description: "", amount: "", percentage: "",
      targetDate: "", executionStatus: "PENDING", paymentStatus: "PENDING",
      paidAmount: "", paidAt: "", notes: "",
    },
  })

  const openNew = () => {
    setEditItem(null)
    form.reset({ name: "", description: "", amount: "", percentage: "",
      targetDate: "", executionStatus: "PENDING", paymentStatus: "PENDING",
      paidAmount: "", paidAt: "", notes: "" })
    setOpen(true)
  }

  const openEdit = (m: Milestone) => {
    setEditItem(m)
    form.reset({
      name: m.name,
      description: m.description ?? "",
      amount: m.amount ? String(Number(m.amount)) : "",
      percentage: m.percentage ? String(Number(m.percentage)) : "",
      targetDate: m.targetDate ? new Date(m.targetDate).toISOString().split("T")[0] : "",
      executionStatus: m.executionStatus,
      paymentStatus: m.paymentStatus,
      paidAmount: m.paidAmount ? String(Number(m.paidAmount)) : "",
      paidAt: m.paidAt ? new Date(m.paidAt).toISOString().split("T")[0] : "",
      notes: m.notes ?? "",
    })
    setOpen(true)
  }

  const onSubmit = async (values: Record<string, string>) => {
    setLoading(true)
    const body = {
      ...values,
      amount: values.amount ? Number(values.amount) : null,
      percentage: values.percentage ? Number(values.percentage) : null,
      paidAmount: values.paidAmount ? Number(values.paidAmount) : null,
    }
    try {
      if (editItem) {
        const res = await fetch(`/api/projects/${projectId}/milestones/${editItem.id}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
        })
        const updated: Milestone = await res.json()
        setMilestones((prev) => prev.map((m) => m.id === updated.id ? updated : m))
      } else {
        const res = await fetch(`/api/projects/${projectId}/milestones`, {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
        })
        const created: Milestone = await res.json()
        setMilestones((prev) => [...prev, created])
      }
      setOpen(false)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    await fetch(`/api/projects/${projectId}/milestones/${id}`, { method: "DELETE" })
    setMilestones((prev) => prev.filter((m) => m.id !== id))
  }

  const markComplete = async (m: Milestone) => {
    const res = await fetch(`/api/projects/${projectId}/milestones/${m.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ executionStatus: "COMPLETED", completedAt: new Date().toISOString() }),
    })
    const updated: Milestone = await res.json()
    setMilestones((prev) => prev.map((x) => x.id === updated.id ? updated : x))
  }

  const totalMilestoneAmount = milestones.reduce((s, m) => s + Number(m.amount ?? 0), 0)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4 text-center">
          <p className="text-xs text-muted-foreground">סה״כ מיילסטונים</p>
          <p className="text-xl font-bold mt-1">{milestones.length}</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-xs text-muted-foreground">הושלמו</p>
          <p className="text-xl font-bold text-green-600 mt-1">
            {milestones.filter((m) => m.executionStatus === "COMPLETED").length}
          </p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-xs text-muted-foreground">סה״כ שווי</p>
          <p className="text-xl font-bold mt-1">{formatCurrency(totalMilestoneAmount, currency)}</p>
        </Card>
      </div>

      <div className="flex justify-between items-center">
        <h3 className="font-semibold">מיילסטונים</h3>
        <Button size="sm" onClick={openNew}>
          <Plus className="h-3.5 w-3.5 ml-1.5" />
          הוסף מיילסטון
        </Button>
      </div>

      {milestones.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground text-sm">אין מיילסטונים עדיין</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {milestones.map((m) => {
            const execCfg = EXEC_STATUS_LABELS[m.executionStatus]
            const payCfg = PAY_STATUS_LABELS[m.paymentStatus]
            return (
              <Card key={m.id} className="overflow-hidden">
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium">{m.name}</p>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${execCfg.color}`}>{execCfg.label}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${payCfg.color}`}>{payCfg.label}</span>
                      </div>
                      {m.description && <p className="text-sm text-muted-foreground mt-1">{m.description}</p>}
                      <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                        {m.targetDate && <span>יעד: {formatDate(m.targetDate)}</span>}
                        {m.paidAt && <span>שולם: {formatDate(m.paidAt)}</span>}
                        {m.amount && <span className="font-semibold text-slate-700">{formatCurrency(Number(m.amount), currency)}</span>}
                        {m.paidAmount && <span className="text-green-600">שולם: {formatCurrency(Number(m.paidAmount), currency)}</span>}
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {m.executionStatus !== "COMPLETED" && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-green-600" onClick={() => markComplete(m)} title="סמן כהושלם">
                          <Check className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(m)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <ConfirmDialog
                        trigger={
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        }
                        onConfirm={() => handleDelete(m.id)}
                      />
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader><DialogTitle>{editItem ? "עריכת מיילסטון" : "מיילסטון חדש"}</DialogTitle></DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>שם *</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
              )} />
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem><FormLabel>תיאור</FormLabel><FormControl><Textarea rows={2} {...field} /></FormControl></FormItem>
              )} />
              <div className="grid grid-cols-3 gap-3">
                <FormField control={form.control} name="amount" render={({ field }) => (
                  <FormItem><FormLabel>סכום</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="percentage" render={({ field }) => (
                  <FormItem><FormLabel>אחוז</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="targetDate" render={({ field }) => (
                  <FormItem><FormLabel>תאריך יעד</FormLabel><FormControl><Input type="date" {...field} /></FormControl></FormItem>
                )} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="executionStatus" render={({ field }) => (
                  <FormItem><FormLabel>סטטוס ביצוע</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        {Object.entries(EXEC_STATUS_LABELS).map(([v, c]) => (
                          <SelectItem key={v} value={v}>{c.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
                <FormField control={form.control} name="paymentStatus" render={({ field }) => (
                  <FormItem><FormLabel>סטטוס תשלום</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        {Object.entries(PAY_STATUS_LABELS).map(([v, c]) => (
                          <SelectItem key={v} value={v}>{c.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="paidAmount" render={({ field }) => (
                  <FormItem><FormLabel>סכום ששולם</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="paidAt" render={({ field }) => (
                  <FormItem><FormLabel>תאריך תשלום</FormLabel><FormControl><Input type="date" {...field} /></FormControl></FormItem>
                )} />
              </div>
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
