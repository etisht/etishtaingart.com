"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form"
import { useForm } from "react-hook-form"
import { Pencil, Check, X, ExternalLink } from "lucide-react"
import type { TechnicalLink } from "@/generated/prisma/client"

interface TabTechnicalProps {
  projectId: string
  technicalLink: TechnicalLink | null
}

const FIELD_LABELS: Record<string, string> = {
  platform:        "פלטפורמה",
  systemUrl:       "קישור למערכת",
  hostingUrl:      "קישור Hosting",
  hostingProvider: "ספק Hosting",
  dbUrl:           "קישור DB",
  dbProvider:      "ספק DB",
  gitUrl:          "קישור Git",
  repoName:        "שם Repository",
  productionUrl:   "Production URL",
  devUrl:          "Dev / Test URL",
}

export function TabTechnical({ projectId, technicalLink: initial }: TabTechnicalProps) {
  const router = useRouter()
  const [link, setLink] = useState(initial)
  const [editing, setEditing] = useState(!initial)
  const [loading, setLoading] = useState(false)

  const form = useForm({
    defaultValues: {
      platform:        link?.platform ?? "",
      systemUrl:       link?.systemUrl ?? "",
      hostingUrl:      link?.hostingUrl ?? "",
      hostingProvider: link?.hostingProvider ?? "",
      dbUrl:           link?.dbUrl ?? "",
      dbProvider:      link?.dbProvider ?? "",
      gitUrl:          link?.gitUrl ?? "",
      repoName:        link?.repoName ?? "",
      productionUrl:   link?.productionUrl ?? "",
      devUrl:          link?.devUrl ?? "",
      integrationNotes: link?.integrationNotes ?? "",
      technicalNotes:  link?.technicalNotes ?? "",
    },
  })

  const onSave = async (values: { platform: string; systemUrl: string; hostingUrl: string; hostingProvider: string; dbUrl: string; dbProvider: string; gitUrl: string; repoName: string; productionUrl: string; devUrl: string; integrationNotes: string; technicalNotes: string }) => {
    setLoading(true)
    const res = await fetch(`/api/projects/${projectId}/technical`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    })
    const updated: TechnicalLink = await res.json()
    setLink(updated)
    setEditing(false)
    setLoading(false)
  }

  const urlFields = ["systemUrl", "hostingUrl", "gitUrl", "productionUrl", "devUrl", "dbUrl"]

  if (!editing && link) {
    const fields = Object.entries(FIELD_LABELS).filter(([key]) => (link as never)[key])
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold">מידע טכני</h3>
          <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
            <Pencil className="h-3.5 w-3.5 ml-1.5" />
            ערוך
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {fields.map(([key, label]) => {
            const value = (link as unknown as Record<string, string | null>)[key]
            const isUrl = urlFields.includes(key)
            return (
              <Card key={key} className="p-3">
                <p className="text-xs text-muted-foreground mb-1">{label}</p>
                {isUrl ? (
                  <a
                    href={value ?? ""}
                    target="_blank"
                    rel="noopener"
                    className="text-sm text-blue-600 hover:underline flex items-center gap-1 break-all"
                  >
                    {value}
                    <ExternalLink className="h-3 w-3 shrink-0" />
                  </a>
                ) : (
                  <p className="text-sm font-medium">{value}</p>
                )}
              </Card>
            )
          })}
        </div>
        {(link.integrationNotes || link.technicalNotes) && (
          <div className="space-y-3">
            {link.integrationNotes && (
              <Card className="p-4">
                <p className="text-xs text-muted-foreground mb-2">פרטי אינטגרציות</p>
                <p className="text-sm whitespace-pre-wrap">{link.integrationNotes}</p>
              </Card>
            )}
            {link.technicalNotes && (
              <Card className="p-4">
                <p className="text-xs text-muted-foreground mb-2">הערות טכניות</p>
                <p className="text-sm whitespace-pre-wrap">{link.technicalNotes}</p>
              </Card>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">מידע טכני</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSave)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(FIELD_LABELS).map(([key, label]) => (
                <FormField key={key} control={form.control} name={key as never} render={({ field }) => (
                  <FormItem>
                    <FormLabel>{label}</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                  </FormItem>
                )} />
              ))}
            </div>
            <FormField control={form.control} name="integrationNotes" render={({ field }) => (
              <FormItem>
                <FormLabel>פרטי אינטגרציות (API, Make, Zapier...)</FormLabel>
                <FormControl><Textarea rows={3} {...field} /></FormControl>
              </FormItem>
            )} />
            <FormField control={form.control} name="technicalNotes" render={({ field }) => (
              <FormItem>
                <FormLabel>הערות טכניות</FormLabel>
                <FormControl><Textarea rows={3} {...field} /></FormControl>
              </FormItem>
            )} />
            <div className="flex gap-2">
              <Button type="submit" disabled={loading} size="sm">
                <Check className="h-4 w-4 ml-1" />
                {loading ? "שומר..." : "שמור"}
              </Button>
              {link && (
                <Button type="button" variant="outline" size="sm" onClick={() => setEditing(false)}>
                  <X className="h-4 w-4 ml-1" />
                  ביטול
                </Button>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
