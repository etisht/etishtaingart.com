"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
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
import { CLIENT_TYPE_OPTIONS, INDUSTRY_OPTIONS, SOURCE_OPTIONS } from "@/lib/constants"
import type { Client } from "@/generated/prisma/client"

const schema = z.object({
  name: z.string().min(1, "שדה חובה"),
  type: z.string().optional(),
  industry: z.string().optional(),
  website: z.string().optional(),
  status: z.enum(["LEAD", "ACTIVE", "INACTIVE", "CHURNED"]).optional(),
  source: z.string().optional(),
  notes: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface ClientFormProps {
  client?: Client | null
  onSaved: (saved: Client) => void
  onClose: () => void
}

export function ClientForm({ client, onSaved, onClose }: ClientFormProps) {
  const [loading, setLoading] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: client?.name ?? "",
      type: client?.type ?? "",
      industry: client?.industry ?? "",
      website: client?.website ?? "",
      status: (client?.status as FormValues["status"]) ?? "LEAD",
      source: client?.source ?? "",
      notes: client?.notes ?? "",
    },
  })

  const onSubmit = async (values: FormValues) => {
    setLoading(true)
    try {
      const url = client ? `/api/clients/${client.id}` : "/api/clients"
      const method = client ? "PATCH" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })
      const saved: Client = await res.json()
      onSaved(saved)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle>{client ? "עריכת לקוח" : "לקוח חדש"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>שם לקוח *</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="type" render={({ field }) => (
                <FormItem>
                  <FormLabel>סוג לקוח</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="בחר סוג" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {CLIENT_TYPE_OPTIONS.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )} />
              <FormField control={form.control} name="industry" render={({ field }) => (
                <FormItem>
                  <FormLabel>תחום פעילות</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="בחר תחום" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {INDUSTRY_OPTIONS.map((i) => (
                        <SelectItem key={i} value={i}>{i}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem>
                  <FormLabel>סטטוס</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="LEAD">ליד</SelectItem>
                      <SelectItem value="ACTIVE">פעיל</SelectItem>
                      <SelectItem value="INACTIVE">לא פעיל</SelectItem>
                      <SelectItem value="CHURNED">לקוח עבר</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )} />
              <FormField control={form.control} name="source" render={({ field }) => (
                <FormItem>
                  <FormLabel>מקור הגעה</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="בחר מקור" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {SOURCE_OPTIONS.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="website" render={({ field }) => (
              <FormItem>
                <FormLabel>אתר אינטרנט</FormLabel>
                <FormControl><Input placeholder="https://..." {...field} /></FormControl>
              </FormItem>
            )} />

            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem>
                <FormLabel>הערות</FormLabel>
                <FormControl><Textarea rows={3} {...field} /></FormControl>
              </FormItem>
            )} />

            <div className="flex gap-2 justify-end pt-2">
              <Button type="button" variant="outline" onClick={onClose}>ביטול</Button>
              <Button type="submit" disabled={loading}>
                {loading ? "שומר..." : client ? "עדכון" : "יצירה"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
