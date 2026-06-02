"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { Plus, Mail, Phone, Pencil, Trash2, Star } from "lucide-react"
import type { Contact } from "@/generated/prisma/client"

const schema = z.object({
  fullName: z.string().min(1, "שדה חובה"),
  role: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  isPrimary: z.boolean().optional(),
  notes: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface ContactsListProps {
  clientId: string
  contacts: Contact[]
}

export function ContactsList({ clientId, contacts: initial }: ContactsListProps) {
  const router = useRouter()
  const [contacts, setContacts] = useState(initial)
  const [open, setOpen] = useState(false)
  const [editContact, setEditContact] = useState<Contact | null>(null)
  const [loading, setLoading] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { fullName: "", role: "", email: "", phone: "", isPrimary: false, notes: "" },
  })

  const openEdit = (c: Contact) => {
    setEditContact(c)
    form.reset({
      fullName: c.fullName,
      role: c.role ?? "",
      email: c.email ?? "",
      phone: c.phone ?? "",
      isPrimary: c.isPrimary,
      notes: c.notes ?? "",
    })
    setOpen(true)
  }

  const openNew = () => {
    setEditContact(null)
    form.reset({ fullName: "", role: "", email: "", phone: "", isPrimary: contacts.length === 0, notes: "" })
    setOpen(true)
  }

  const onSubmit = async (values: FormValues) => {
    setLoading(true)
    try {
      const url = editContact
        ? `/api/clients/${clientId}/contacts/${editContact.id}`
        : `/api/clients/${clientId}/contacts`
      const method = editContact ? "PATCH" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })
      const saved: Contact = await res.json()
      if (editContact) {
        setContacts((prev) => prev.map((c) => (c.id === saved.id ? saved : c)))
      } else {
        setContacts((prev) => [...prev, saved])
      }
      setOpen(false)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    await fetch(`/api/clients/${clientId}/contacts/${id}`, { method: "DELETE" })
    setContacts((prev) => prev.filter((c) => c.id !== id))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-slate-800">אנשי קשר</h3>
        <Button size="sm" variant="outline" onClick={openNew}>
          <Plus className="h-3.5 w-3.5 ml-1.5" />
          הוסף
        </Button>
      </div>

      {contacts.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">אין אנשי קשר עדיין</p>
      ) : (
        <div className="space-y-2">
          {contacts.map((c) => (
            <div key={c.id} className="flex items-start justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm">{c.fullName}</p>
                  {c.isPrimary && (
                    <Badge variant="outline" className="text-xs px-1.5 py-0 border-yellow-400 text-yellow-700">
                      <Star className="h-2.5 w-2.5 ml-0.5 fill-current" />
                      ראשי
                    </Badge>
                  )}
                </div>
                {c.role && <p className="text-xs text-muted-foreground">{c.role}</p>}
                <div className="flex gap-3 mt-1">
                  {c.email && (
                    <a href={`mailto:${c.email}`} className="text-xs text-blue-600 flex items-center gap-1 hover:underline">
                      <Mail className="h-3 w-3" />{c.email}
                    </a>
                  )}
                  {c.phone && (
                    <a href={`tel:${c.phone}`} className="text-xs text-slate-600 flex items-center gap-1">
                      <Phone className="h-3 w-3" />{c.phone}
                    </a>
                  )}
                </div>
              </div>
              <div className="flex gap-1 mr-2 shrink-0">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(c)}>
                  <Pencil className="h-3 w-3" />
                </Button>
                <ConfirmDialog
                  trigger={
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-600">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  }
                  onConfirm={() => handleDelete(c.id)}
                  description={`למחוק את ${c.fullName}?`}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editContact ? "עריכת איש קשר" : "איש קשר חדש"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="fullName" render={({ field }) => (
                <FormItem>
                  <FormLabel>שם מלא *</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="role" render={({ field }) => (
                  <FormItem>
                    <FormLabel>תפקיד</FormLabel>
                    <FormControl><Input placeholder="מנכ״ל, סמנכ״ל..." {...field} /></FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="phone" render={({ field }) => (
                  <FormItem>
                    <FormLabel>טלפון</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel>מייל</FormLabel>
                  <FormControl><Input type="email" {...field} /></FormControl>
                </FormItem>
              )} />
              <FormField control={form.control} name="notes" render={({ field }) => (
                <FormItem>
                  <FormLabel>הערות</FormLabel>
                  <FormControl><Textarea rows={2} {...field} /></FormControl>
                </FormItem>
              )} />
              <FormField control={form.control} name="isPrimary" render={({ field }) => (
                <FormItem className="flex items-center gap-3">
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormLabel className="!mt-0">איש קשר ראשי</FormLabel>
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
