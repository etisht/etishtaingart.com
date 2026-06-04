"use client"

import { useState, useEffect } from "react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { PROJECT_TYPE_OPTIONS, PLATFORM_OPTIONS, CURRENCY_OPTIONS, COST_TYPE_LABELS, BILLING_TYPE_LABELS } from "@/lib/constants"
import { formatCurrency } from "@/lib/utils"
import { Plus, Trash2 } from "lucide-react"
import type { BusinessEntity, Client } from "@/generated/prisma/client"

const schema = z.object({
  name: z.string().min(1, "שדה חובה"),
  clientId: z.string().min(1, "שדה חובה"),
  businessEntityId: z.string().min(1, "שדה חובה"),
  description: z.string().optional(),
  type: z.string().optional(),
  platform: z.string().optional(),
  targetDate: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  contractOneTime: z.string().optional(),
  contractRecurring: z.string().optional(),
  contractRecurringType: z.enum(["MONTHLY", "YEARLY"]).optional(),
  currency: z.string().optional(),
  internalNotes: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

type CostItem = {
  costType: string
  billingType: string
  amount: string
  description: string
}

interface ProjectFormProps {
  businessEntities: BusinessEntity[]
  defaultClientId?: string
  onSaved: (project: { id: string; name: string; client: { name: string }; status: { code: string }; totalContractValue: unknown; currency: string; targetDate: unknown; businessEntity: { name: string } } & Record<string, unknown>) => void
  onClose: () => void
}

export function ProjectForm({ businessEntities, defaultClientId, onSaved, onClose }: ProjectFormProps) {
  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [costItems, setCostItems] = useState<CostItem[]>([])

  useEffect(() => {
    fetch("/api/clients").then((r) => r.json()).then(setClients)
  }, [])

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      clientId: defaultClientId ?? "",
      businessEntityId: businessEntities[0]?.id ?? "",
      description: "",
      type: "",
      platform: "",
      targetDate: "",
      priority: "MEDIUM",
      contractOneTime: "",
      contractRecurring: "",
      contractRecurringType: "MONTHLY" as const,
      currency: "ILS",
      internalNotes: "",
    },
  })

  const currency: string = (form.watch("currency") ?? "ILS") || "ILS"
  const watchedOneTime = useWatch({ control: form.control, name: "contractOneTime" })
  const watchedRecurring = useWatch({ control: form.control, name: "contractRecurring" })
  const watchedRecurringType = useWatch({ control: form.control, name: "contractRecurringType" })
  const liveOneTime = Number(watchedOneTime) || 0
  const liveRecurring = Number(watchedRecurring) || 0
  const liveAnnual = watchedRecurringType === "MONTHLY" ? liveRecurring * 12 : liveRecurring
  const liveTotal = liveOneTime + liveAnnual

  const oneTime = costItems
    .filter((c) => c.billingType === "ONE_TIME")
    .reduce((s, c) => s + (Number(c.amount) || 0), 0)
  const annual = costItems
    .filter((c) => c.billingType === "MONTHLY")
    .reduce((s, c) => s + (Number(c.amount) || 0) * 12, 0)
    + costItems
    .filter((c) => c.billingType === "YEARLY")
    .reduce((s, c) => s + (Number(c.amount) || 0), 0)
  const salePrice = oneTime + annual

  const addCost = () => {
    setCostItems((prev) => [...prev, { costType: "HOSTING", billingType: "ONE_TIME", amount: "", description: "" }])
  }

  const removeCost = (i: number) => {
    setCostItems((prev) => prev.filter((_, idx) => idx !== i))
  }

  const updateCost = (i: number, field: keyof CostItem, value: string) => {
    setCostItems((prev) => prev.map((c, idx) => idx === i ? { ...c, [field]: value } : c))
  }

  const onSubmit = async (values: FormValues) => {
    setLoading(true)
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          contractOneTime: values.contractOneTime ? Number(values.contractOneTime) : null,
          contractRecurring: values.contractRecurring ? Number(values.contractRecurring) : null,
          contractRecurringType: values.contractRecurringType || null,
          startDate: new Date().toISOString(),
        }),
      })
      const project = await res.json()

      if (project.id && costItems.length > 0) {
        await Promise.all(
          costItems
            .filter((c) => c.amount && Number(c.amount) > 0)
            .map((c) =>
              fetch(`/api/projects/${project.id}/costs`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  costType: c.costType,
                  billingType: c.billingType,
                  amount: Number(c.amount),
                  description: c.description || undefined,
                  currency,
                }),
              })
            )
        )
      }

      onSaved(project)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle>פרויקט חדש</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>שם פרויקט *</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="clientId" render={({ field }) => (
                <FormItem>
                  <FormLabel>לקוח *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="בחר לקוח" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {clients.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="businessEntityId" render={({ field }) => (
                <FormItem>
                  <FormLabel>ישות עסקית *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="בחר ישות" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {businessEntities.map((e) => (
                        <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="type" render={({ field }) => (
                <FormItem>
                  <FormLabel>סוג פרויקט</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="בחר סוג" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {PROJECT_TYPE_OPTIONS.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )} />
              <FormField control={form.control} name="platform" render={({ field }) => (
                <FormItem>
                  <FormLabel>פלטפורמה</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="בחר פלטפורמה" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {PLATFORM_OPTIONS.map((p) => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="priority" render={({ field }) => (
                <FormItem>
                  <FormLabel>עדיפות</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="LOW">נמוכה</SelectItem>
                      <SelectItem value="MEDIUM">רגילה</SelectItem>
                      <SelectItem value="HIGH">גבוהה</SelectItem>
                      <SelectItem value="URGENT">דחופה</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )} />
              <FormField control={form.control} name="targetDate" render={({ field }) => (
                <FormItem>
                  <FormLabel>תאריך יעד</FormLabel>
                  <FormControl><Input type="date" {...field} /></FormControl>
                </FormItem>
              )} />
            </div>

            {/* Contract value */}
            <div className="space-y-2 border rounded-lg p-3 bg-slate-50">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-muted-foreground">שווי חוזה</p>
                <FormField control={form.control} name="currency" render={({ field }) => (
                  <FormItem>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger className="h-7 w-20 text-xs"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        {CURRENCY_OPTIONS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="contractOneTime" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">חד פעמי</FormLabel>
                    <FormControl><Input type="number" placeholder="0" {...field} /></FormControl>
                  </FormItem>
                )} />
                <div className="space-y-1">
                  <p className="text-xs font-medium leading-none">מנוי</p>
                  <div className="flex gap-2">
                    <FormField control={form.control} name="contractRecurring" render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl><Input type="number" placeholder="0" {...field} /></FormControl>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="contractRecurringType" render={({ field }) => (
                      <FormItem className="w-24">
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="MONTHLY">חודשי</SelectItem>
                            <SelectItem value="YEARLY">שנתי</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )} />
                  </div>
                </div>
              </div>
              {liveTotal > 0 && (
                <div className="flex items-center justify-between text-xs pt-1 border-t">
                  <span className="text-muted-foreground">שווי שנתי מחושב:</span>
                  <span className="font-bold">{formatCurrency(liveTotal, currency)}</span>
                </div>
              )}
            </div>

            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>תיאור קצר</FormLabel>
                <FormControl><Textarea rows={2} {...field} /></FormControl>
              </FormItem>
            )} />

            <FormField control={form.control} name="internalNotes" render={({ field }) => (
              <FormItem>
                <FormLabel>הערות פנימיות</FormLabel>
                <FormControl><Textarea rows={2} {...field} /></FormControl>
              </FormItem>
            )} />

            {/* Costs section */}
            <div className="border-t pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">עלויות הפרויקט</h3>
                <Button type="button" variant="outline" size="sm" onClick={addCost}>
                  <Plus className="h-3.5 w-3.5 ml-1.5" />
                  הוסף עלות
                </Button>
              </div>

              {costItems.length > 0 && (
                <div className="space-y-2">
                  {costItems.map((c, i) => (
                    <div key={i} className="grid grid-cols-12 gap-2 items-end p-3 bg-slate-50 rounded-lg">
                      <div className="col-span-3">
                        <p className="text-xs text-muted-foreground mb-1">סוג עלות</p>
                        <Select value={c.costType} onValueChange={(v) => v && updateCost(i, "costType", v)}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {Object.entries(COST_TYPE_LABELS).map(([v, l]) => (
                              <SelectItem key={v} value={v}>{l}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-3">
                        <p className="text-xs text-muted-foreground mb-1">סוג חיוב</p>
                        <Select value={c.billingType} onValueChange={(v) => v && updateCost(i, "billingType", v)}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {Object.entries(BILLING_TYPE_LABELS).map(([v, l]) => (
                              <SelectItem key={v} value={v}>{l}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2">
                        <p className="text-xs text-muted-foreground mb-1">סכום</p>
                        <Input
                          type="number"
                          className="h-8 text-xs"
                          placeholder="0"
                          value={c.amount}
                          onChange={(e) => updateCost(i, "amount", e.target.value)}
                        />
                      </div>
                      <div className="col-span-3">
                        <p className="text-xs text-muted-foreground mb-1">תיאור</p>
                        <Input
                          className="h-8 text-xs"
                          placeholder="תיאור..."
                          value={c.description}
                          onChange={(e) => updateCost(i, "description", e.target.value)}
                        />
                      </div>
                      <div className="col-span-1 flex justify-end">
                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => removeCost(i)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Sale price summary */}
              {(costItems.length > 0 && salePrice > 0) && (
                <div
                  className="rounded-lg p-3 text-sm"
                  style={{ background: "oklch(0.97 0.02 145)", border: "1px solid oklch(0.85 0.08 145)" }}
                >
                  <div className="flex items-center gap-4 flex-wrap">
                    <span className="text-muted-foreground text-xs">חד פעמי: <strong>{formatCurrency(oneTime, currency)}</strong></span>
                    <span className="text-muted-foreground text-xs">+</span>
                    <span className="text-muted-foreground text-xs">שימוש שנתי: <strong>{formatCurrency(annual, currency)}</strong></span>
                    <span className="text-muted-foreground text-xs">=</span>
                    <span className="font-bold" style={{ color: "oklch(0.45 0.15 145)" }}>
                      מחיר מכירה: {formatCurrency(salePrice, currency)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button type="button" variant="outline" onClick={onClose}>ביטול</Button>
              <Button type="submit" disabled={loading}>{loading ? "יוצר..." : "צור פרויקט"}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
