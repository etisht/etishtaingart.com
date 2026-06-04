"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useForm } from "react-hook-form"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { PartnerTermsFields } from "@/components/projects/partner-terms-fields"
import { formatCurrency } from "@/lib/utils"
import { Plus, Trash2, Users, ExternalLink, UserPlus, Pencil } from "lucide-react"
import type { Partner, ProjectPartner } from "@/generated/prisma/client"

type PPWithPartner = ProjectPartner & { partner: Partner }

interface TabPartnersProps {
  projectId: string
  projectPartners: PPWithPartner[]
  allPartners: Partner[]
  currency: string
}

type Mode = "add" | "create"

export function TabPartners({ projectId, projectPartners: initial, allPartners: initialAll, currency }: TabPartnersProps) {
  const [partners, setPartners] = useState(initial)
  const [allPartners, setAllPartners] = useState(initialAll)
  const [open, setOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editPP, setEditPP] = useState<PPWithPartner | null>(null)
  const [mode, setMode] = useState<Mode>("add")
  const [loading, setLoading] = useState(false)

  const addForm = useForm({
    defaultValues: {
      partnerId: "", role: "", agreementType: "PERCENTAGE",
      contractPercentage: "", profitPercentage: "", fixedAmount: "",
      notes: "", agreementLink: "",
    },
  })

  const editForm = useForm({
    defaultValues: {
      role: "", agreementType: "PERCENTAGE",
      contractPercentage: "", profitPercentage: "", fixedAmount: "",
      notes: "", agreementLink: "",
    },
  })

  const createForm = useForm({
    defaultValues: { name: "", email: "", phone: "" },
  })

  const available = allPartners.filter((p) => !partners.some((pp) => pp.partnerId === p.id))

  const openAdd = () => {
    addForm.reset()
    createForm.reset()
    setMode(available.length > 0 ? "add" : "create")
    setOpen(true)
  }

  const openEdit = (pp: PPWithPartner) => {
    setEditPP(pp)
    editForm.reset({
      role: pp.role ?? "",
      agreementType: pp.agreementType,
      contractPercentage: pp.contractPercentage ? String(Number(pp.contractPercentage)) : "",
      profitPercentage: pp.profitPercentage ? String(Number(pp.profitPercentage)) : "",
      fixedAmount: pp.fixedAmount ? String(Number(pp.fixedAmount)) : "",
      notes: pp.notes ?? "",
      agreementLink: pp.agreementLink ?? "",
    })
    setEditOpen(true)
  }

  const onCreateAndAdd = async (values: Record<string, string>) => {
    setLoading(true)
    try {
      const pRes = await fetch("/api/partners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })
      const newPartner: Partner = await pRes.json()
      setAllPartners((prev) => [...prev, newPartner])

      const ppRes = await fetch(`/api/projects/${projectId}/partners`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partnerId: newPartner.id, agreementType: "PERCENTAGE" }),
      })
      const created: PPWithPartner = await ppRes.json()
      setPartners((prev) => [...prev, created])
      setOpen(false)
    } finally {
      setLoading(false)
    }
  }

  const onAdd = async (values: Record<string, string>) => {
    setLoading(true)
    try {
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
    } finally {
      setLoading(false)
    }
  }

  const onEdit = async (values: Record<string, string>) => {
    if (!editPP) return
    setLoading(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/partners/${editPP.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          contractPercentage: values.contractPercentage ? Number(values.contractPercentage) : null,
          profitPercentage: values.profitPercentage ? Number(values.profitPercentage) : null,
          fixedAmount: values.fixedAmount ? Number(values.fixedAmount) : null,
        }),
      })
      const updated: PPWithPartner = await res.json()
      setPartners((prev) => prev.map((p) => p.id === updated.id ? updated : p))
      setEditOpen(false)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    await fetch(`/api/projects/${projectId}/partners/${id}`, { method: "DELETE" }).catch(() => {})
    setPartners((prev) => prev.filter((p) => p.id !== id))
  }

  const totalContractPct = partners.reduce((s, p) => s + Number(p.contractPercentage ?? 0), 0)
  const totalProfitPct = partners.reduce((s, p) => s + Number(p.profitPercentage ?? 0), 0)

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">שותפים בפרויקט</h3>
        <Button size="sm" onClick={openAdd}>
          <Plus className="h-3.5 w-3.5 ml-1.5" />
          הוסף שותף
        </Button>
      </div>

      {/* Percentage summary */}
      {partners.some((p) => p.contractPercentage || p.profitPercentage) && (
        <div className="grid grid-cols-2 gap-3">
          {totalContractPct > 0 && (
            <Card className="p-3">
              <p className="text-xs text-muted-foreground mb-2">חלוקת % מהחוזה</p>
              <div className="space-y-1.5">
                {partners.filter((p) => p.contractPercentage).map((pp) => (
                  <div key={pp.id} className="flex items-center gap-2">
                    <div className="h-2 rounded-full bg-primary/70 shrink-0" style={{ width: `${Math.min(Number(pp.contractPercentage), 100) * 0.8}%` }} />
                    <span className="text-xs">{pp.partner.name}</span>
                    <span className="text-xs font-semibold mr-auto">{Number(pp.contractPercentage)}%</span>
                  </div>
                ))}
                <p className={`text-xs font-semibold pt-1 border-t ${totalContractPct > 100 ? "text-red-500" : totalContractPct === 100 ? "text-green-600" : "text-orange-500"}`}>
                  סה״כ: {totalContractPct}% {totalContractPct > 100 ? "⚠️ חורג" : totalContractPct === 100 ? "✓" : ""}
                </p>
              </div>
            </Card>
          )}
          {totalProfitPct > 0 && (
            <Card className="p-3">
              <p className="text-xs text-muted-foreground mb-2">חלוקת % מהרווח</p>
              <div className="space-y-1.5">
                {partners.filter((p) => p.profitPercentage).map((pp) => (
                  <div key={pp.id} className="flex items-center gap-2">
                    <div className="h-2 rounded-full bg-green-500/70 shrink-0" style={{ width: `${Math.min(Number(pp.profitPercentage), 100) * 0.8}%` }} />
                    <span className="text-xs">{pp.partner.name}</span>
                    <span className="text-xs font-semibold mr-auto">{Number(pp.profitPercentage)}%</span>
                  </div>
                ))}
                <p className={`text-xs font-semibold pt-1 border-t ${totalProfitPct > 100 ? "text-red-500" : totalProfitPct === 100 ? "text-green-600" : "text-orange-500"}`}>
                  סה״כ: {totalProfitPct}% {totalProfitPct > 100 ? "⚠️ חורג" : totalProfitPct === 100 ? "✓" : ""}
                </p>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Partners list */}
      {partners.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center space-y-3">
            <Users className="h-8 w-8 text-muted-foreground/40 mx-auto" />
            <p className="text-sm text-muted-foreground">אין שותפים בפרויקט זה</p>
            <Button size="sm" variant="outline" onClick={openAdd}>
              <UserPlus className="h-3.5 w-3.5 ml-1.5" />
              הוסף שותף ראשון
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {partners.map((pp) => (
            <Card key={pp.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold">{pp.partner.name}</p>
                  {pp.role && <p className="text-xs text-muted-foreground">{pp.role}</p>}

                  {/* Terms */}
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {pp.contractPercentage ? (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                        {Number(pp.contractPercentage)}% מהחוזה
                      </span>
                    ) : null}
                    {pp.profitPercentage ? (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                        {Number(pp.profitPercentage)}% מהרווח
                      </span>
                    ) : null}
                    {pp.fixedAmount ? (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-orange-50 text-orange-700 border border-orange-200">
                        {formatCurrency(Number(pp.fixedAmount), currency)} קבוע
                      </span>
                    ) : null}
                    {!pp.contractPercentage && !pp.profitPercentage && !pp.fixedAmount && (
                      <button
                        onClick={() => openEdit(pp)}
                        className="px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-dashed border-border hover:border-primary hover:text-primary transition-colors"
                      >
                        + הגדר תנאי שיתוף
                      </button>
                    )}
                  </div>

                  {pp.agreementLink && (
                    <a href={pp.agreementLink} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline mt-1.5">
                      <ExternalLink className="h-3 w-3" />
                      הסכם שיתוף
                    </a>
                  )}
                </div>

                <div className="flex gap-1 shrink-0 mr-2">
                  <button
                    onClick={() => openEdit(pp)}
                    className="inline-flex items-center justify-center h-7 w-7 rounded-md text-muted-foreground hover:bg-muted transition-colors"
                    title="ערוך תנאי שיתוף"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <ConfirmDialog
                    trigger={
                      <button className="inline-flex items-center justify-center h-7 w-7 rounded-md text-red-400 hover:bg-red-50 transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    }
                    onConfirm={() => handleDelete(pp.id)}
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add / Create dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>הוסף שותף לפרויקט</DialogTitle>
          </DialogHeader>

          <div className="flex rounded-lg border border-border overflow-hidden mb-1">
            <button type="button" onClick={() => setMode("add")}
              disabled={available.length === 0}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm transition-colors ${mode === "add" ? "bg-primary text-primary-foreground font-medium" : "hover:bg-muted text-muted-foreground disabled:opacity-40"}`}
            >
              <Users className="h-3.5 w-3.5" />
              שותף קיים
            </button>
            <button type="button" onClick={() => setMode("create")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm transition-colors border-r border-border ${mode === "create" ? "bg-primary text-primary-foreground font-medium" : "hover:bg-muted text-muted-foreground"}`}
            >
              <UserPlus className="h-3.5 w-3.5" />
              שותף חדש
            </button>
          </div>

          {mode === "create" ? (
            <Form {...createForm}>
              <form onSubmit={createForm.handleSubmit(onCreateAndAdd)} className="space-y-3">
                <FormField control={createForm.control} name="name" render={({ field }) => (
                  <FormItem><FormLabel>שם שותף *</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                )} />
                <div className="grid grid-cols-2 gap-3">
                  <FormField control={createForm.control} name="email" render={({ field }) => (
                    <FormItem><FormLabel>מייל</FormLabel><FormControl><Input type="email" {...field} /></FormControl></FormItem>
                  )} />
                  <FormField control={createForm.control} name="phone" render={({ field }) => (
                    <FormItem><FormLabel>טלפון</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                  )} />
                </div>
                <p className="text-xs text-muted-foreground bg-muted/50 rounded p-2">
                  השותף יתווסף לפרויקט. לחץ על עיפרון ✏️ בכרטיס שלו להגדרת אחוזי שיתוף.
                </p>
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>ביטול</Button>
                  <Button type="submit" disabled={loading}>{loading ? "יוצר..." : "צור והוסף"}</Button>
                </div>
              </form>
            </Form>
          ) : (
            <Form {...addForm}>
              <form onSubmit={addForm.handleSubmit(onAdd)} className="space-y-3">
                <FormField control={addForm.control} name="partnerId" render={({ field }) => (
                  <FormItem><FormLabel>שותף *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="בחר שותף" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {available.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}{p.email && ` — ${p.email}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
                <PartnerTermsFields form={addForm} />
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>ביטול</Button>
                  <Button type="submit" disabled={loading}>{loading ? "שומר..." : "הוסף"}</Button>
                </div>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>
              עריכת תנאי שיתוף — {editPP?.partner.name}
            </DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEdit)} className="space-y-3">
              <PartnerTermsFields form={editForm} />
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>ביטול</Button>
                <Button type="submit" disabled={loading}>{loading ? "שומר..." : "שמור"}</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
