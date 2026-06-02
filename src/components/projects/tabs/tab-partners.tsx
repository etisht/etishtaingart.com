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
import { formatCurrency } from "@/lib/utils"
import { AGREEMENT_TYPE_LABELS } from "@/lib/constants"
import { Plus, Trash2 } from "lucide-react"
import type { Partner, ProjectPartner } from "@/generated/prisma/client"

type PPWithPartner = ProjectPartner & { partner: Partner }

interface TabPartnersProps {
  projectId: string
  projectPartners: PPWithPartner[]
  allPartners: Partner[]
  currency: string
}

export function TabPartners({ projectId, projectPartners: initial, allPartners, currency }: TabPartnersProps) {
  const [partners, setPartners] = useState(initial)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const form = useForm({
    defaultValues: {
      partnerId: "", role: "", agreementType: "PERCENTAGE",
      contractPercentage: "", profitPercentage: "", fixedAmount: "",
      notes: "", agreementLink: "",
    },
  })

  const onSubmit = async (values: ReturnType<typeof form.getValues>) => {
    setLoading(true)
    const res = await fetch(`/api/projects/${projectId}/partners`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...values,
        contractPercentage: values.contractPercentage ? Number(values.contractPercentage) : null,
        profitPercentage: values.profitPercentage ? Number(values.profitPercentage) : null,
        fixedAmount: values.fixedAmount ? Number(values.fixedAmount) : null,
      }),
    })
    const created: PPWithPartner = await res.json()
    setPartners((prev) => [...prev, created])
    setOpen(false)
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    await fetch(`/api/projects/${projectId}/partners/${id}`, { method: "DELETE" }).catch(() => {})
    setPartners((prev) => prev.filter((p) => p.id !== id))
  }

  const available = allPartners.filter((p) => !partners.some((pp) => pp.partnerId === p.id))

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">שותפים בפרויקט</h3>
        <Button size="sm" onClick={() => setOpen(true)} disabled={available.length === 0}>
          <Plus className="h-3.5 w-3.5 ml-1.5" />
          הוסף שותף
        </Button>
      </div>

      {partners.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground text-sm">אין שותפים בפרויקט זה</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {partners.map((pp) => (
            <Card key={pp.id} className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold">{pp.partner.name}</p>
                  {pp.role && <p className="text-sm text-muted-foreground">{pp.role}</p>}
                  <div className="flex gap-4 mt-2 text-sm">
                    <span className="text-muted-foreground">
                      {AGREEMENT_TYPE_LABELS[pp.agreementType]}:
                    </span>
                    {pp.contractPercentage && (
                      <span className="font-medium">{Number(pp.contractPercentage)}% מהחוזה</span>
                    )}
                    {pp.profitPercentage && (
                      <span className="font-medium">{Number(pp.profitPercentage)}% מהרווח</span>
                    )}
                    {pp.fixedAmount && (
                      <span className="font-medium">{formatCurrency(Number(pp.fixedAmount), currency)}</span>
                    )}
                  </div>
                  {pp.agreementLink && (
                    <a href={pp.agreementLink} target="_blank" rel="noopener" className="text-xs text-blue-600 hover:underline mt-1 block">
                      הסכם שיתוף ↗
                    </a>
                  )}
                  {pp.notes && <p className="text-xs text-muted-foreground mt-1">{pp.notes}</p>}
                </div>
                <ConfirmDialog
                  trigger={
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  }
                  onConfirm={() => handleDelete(pp.id)}
                />
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader><DialogTitle>הוסף שותף לפרויקט</DialogTitle></DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
              <FormField control={form.control} name="partnerId" render={({ field }) => (
                <FormItem><FormLabel>שותף *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="בחר שותף" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {available.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FormItem>
              )} />
              <FormField control={form.control} name="role" render={({ field }) => (
                <FormItem><FormLabel>תפקיד בפרויקט</FormLabel><FormControl><Input placeholder="פיתוח, עיצוב..." {...field} /></FormControl></FormItem>
              )} />
              <FormField control={form.control} name="agreementType" render={({ field }) => (
                <FormItem><FormLabel>סוג הסכם</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {Object.entries(AGREEMENT_TYPE_LABELS).map(([v, l]) => (
                        <SelectItem key={v} value={v}>{l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )} />
              <div className="grid grid-cols-3 gap-3">
                <FormField control={form.control} name="contractPercentage" render={({ field }) => (
                  <FormItem><FormLabel>% מהחוזה</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="profitPercentage" render={({ field }) => (
                  <FormItem><FormLabel>% מהרווח</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="fixedAmount" render={({ field }) => (
                  <FormItem><FormLabel>סכום קבוע</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>
                )} />
              </div>
              <FormField control={form.control} name="agreementLink" render={({ field }) => (
                <FormItem><FormLabel>קישור להסכם</FormLabel><FormControl><Input placeholder="https://..." {...field} /></FormControl></FormItem>
              )} />
              <FormField control={form.control} name="notes" render={({ field }) => (
                <FormItem><FormLabel>הערות</FormLabel><FormControl><Textarea rows={2} {...field} /></FormControl></FormItem>
              )} />
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>ביטול</Button>
                <Button type="submit" disabled={loading}>{loading ? "שומר..." : "הוסף"}</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
