"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useForm } from "react-hook-form"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { formatDate, formatCurrency } from "@/lib/utils"
import { COST_TYPE_LABELS, BILLING_TYPE_LABELS, CURRENCY_OPTIONS } from "@/lib/constants"
import { Plus, Trash2 } from "lucide-react"
import type { Cost } from "@/generated/prisma/client"
import type { ProjectFinancials } from "@/lib/calculations"

interface TabCostsProps {
  projectId: string
  costs: Cost[]
  financials: ProjectFinancials
  currency: string
}

const BILLING_BADGE: Record<string, { label: string; color: string }> = {
  ONE_TIME: { label: "חד פעמי", color: "bg-blue-100 text-blue-700" },
  MONTHLY:  { label: "חודשי",   color: "bg-purple-100 text-purple-700" },
  YEARLY:   { label: "שנתי",    color: "bg-orange-100 text-orange-700" },
}

export function TabCosts({ projectId, costs: initial, financials, currency }: TabCostsProps) {
  const [costs, setCosts] = useState(initial)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const form = useForm({
    defaultValues: {
      costType: "DEVELOPMENT", billingType: "ONE_TIME", description: "", vendor: "",
      amount: "", currency: currency, date: "",
      isPaid: false, paymentMethod: "", invoiceLink: "", notes: "",
    },
  })

  type FormValues = { costType: string; billingType: string; description: string; vendor: string; amount: string; currency: string; date: string; isPaid: boolean; paymentMethod: string; invoiceLink: string; notes: string }

  const onSubmit = async (values: FormValues) => {
    setLoading(true)
    const res = await fetch(`/api/projects/${projectId}/costs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...values, amount: Number(values.amount) }),
    })
    const created: Cost = await res.json()
    setCosts((prev) => [created, ...prev])
    setOpen(false)
    form.reset()
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    await fetch(`/api/projects/${projectId}/costs/${id}`, { method: "DELETE" }).catch(() => {})
    setCosts((prev) => prev.filter((c) => c.id !== id))
  }

  const grouped = Object.entries(COST_TYPE_LABELS).map(([key, label]) => ({
    key, label,
    items: costs.filter((c) => c.costType === key),
    total: costs.filter((c) => c.costType === key).reduce((s, c) => s + Number(c.amount), 0),
  })).filter((g) => g.items.length > 0)

  const localOneTime = costs
    .filter((c) => !c.billingType || c.billingType === "ONE_TIME")
    .reduce((s, c) => s + Number(c.amount), 0)
  const localMonthly = costs
    .filter((c) => c.billingType === "MONTHLY")
    .reduce((s, c) => s + Number(c.amount), 0)
  const localYearly = costs
    .filter((c) => c.billingType === "YEARLY")
    .reduce((s, c) => s + Number(c.amount), 0)
  const localAnnual = localMonthly * 12 + localYearly
  const localSalePrice = localOneTime + localAnnual

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4 col-span-2" style={{ background: "oklch(0.97 0.02 145)", border: "1px solid oklch(0.85 0.08 145)" }}>
          <p className="text-xs text-muted-foreground mb-2 font-medium">מחיר מכירה = חד פעמי + שימוש שנה אחת</p>
          <div className="flex items-end gap-6 flex-wrap">
            <div>
              <p className="text-xs text-muted-foreground">חד פעמי</p>
              <p className="text-base font-semibold">{formatCurrency(localOneTime, currency)}</p>
            </div>
            <div className="text-muted-foreground text-sm self-center">+</div>
            <div>
              <p className="text-xs text-muted-foreground">שימוש שנתי ({localMonthly > 0 ? `חודשי ×12` : ""}{localMonthly > 0 && localYearly > 0 ? " + " : ""}{localYearly > 0 ? "שנתי" : ""})</p>
              <p className="text-base font-semibold">{formatCurrency(localAnnual, currency)}</p>
            </div>
            <div className="text-muted-foreground text-sm self-center">=</div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">מחיר מכירה</p>
              <p className="text-xl font-bold" style={{ color: "oklch(0.45 0.15 145)" }}>{formatCurrency(localSalePrice, currency)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-xs text-muted-foreground">סה״כ עלויות</p>
          <p className="text-xl font-bold text-red-600 mt-1">{formatCurrency(financials.totalCosts, currency)}</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-xs text-muted-foreground">רווח צפוי</p>
          <p className={`text-xl font-bold mt-1 ${financials.expectedProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
            {formatCurrency(financials.expectedProfit, currency)}
          </p>
        </Card>
      </div>

      <div className="flex justify-between items-center">
        <h3 className="font-semibold">עלויות</h3>
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="h-3.5 w-3.5 ml-1.5" />
          הוסף עלות
        </Button>
      </div>

      {costs.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground text-sm">אין עלויות עדיין</CardContent></Card>
      ) : (
        <div className="space-y-4">
          {grouped.map(({ key, label, items, total }) => (
            <Card key={key}>
              <div className="px-4 py-2 bg-slate-50 border-b flex justify-between items-center">
                <span className="text-sm font-semibold">{label}</span>
                <span className="text-sm font-bold">{formatCurrency(total, currency)}</span>
              </div>
              <CardContent className="p-0">
                {items.map((c) => {
                  const billing = BILLING_BADGE[c.billingType ?? "ONE_TIME"] ?? BILLING_BADGE.ONE_TIME
                  return (
                    <div key={c.id} className="flex items-center justify-between px-4 py-3 border-b last:border-0">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium">{formatCurrency(Number(c.amount), c.currency)}</p>
                          <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${billing.color}`}>{billing.label}</span>
                          {c.billingType === "MONTHLY" && (
                            <span className="text-xs text-muted-foreground">({formatCurrency(Number(c.amount) * 12, c.currency)}/שנה)</span>
                          )}
                          {c.isPaid ? (
                            <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">שולם</span>
                          ) : (
                            <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">לא שולם</span>
                          )}
                        </div>
                        {c.description && <p className="text-xs text-muted-foreground mt-0.5">{c.description}</p>}
                        {c.vendor && <p className="text-xs text-muted-foreground">ספק: {c.vendor}</p>}
                        {c.date && <p className="text-xs text-muted-foreground">{formatDate(c.date)}</p>}
                      </div>
                      <ConfirmDialog
                        trigger={
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        }
                        onConfirm={() => handleDelete(c.id)}
                      />
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader><DialogTitle>עלות חדשה</DialogTitle></DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="costType" render={({ field }) => (
                  <FormItem><FormLabel>סוג עלות *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        {Object.entries(COST_TYPE_LABELS).map(([v, l]) => (
                          <SelectItem key={v} value={v}>{l}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
                <FormField control={form.control} name="billingType" render={({ field }) => (
                  <FormItem><FormLabel>סוג חיוב *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        {Object.entries(BILLING_TYPE_LABELS).map(([v, l]) => (
                          <SelectItem key={v} value={v}>{l}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <FormField control={form.control} name="amount" render={({ field }) => (
                    <FormItem><FormLabel>סכום *</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="currency" render={({ field }) => (
                  <FormItem><FormLabel>מטבע</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        {CURRENCY_OPTIONS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem><FormLabel>תיאור</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
              )} />
              <FormField control={form.control} name="vendor" render={({ field }) => (
                <FormItem><FormLabel>ספק</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
              )} />
              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="date" render={({ field }) => (
                  <FormItem><FormLabel>תאריך</FormLabel><FormControl><Input type="date" {...field} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="paymentMethod" render={({ field }) => (
                  <FormItem><FormLabel>אמצעי תשלום</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="בחר" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="bank_transfer">העברה</SelectItem>
                        <SelectItem value="bit">ביט</SelectItem>
                        <SelectItem value="paypal">PayPal</SelectItem>
                        <SelectItem value="cash">מזומן</SelectItem>
                        <SelectItem value="credit_card">אשראי</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="invoiceLink" render={({ field }) => (
                <FormItem><FormLabel>קישור חשבונית</FormLabel><FormControl><Input placeholder="https://..." {...field} /></FormControl></FormItem>
              )} />
              <FormField control={form.control} name="isPaid" render={({ field }) => (
                <FormItem className="flex items-center gap-3">
                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  <FormLabel className="!mt-0">שולם</FormLabel>
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
