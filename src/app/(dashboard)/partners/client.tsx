"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { EmptyState } from "@/components/shared/empty-state"
import { Plus, Pencil, Trash2, Users, Mail, Phone } from "lucide-react"
import type { Partner } from "@/generated/prisma/client"

type PartnerRow = Partner & { _count: { projects: number } }

interface Props { partners: PartnerRow[] }

export function PartnersClient({ partners: initial }: Props) {
  const [partners, setPartners] = useState(initial)
  const [open, setOpen] = useState(false)
  const [editItem, setEditItem] = useState<PartnerRow | null>(null)
  const [loading, setLoading] = useState(false)

  const form = useForm({
    defaultValues: { name: "", email: "", phone: "", notes: "" },
  })

  const openNew = () => {
    setEditItem(null)
    form.reset({ name: "", email: "", phone: "", notes: "" })
    setOpen(true)
  }

  const openEdit = (p: PartnerRow) => {
    setEditItem(p)
    form.reset({ name: p.name, email: p.email ?? "", phone: p.phone ?? "", notes: p.notes ?? "" })
    setOpen(true)
  }

  const onSubmit = async (values: ReturnType<typeof form.getValues>) => {
    setLoading(true)
    const url = editItem ? `/api/partners/${editItem.id}` : "/api/partners"
    const method = editItem ? "PATCH" : "POST"
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) })
    const saved = await res.json()
    if (editItem) {
      setPartners((prev) => prev.map((x) => x.id === saved.id ? { ...saved, _count: x._count } : x))
    } else {
      setPartners((prev) => [...prev, { ...saved, _count: { projects: 0 } }])
    }
    setOpen(false)
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    await fetch(`/api/partners/${id}`, { method: "DELETE" })
    setPartners((prev) => prev.filter((p) => p.id !== id))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">שותפים</h1>
        <Button onClick={openNew}><Plus className="h-4 w-4 ml-2" />שותף חדש</Button>
      </div>

      {partners.length === 0 ? (
        <EmptyState icon={Users} title="אין שותפים" action={<Button onClick={openNew} variant="outline" size="sm">הוסף שותף</Button>} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {partners.map((p) => (
            <Card key={p.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{p.name}</p>
                  <Badge variant="outline" className="text-xs mt-1">{p._count.projects} פרויקטים</Badge>
                  <div className="space-y-1 mt-2">
                    {p.email && (
                      <a href={`mailto:${p.email}`} className="text-xs text-blue-600 flex items-center gap-1 hover:underline">
                        <Mail className="h-3 w-3" />{p.email}
                      </a>
                    )}
                    {p.phone && (
                      <a href={`tel:${p.phone}`} className="text-xs flex items-center gap-1">
                        <Phone className="h-3 w-3" />{p.phone}
                      </a>
                    )}
                  </div>
                  {p.notes && <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{p.notes}</p>}
                </div>
                <div className="flex gap-1 mr-2 shrink-0">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(p)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <ConfirmDialog
                    trigger={<Button variant="ghost" size="icon" className="h-7 w-7 text-red-500"><Trash2 className="h-3.5 w-3.5" /></Button>}
                    onConfirm={() => handleDelete(p.id)}
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader><DialogTitle>{editItem ? "עריכת שותף" : "שותף חדש"}</DialogTitle></DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>שם *</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
              )} />
              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem><FormLabel>מייל</FormLabel><FormControl><Input type="email" {...field} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="phone" render={({ field }) => (
                  <FormItem><FormLabel>טלפון</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                )} />
              </div>
              <FormField control={form.control} name="notes" render={({ field }) => (
                <FormItem><FormLabel>הערות</FormLabel><FormControl><Textarea rows={3} {...field} /></FormControl></FormItem>
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
