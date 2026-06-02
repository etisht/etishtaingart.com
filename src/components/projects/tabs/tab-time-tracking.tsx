"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useForm, useWatch } from "react-hook-form"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { formatDate, formatCurrency, calcHoursFromTimeRange } from "@/lib/utils"
import { WORK_TYPE_LABELS, PERFORMER_TYPE_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/constants"
import { Plus, Trash2, Clock } from "lucide-react"
import type { WorkLog } from "@/generated/prisma/client"
import type { ProjectFinancials } from "@/lib/calculations"

interface TabTimeTrackingProps {
  projectId: string
  worklogs: WorkLog[]
  financials: ProjectFinancials
  currency: string
}

export function TabTimeTracking({ projectId, worklogs: initial, financials, currency }: TabTimeTrackingProps) {
  const [logs, setLogs] = useState(initial)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const form = useForm({
    defaultValues: {
      workDate: new Date().toISOString().split("T")[0],
      startTime: "", endTime: "", totalHours: "",
      performedBy: "אתי", performerType: "INTERNAL",
      workType: "DEVELOPMENT", workDescription: "",
      billable: true, hourlyRate: "", calculatedCost: "",
      supplierId: "", supplierPaymentStatus: "PENDING",
      invoiceLink: "", notes: "",
    },
  })

  const startTime = useWatch({ control: form.control, name: "startTime" })
  const endTime = useWatch({ control: form.control, name: "endTime" })
  const hourlyRate = useWatch({ control: form.control, name: "hourlyRate" })
  const performerType = useWatch({ control: form.control, name: "performerType" })

  const autoCalcHours = () => {
    if (startTime && endTime) {
      const hours = calcHoursFromTimeRange(startTime, endTime)
      form.setValue("totalHours", String(hours))
      if (hourlyRate) {
        form.setValue("calculatedCost", String(hours * Number(hourlyRate)))
      }
    }
  }

  const onSubmit = async (values: ReturnType<typeof form.getValues>) => {
    setLoading(true)
    const res = await fetch(`/api/projects/${projectId}/worklogs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...values,
        totalHours: Number(values.totalHours),
        hourlyRate: values.hourlyRate ? Number(values.hourlyRate) : null,
        calculatedCost: values.calculatedCost ? Number(values.calculatedCost) : null,
        supplierPaymentStatus: performerType === "EXTERNAL" ? values.supplierPaymentStatus : null,
      }),
    })
    const created: WorkLog = await res.json()
    setLogs((prev) => [created, ...prev])
    setOpen(false)
    setLoading(false)
    form.reset()
  }

  const handleDelete = async (id: string) => {
    await fetch(`/api/projects/${projectId}/worklogs/${id}`, { method: "DELETE" }).catch(() => {})
    setLogs((prev) => prev.filter((l) => l.id !== id))
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-4 text-center">
          <p className="text-xs text-muted-foreground">סה״כ שעות</p>
          <p className="text-xl font-bold mt-1">{financials.totalHours.toFixed(1)}</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-xs text-muted-foreground">שעות אתי</p>
          <p className="text-xl font-bold text-blue-600 mt-1">{financials.internalHours.toFixed(1)}</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-xs text-muted-foreground">עלות ספקים</p>
          <p className="text-xl font-bold text-orange-600 mt-1">{formatCurrency(financials.externalCosts, currency)}</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-xs text-muted-foreground">מחיר אפקטיבי / שעה</p>
          <p className="text-xl font-bold text-green-600 mt-1">
            {financials.effectiveHourlyRate > 0 ? formatCurrency(financials.effectiveHourlyRate, currency) : "—"}
          </p>
        </Card>
      </div>

      <div className="flex justify-between items-center">
        <h3 className="font-semibold">רשומות עבודה</h3>
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="h-3.5 w-3.5 ml-1.5" />
          הוסף רשומת עבודה
        </Button>
      </div>

      {logs.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground text-sm">אין רשומות עבודה עדיין</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {logs.map((l) => (
            <Card key={l.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold">{Number(l.totalHours).toFixed(1)} שעות</span>
                    <Badge variant="outline" className="text-xs">{WORK_TYPE_LABELS[l.workType]}</Badge>
                    <Badge variant="outline" className={`text-xs ${
                      l.performerType === "INTERNAL" ? "border-blue-300 text-blue-700" :
                      l.performerType === "EXTERNAL" ? "border-orange-300 text-orange-700" :
                      "border-purple-300 text-purple-700"
                    }`}>
                      {l.performedBy} ({PERFORMER_TYPE_LABELS[l.performerType]})
                    </Badge>
                  </div>
                  <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                    <span>{formatDate(l.workDate)}</span>
                    {l.startTime && l.endTime && <span>{l.startTime}–{l.endTime}</span>}
                    {l.calculatedCost && <span className="font-medium text-slate-700">{formatCurrency(Number(l.calculatedCost), currency)}</span>}
                    {l.performerType === "EXTERNAL" && l.supplierPaymentStatus && (
                      <span className={l.supplierPaymentStatus === "PAID" ? "text-green-600" : "text-orange-600"}>
                        {PAYMENT_STATUS_LABELS[l.supplierPaymentStatus]}
                      </span>
                    )}
                  </div>
                  {l.workDescription && <p className="text-xs text-slate-600 mt-1">{l.workDescription}</p>}
                </div>
                <ConfirmDialog
                  trigger={
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  }
                  onConfirm={() => handleDelete(l.id)}
                />
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader><DialogTitle>רשומת עבודה חדשה</DialogTitle></DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
              <FormField control={form.control} name="workDate" render={({ field }) => (
                <FormItem><FormLabel>תאריך עבודה</FormLabel><FormControl><Input type="date" {...field} /></FormControl></FormItem>
              )} />
              <div className="grid grid-cols-3 gap-3">
                <FormField control={form.control} name="startTime" render={({ field }) => (
                  <FormItem>
                    <FormLabel>שעת התחלה</FormLabel>
                    <FormControl><Input type="time" {...field} onBlur={autoCalcHours} /></FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="endTime" render={({ field }) => (
                  <FormItem>
                    <FormLabel>שעת סיום</FormLabel>
                    <FormControl><Input type="time" {...field} onBlur={autoCalcHours} /></FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="totalHours" render={({ field }) => (
                  <FormItem>
                    <FormLabel>שעות *</FormLabel>
                    <FormControl><Input type="number" step="0.25" {...field} /></FormControl>
                  </FormItem>
                )} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="performedBy" render={({ field }) => (
                  <FormItem><FormLabel>מבצע העבודה</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="performerType" render={({ field }) => (
                  <FormItem><FormLabel>סוג מבצע</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        {Object.entries(PERFORMER_TYPE_LABELS).map(([v, l]) => (
                          <SelectItem key={v} value={v}>{l}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="workType" render={({ field }) => (
                <FormItem><FormLabel>סוג עבודה</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {Object.entries(WORK_TYPE_LABELS).map(([v, l]) => (
                        <SelectItem key={v} value={v}>{l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )} />
              <FormField control={form.control} name="workDescription" render={({ field }) => (
                <FormItem><FormLabel>תיאור העבודה</FormLabel><FormControl><Textarea rows={2} {...field} /></FormControl></FormItem>
              )} />
              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="hourlyRate" render={({ field }) => (
                  <FormItem><FormLabel>תעריף שעתי</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="calculatedCost" render={({ field }) => (
                  <FormItem><FormLabel>עלות מחושבת</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>
                )} />
              </div>
              {performerType === "EXTERNAL" && (
                <div className="space-y-3 border-t pt-3">
                  <p className="text-sm font-medium text-muted-foreground">פרטי ספק חיצוני</p>
                  <FormField control={form.control} name="supplierId" render={({ field }) => (
                    <FormItem><FormLabel>שם ספק</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                  )} />
                  <div className="grid grid-cols-2 gap-3">
                    <FormField control={form.control} name="supplierPaymentStatus" render={({ field }) => (
                      <FormItem><FormLabel>סטטוס תשלום לספק</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>
                            {Object.entries(PAYMENT_STATUS_LABELS).map(([v, l]) => (
                              <SelectItem key={v} value={v}>{l}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="invoiceLink" render={({ field }) => (
                      <FormItem><FormLabel>קישור חשבונית</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                    )} />
                  </div>
                </div>
              )}
              <FormField control={form.control} name="billable" render={({ field }) => (
                <FormItem className="flex items-center gap-3">
                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  <FormLabel className="!mt-0">לחיוב לקוח</FormLabel>
                </FormItem>
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
