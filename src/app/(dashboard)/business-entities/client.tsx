"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { EmptyState } from "@/components/shared/empty-state"
import { Plus, Pencil, Trash2, Briefcase } from "lucide-react"
import type { BusinessEntity } from "@/generated/prisma/client"

interface Props { entities: BusinessEntity[] }

export function BusinessEntitiesClient({ entities: initial }: Props) {
  const router = useRouter()
  const [entities, setEntities] = useState(initial)
  const [open, setOpen] = useState(false)
  const [editItem, setEditItem] = useState<BusinessEntity | null>(null)
  const [loading, setLoading] = useState(false)

  const form = useForm({
    defaultValues: { name: "", type: "company", taxId: "", address: "", email: "", notes: "", isActive: true },
  })

  const openNew = () => {
    setEditItem(null)
    form.reset({ name: "", type: "company", taxId: "", address: "", email: "", notes: "", isActive: true })
    setOpen(true)
  }

  const openEdit = (e: BusinessEntity) => {
    setEditItem(e)
    form.reset({ name: e.name, type: e.type, taxId: e.taxId ?? "", address: e.address ?? "", email: e.email ?? "", notes: e.notes ?? "", isActive: e.isActive })
    setOpen(true)
  }

  const onSubmit = async (values: { name: string; type: string; taxId: string; address: string; email: string; notes: string; isActive: boolean }) => {
    setLoading(true)
    const url = editItem ? `/api/business-entities/${editItem.id}` : "/api/business-entities"
    const method = editItem ? "PATCH" : "POST"
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) })
    const saved: BusinessEntity = await res.json()
    if (editItem) {
      setEntities((prev) => prev.map((x) => x.id === saved.id ? saved : x))
    } else {
      setEntities((prev) => [...prev, saved])
    }
    setOpen(false)
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    await fetch(`/api/business-entities/${id}`, { method: "DELETE" })
    setEntities((prev) => prev.filter((e) => e.id !== id))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">ישויות עסקיות</h1>
        <Button onClick={openNew}><Plus className="h-4 w-4 ml-2" />ישות חדשה</Button>
      </div>

      {entities.length === 0 ? (
        <EmptyState icon={Briefcase} title="אין ישויות עסקיות" action={<Button onClick={openNew} variant="outline" size="sm">הוסף</Button>} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {entities.map((e) => (
            <Card key={e.id} className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{e.name}</p>
                    {!e.isActive && <Badge variant="outline" className="text-xs text-gray-400">לא פעיל</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">{e.type}</p>
                  {e.taxId && <p className="text-xs text-muted-foreground">ח.פ/ע.מ: {e.taxId}</p>}
                  {e.email && <p className="text-xs text-muted-foreground">{e.email}</p>}
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(e)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <ConfirmDialog
                    trigger={<Button variant="ghost" size="icon" className="h-7 w-7 text-red-500"><Trash2 className="h-3.5 w-3.5" /></Button>}
                    onConfirm={() => handleDelete(e.id)}
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader><DialogTitle>{editItem ? "עריכת ישות" : "ישות עסקית חדשה"}</DialogTitle></DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>שם *</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
              )} />
              <FormField control={form.control} name="type" render={({ field }) => (
                <FormItem><FormLabel>סוג</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="company">חברה</SelectItem>
                      <SelectItem value="freelance">עוסק פרטי</SelectItem>
                      <SelectItem value="partnership">שותפות</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )} />
              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="taxId" render={({ field }) => (
                  <FormItem><FormLabel>ח.פ / ע.מ</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem><FormLabel>מייל</FormLabel><FormControl><Input type="email" {...field} /></FormControl></FormItem>
                )} />
              </div>
              <FormField control={form.control} name="address" render={({ field }) => (
                <FormItem><FormLabel>כתובת</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
              )} />
              <FormField control={form.control} name="notes" render={({ field }) => (
                <FormItem><FormLabel>הערות</FormLabel><FormControl><Textarea rows={2} {...field} /></FormControl></FormItem>
              )} />
              <FormField control={form.control} name="isActive" render={({ field }) => (
                <FormItem className="flex items-center gap-3">
                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  <FormLabel className="!mt-0">פעיל</FormLabel>
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
