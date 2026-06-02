"use client"

import { useState, useEffect } from "react"
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
import { PROJECT_TYPE_OPTIONS, PLATFORM_OPTIONS, CURRENCY_OPTIONS } from "@/lib/constants"
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
  totalContractValue: z.string().optional(),
  currency: z.string().optional(),
  internalNotes: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface ProjectFormProps {
  businessEntities: BusinessEntity[]
  defaultClientId?: string
  onSaved: () => void
  onClose: () => void
}

export function ProjectForm({ businessEntities, defaultClientId, onSaved, onClose }: ProjectFormProps) {
  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState<Client[]>([])

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
      totalContractValue: "",
      currency: "ILS",
      internalNotes: "",
    },
  })

  const onSubmit = async (values: FormValues) => {
    setLoading(true)
    try {
      await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          totalContractValue: values.totalContractValue
            ? Number(values.totalContractValue)
            : null,
          startDate: new Date().toISOString(),
        }),
      })
      onSaved()
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

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <FormField control={form.control} name="totalContractValue" render={({ field }) => (
                  <FormItem>
                    <FormLabel>שווי חוזה</FormLabel>
                    <FormControl><Input type="number" placeholder="0" {...field} /></FormControl>
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="currency" render={({ field }) => (
                <FormItem>
                  <FormLabel>מטבע</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {CURRENCY_OPTIONS.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )} />
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
