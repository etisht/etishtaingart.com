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
import { useForm } from "react-hook-form"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { formatDate } from "@/lib/utils"
import { DOCUMENT_TYPE_LABELS } from "@/lib/constants"
import { Plus, Trash2, ExternalLink, FileText } from "lucide-react"
import type { Document } from "@/generated/prisma/client"

interface TabDocumentsProps {
  projectId: string
  documents: Document[]
}

export function TabDocuments({ projectId, documents: initial }: TabDocumentsProps) {
  const [docs, setDocs] = useState(initial)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const form = useForm({
    defaultValues: { name: "", type: "SPEC", link: "", version: "", notes: "" },
  })

  const onSubmit = async (values: ReturnType<typeof form.getValues>) => {
    setLoading(true)
    const res = await fetch(`/api/projects/${projectId}/documents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    })
    const created: Document = await res.json()
    setDocs((prev) => [created, ...prev])
    setOpen(false)
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    await fetch(`/api/projects/${projectId}/documents/${id}`, { method: "DELETE" }).catch(() => {})
    setDocs((prev) => prev.filter((d) => d.id !== id))
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">מסמכים וקישורים</h3>
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="h-3.5 w-3.5 ml-1.5" />
          הוסף מסמך
        </Button>
      </div>

      {docs.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground text-sm">אין מסמכים עדיין</CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {docs.map((d) => (
            <Card key={d.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className="w-8 h-8 rounded bg-blue-100 flex items-center justify-center shrink-0">
                    <FileText className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{d.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="outline" className="text-xs">{DOCUMENT_TYPE_LABELS[d.type]}</Badge>
                      {d.version && <span className="text-xs text-muted-foreground">{d.version}</span>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{formatDate(d.createdAt)}</p>
                    {d.notes && <p className="text-xs text-slate-500 mt-1">{d.notes}</p>}
                  </div>
                </div>
                <div className="flex gap-1 mr-2 shrink-0">
                  {d.link && (
                    <a href={d.link} target="_blank" rel="noopener">
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-blue-600">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    </a>
                  )}
                  <ConfirmDialog
                    trigger={
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    }
                    onConfirm={() => handleDelete(d.id)}
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader><DialogTitle>מסמך חדש</DialogTitle></DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>שם מסמך *</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
              )} />
              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="type" render={({ field }) => (
                  <FormItem><FormLabel>סוג</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        {Object.entries(DOCUMENT_TYPE_LABELS).map(([v, l]) => (
                          <SelectItem key={v} value={v}>{l}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
                <FormField control={form.control} name="version" render={({ field }) => (
                  <FormItem><FormLabel>גרסה</FormLabel><FormControl><Input placeholder="V1, Final..." {...field} /></FormControl></FormItem>
                )} />
              </div>
              <FormField control={form.control} name="link" render={({ field }) => (
                <FormItem><FormLabel>קישור</FormLabel><FormControl><Input placeholder="https://drive.google.com/..." {...field} /></FormControl></FormItem>
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
