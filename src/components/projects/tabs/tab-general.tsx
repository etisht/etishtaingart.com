"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm, useWatch } from "react-hook-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form"
import { StatusBadge } from "@/components/projects/status-badge"
import { PROJECT_TYPE_OPTIONS, PLATFORM_OPTIONS, CURRENCY_OPTIONS } from "@/lib/constants"
import { formatDate, formatCurrency } from "@/lib/utils"
import { Pencil, Check, X, Mail, Phone } from "lucide-react"
import type { Project, Client, Contact, BusinessEntity, ProjectStatus } from "@/generated/prisma/client"

type FullProject = Project & {
  client: Client & { contacts: Contact[] }
  businessEntity: BusinessEntity
  status: ProjectStatus
  primaryContact: Contact | null
}

function ContractBreakdown({ project, currency }: { project: FullProject; currency: string }) {
  const oneTime = Number(project.contractOneTime ?? 0)
  const recurring = Number(project.contractRecurring ?? 0)
  const recurringType = project.contractRecurringType

  if (!oneTime && !recurring) return null

  const annualRecurring = recurringType === "MONTHLY" ? recurring * 12 : recurring
  const total = oneTime + annualRecurring

  return (
    <div className="space-y-1 text-sm">
      {oneTime > 0 && (
        <div className="flex justify-between">
          <span className="text-muted-foreground">חד פעמי</span>
          <span className="font-medium">{formatCurrency(oneTime, currency)}</span>
        </div>
      )}
      {recurring > 0 && (
        <div className="flex justify-between">
          <span className="text-muted-foreground">מנוי {recurringType === "MONTHLY" ? "חודשי" : "שנתי"}</span>
          <span className="font-medium">
            {formatCurrency(recurring, currency)}/{recurringType === "MONTHLY" ? "חודש" : "שנה"}
            {recurringType === "MONTHLY" && <span className="text-xs text-muted-foreground mr-1">({formatCurrency(annualRecurring, currency)}/שנה)</span>}
          </span>
        </div>
      )}
      {oneTime > 0 && recurring > 0 && (
        <div className="flex justify-between border-t pt-1 mt-1">
          <span className="font-semibold">שווי שנתי</span>
          <span className="font-bold">{formatCurrency(total, currency)}</span>
        </div>
      )}
    </div>
  )
}

type GeneralFormValues = {
  name: string; description: string; type: string; platform: string
  targetDate: string; nextMilestoneDate: string
  totalContractValue: string
  contractOneTime: string; contractRecurring: string; contractRecurringType: string
  currency: string; priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT"; internalNotes: string
}

export function TabGeneral({ project }: { project: FullProject }) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)

  const form = useForm<GeneralFormValues>({
    defaultValues: {
      name: project.name,
      description: project.description ?? "",
      type: project.type ?? "",
      platform: project.platform ?? "",
      targetDate: project.targetDate ? new Date(project.targetDate).toISOString().split("T")[0] : "",
      nextMilestoneDate: project.nextMilestoneDate ? new Date(project.nextMilestoneDate).toISOString().split("T")[0] : "",
      totalContractValue: project.totalContractValue ? String(Number(project.totalContractValue)) : "",
      contractOneTime: project.contractOneTime ? String(Number(project.contractOneTime)) : "",
      contractRecurring: project.contractRecurring ? String(Number(project.contractRecurring)) : "",
      contractRecurringType: project.contractRecurringType ?? "MONTHLY",
      currency: project.currency,
      priority: project.priority,
      internalNotes: project.internalNotes ?? "",
    },
  })

  const watchedOneTime = useWatch({ control: form.control, name: "contractOneTime" })
  const watchedRecurring = useWatch({ control: form.control, name: "contractRecurring" })
  const watchedRecurringType = useWatch({ control: form.control, name: "contractRecurringType" })
  const watchedCurrency = useWatch({ control: form.control, name: "currency" }) ?? project.currency

  const liveOneTime = Number(watchedOneTime) || 0
  const liveRecurring = Number(watchedRecurring) || 0
  const liveAnnual = watchedRecurringType === "MONTHLY" ? liveRecurring * 12 : liveRecurring
  const liveTotal = liveOneTime + liveAnnual

  const onSave = async (values: GeneralFormValues) => {
    setLoading(true)
    await fetch(`/api/projects/${project.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...values,
        totalContractValue: values.totalContractValue ? Number(values.totalContractValue) : null,
        contractOneTime: values.contractOneTime ? Number(values.contractOneTime) : null,
        contractRecurring: values.contractRecurring ? Number(values.contractRecurring) : null,
        contractRecurringType: values.contractRecurringType || null,
      }),
    })
    setEditing(false)
    setLoading(false)
    router.refresh()
  }

  const primaryContact = project.primaryContact ?? project.client.contacts.find((c) => c.isPrimary)

  if (!editing) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm">פרטי פרויקט</CardTitle>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditing(true)}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {project.description && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">תיאור</p>
                <p className="text-slate-700">{project.description}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted-foreground">סוג פרויקט</p>
                <p className="font-medium">{project.type ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">פלטפורמה</p>
                <p className="font-medium">{project.platform ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">תאריך יעד</p>
                <p className="font-medium">{formatDate(project.targetDate)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">מיילסטון הבא</p>
                <p className="font-medium">{formatDate(project.nextMilestoneDate)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">תאריך פתיחה</p>
                <p className="font-medium">{formatDate(project.startDate)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">סטטוס</p>
                <StatusBadge code={project.status.code} className="mt-0.5" />
              </div>
            </div>

            {(project.contractOneTime || project.contractRecurring) && (
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground mb-2">שווי חוזה</p>
                <ContractBreakdown project={project} currency={project.currency} />
              </div>
            )}

            {project.internalNotes && (
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground mb-1">הערות פנימיות</p>
                <p className="text-slate-600 text-sm whitespace-pre-wrap">{project.internalNotes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">לקוח ואיש קשר</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">לקוח</p>
              <p className="font-semibold text-base">{project.client.name}</p>
              {project.client.industry && <p className="text-xs text-muted-foreground">{project.client.industry}</p>}
            </div>
            <div>
              <p className="text-xs text-muted-foreground">ישות עסקית</p>
              <p className="font-medium">{project.businessEntity.name}</p>
            </div>
            {primaryContact && (
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground mb-2">איש קשר ראשי</p>
                <p className="font-medium">{primaryContact.fullName}</p>
                {primaryContact.role && <p className="text-xs text-muted-foreground">{primaryContact.role}</p>}
                <div className="flex gap-3 mt-1.5">
                  {primaryContact.email && (
                    <a href={`mailto:${primaryContact.email}`} className="text-xs text-blue-600 flex items-center gap-1 hover:underline">
                      <Mail className="h-3 w-3" />{primaryContact.email}
                    </a>
                  )}
                  {primaryContact.phone && (
                    <a href={`tel:${primaryContact.phone}`} className="text-xs flex items-center gap-1">
                      <Phone className="h-3 w-3" />{primaryContact.phone}
                    </a>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">עריכת פרויקט</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSave)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>שם פרויקט</FormLabel>
                <FormControl><Input {...field} /></FormControl>
              </FormItem>
            )} />
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>תיאור</FormLabel>
                <FormControl><Textarea rows={2} {...field} /></FormControl>
              </FormItem>
            )} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="type" render={({ field }) => (
                <FormItem>
                  <FormLabel>סוג</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="בחר" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {PROJECT_TYPE_OPTIONS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FormItem>
              )} />
              <FormField control={form.control} name="platform" render={({ field }) => (
                <FormItem>
                  <FormLabel>פלטפורמה</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="בחר" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {PLATFORM_OPTIONS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
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
              <FormField control={form.control} name="nextMilestoneDate" render={({ field }) => (
                <FormItem>
                  <FormLabel>מיילסטון הבא</FormLabel>
                  <FormControl><Input type="date" {...field} /></FormControl>
                </FormItem>
              )} />
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
              <FormField control={form.control} name="currency" render={({ field }) => (
                <FormItem>
                  <FormLabel>מטבע</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {CURRENCY_OPTIONS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FormItem>
              )} />
            </div>

            {/* Contract value */}
            <div className="space-y-2 border rounded-lg p-3 bg-slate-50">
              <p className="text-xs font-semibold text-muted-foreground">שווי חוזה</p>
              <FormField control={form.control} name="totalContractValue" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">סכום כולל (ישיר)</FormLabel>
                  <FormControl><Input type="number" placeholder="0" {...field} /></FormControl>
                </FormItem>
              )} />
              <p className="text-xs text-muted-foreground">או לחלופין — פירוט:</p>
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
                  <span className="font-bold">{formatCurrency(liveTotal, watchedCurrency)}</span>
                </div>
              )}
            </div>

            <FormField control={form.control} name="internalNotes" render={({ field }) => (
              <FormItem>
                <FormLabel>הערות פנימיות</FormLabel>
                <FormControl><Textarea rows={3} {...field} /></FormControl>
              </FormItem>
            )} />
            <div className="flex gap-2">
              <Button type="submit" disabled={loading} size="sm">
                <Check className="h-4 w-4 ml-1" />
                {loading ? "שומר..." : "שמור"}
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setEditing(false)}>
                <X className="h-4 w-4 ml-1" />
                ביטול
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
