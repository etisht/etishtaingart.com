"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useForm } from "react-hook-form"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { CurrencyDisplay } from "@/components/shared/currency-display"
import { formatDate, formatCurrency } from "@/lib/utils"
import { PAYMENT_STATUS_LABELS } from "@/lib/constants"
import { Plus, Check, Trash2 } from "lucide-react"
import type { Payment, Milestone } from "@/generated/prisma/client"
import type { ProjectFinancials } from "@/lib/calculations"

type PaymentWithMilestone = Payment & { milestone?: Milestone | null }

interface TabPaymentsProps {
  projectId: string
  payments: PaymentWithMilestone[]
  milestones: Milestone[]
  financials: ProjectFinancials
  currency: string
}

export function TabPayments({ projectId, payments: initial, milestones, financials, currency }: TabPaymentsProps) {
  const [payments, setPayments] = useState(initial)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const form = useForm({
    defaultValues: {
      milestoneId: "", amount: "", requestDate: "", paidDate: "",
      status: "PENDING", method: "", invoiceNumber: "", invoiceLink: "", notes: "",
    },
  })

  const onSubmit = async (values: ReturnType<typeof form.getValues>) => {
    setLoading(true)
    const res = await fetch(`/api/projects/${projectId}/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...values, amount: Number(values.amount), milestoneId: values.milestoneId || null }),
    })
    const created: Payment = await res.json()
    setPayments((prev) => [created, ...prev])
    setOpen(false)
    setLoading(false)
  }

  const markPaid = async (p: Payment) => {
    await fetch(`/api/projects/${projectId}/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...p, status: "PAID", paidDate: new Date().toISOString(), amount: Number(p.amount) }),
    })
    setPayments((prev) => prev.map((x) => x.id === p.id ? { ...x, status: "PAID" as const, paidDate: new Date() } : x))
  }

  const handleDelete = async (id: string) => {
    await fetch(`/api/projects/${projectId}/payments/${id}`, { method: "DELETE" }).catch(() => {})
    setPayments((prev) => prev.filter((p) => p.id !== id))
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4 text-center">
          <p className="text-xs text-muted-foreground">שולם</p>
          <p className="text-xl font-bold text-green-600 mt-1">{formatCurrency(financials.totalPaid, currency)}</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-xs text-muted-foreground">יתרה לגבייה</p>
          <p className="text-xl font-bold text-orange-600 mt-1">{formatCurrency(financials.balance, currency)}</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-xs text-muted-foreground">סכום חוזה</p>
          <p className="text-xl font-bold mt-1">{formatCurrency(financials.totalContractValue, currency)}</p>
        </Card>
      </div>

      <div className="flex justify-between items-center">
        <h3 className="font-semibold">תשלומים</h3>
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="h-3.5 w-3.5 ml-1.5" />
          הוסף תשלום
        </Button>
      </div>

      {payments.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground text-sm">אין תשלומים עדיין</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {payments.map((p) => {
            const statusCfg = PAYMENT_STATUS_LABELS[p.status]
            return (
              <Card key={p.id} className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <p className="font-semibold text-lg">{formatCurrency(Number(p.amount), p.currency)}</p>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        p.status === "PAID" ? "bg-green-100 text-green-700" :
                        p.status === "OVERDUE" ? "bg-red-100 text-red-700" :
                        "bg-gray-100 text-gray-600"
                      }`}>{statusCfg}</span>
                    </div>
                    <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                      {p.requestDate && <span>דרישה: {formatDate(p.requestDate)}</span>}
                      {p.paidDate && <span>שולם: {formatDate(p.paidDate)}</span>}
                      {p.method && <span>{p.method}</span>}
                      {p.milestone && <span>מיילסטון: {p.milestone.name}</span>}
                      {p.invoiceNumber && <span>חשבונית #{p.invoiceNumber}</span>}
                    </div>
                    {p.notes && <p className="text-xs text-slate-500 mt-1">{p.notes}</p>}
                  </div>
                  <div className="flex gap-1">
                    {p.status !== "PAID" && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600" onClick={() => markPaid(p)}>
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                    <ConfirmDialog
                      trigger={
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      }
                      onConfirm={() => handleDelete(p.id)}
                    />
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader><DialogTitle>תשלום חדש</DialogTitle></DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
              <FormField control={form.control} name="amount" render={({ field }) => (
                <FormItem><FormLabel>סכום *</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>
              )} />
              {milestones.length > 0 && (
                <FormField control={form.control} name="milestoneId" render={({ field }) => (
                  <FormItem><FormLabel>מיילסטון קשור</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="ללא מיילסטון" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="">ללא מיילסטון</SelectItem>
                        {milestones.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
              )}
              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="status" render={({ field }) => (
                  <FormItem><FormLabel>סטטוס</FormLabel>
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
                <FormField control={form.control} name="method" render={({ field }) => (
                  <FormItem><FormLabel>אמצעי תשלום</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="בחר" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="bank_transfer">העברה בנקאית</SelectItem>
                        <SelectItem value="bit">ביט</SelectItem>
                        <SelectItem value="paypal">PayPal</SelectItem>
                        <SelectItem value="cash">מזומן</SelectItem>
                        <SelectItem value="credit_card">אשראי</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="requestDate" render={({ field }) => (
                  <FormItem><FormLabel>תאריך דרישה</FormLabel><FormControl><Input type="date" {...field} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="paidDate" render={({ field }) => (
                  <FormItem><FormLabel>תאריך תשלום</FormLabel><FormControl><Input type="date" {...field} /></FormControl></FormItem>
                )} />
              </div>
              <FormField control={form.control} name="invoiceNumber" render={({ field }) => (
                <FormItem><FormLabel>מספר חשבונית</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
              )} />
              <FormField control={form.control} name="invoiceLink" render={({ field }) => (
                <FormItem><FormLabel>קישור לחשבונית</FormLabel><FormControl><Input placeholder="https://..." {...field} /></FormControl></FormItem>
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
