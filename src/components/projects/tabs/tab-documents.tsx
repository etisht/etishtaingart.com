"use client"

import { useState, useRef } from "react"
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
import { Plus, Trash2, ExternalLink, FileText, Upload, Link2, Pencil, Download } from "lucide-react"
import type { Document } from "@/generated/prisma/client"

interface TabDocumentsProps {
  projectId: string
  documents: Document[]
}

type FormValues = {
  name: string
  type: string
  link: string
  version: string
  notes: string
}

export function TabDocuments({ projectId, documents: initial }: TabDocumentsProps) {
  const [docs, setDocs] = useState(initial)
  const [open, setOpen] = useState(false)
  const [editDoc, setEditDoc] = useState<Document | null>(null)
  const [loading, setLoading] = useState(false)
  const [uploadMode, setUploadMode] = useState<"link" | "file">("link")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const form = useForm<FormValues>({
    defaultValues: { name: "", type: "QUOTE", link: "", version: "", notes: "" },
  })

  const openNew = () => {
    setEditDoc(null)
    setUploadMode("link")
    setSelectedFile(null)
    setUploadProgress(null)
    form.reset({ name: "", type: "QUOTE", link: "", version: "", notes: "" })
    setOpen(true)
  }

  const openEdit = (doc: Document) => {
    setEditDoc(doc)
    setUploadMode(doc.fileAttachment ? "file" : "link")
    setSelectedFile(null)
    setUploadProgress(null)
    form.reset({
      name: doc.name,
      type: doc.type,
      link: doc.link ?? "",
      version: doc.version ?? "",
      notes: doc.notes ?? "",
    })
    setOpen(true)
  }

  const onSubmit = async (values: FormValues) => {
    setLoading(true)
    try {
      let fileAttachment: string | null = editDoc?.fileAttachment ?? null

      // Upload file if one was selected
      if (uploadMode === "file" && selectedFile) {
        setUploadProgress("מעלה קובץ...")
        const fd = new FormData()
        fd.append("file", selectedFile)
        const uploadRes = await fetch("/api/upload", { method: "POST", body: fd })
        if (!uploadRes.ok) {
          const err = await uploadRes.json()
          setUploadProgress(`שגיאה: ${err.error}`)
          setLoading(false)
          return
        }
        const { url } = await uploadRes.json()
        fileAttachment = url
        setUploadProgress(null)
      }

      const body = {
        ...values,
        link: uploadMode === "link" ? values.link || null : null,
        fileAttachment: uploadMode === "file" ? fileAttachment : null,
      }

      if (editDoc) {
        const res = await fetch(`/api/projects/${projectId}/documents/${editDoc.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
        const updated: Document = await res.json()
        setDocs((prev) => prev.map((d) => d.id === updated.id ? updated : d))
      } else {
        const res = await fetch(`/api/projects/${projectId}/documents`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
        const created: Document = await res.json()
        setDocs((prev) => [created, ...prev])
      }
      setOpen(false)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    await fetch(`/api/projects/${projectId}/documents/${id}`, { method: "DELETE" }).catch(() => {})
    setDocs((prev) => prev.filter((d) => d.id !== id))
  }

  const getFileUrl = (doc: Document) => doc.fileAttachment ?? (doc.link ? (doc.link.startsWith("http") ? doc.link : `https://${doc.link}`) : null)

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">מסמכים וקישורים</h3>
        <Button size="sm" onClick={openNew}>
          <Plus className="h-3.5 w-3.5 ml-1.5" />
          הוסף מסמך
        </Button>
      </div>

      {docs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground text-sm">
            אין מסמכים עדיין
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {docs.map((d) => {
            const url = getFileUrl(d)
            const isFile = !!d.fileAttachment
            return (
              <Card key={d.id} className="p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${isFile ? "bg-green-50" : "bg-blue-50"}`}>
                      {isFile
                        ? <Download className="h-4 w-4 text-green-600" />
                        : <Link2 className="h-4 w-4 text-blue-600" />
                      }
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{d.name}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <Badge variant="outline" className="text-xs">{DOCUMENT_TYPE_LABELS[d.type]}</Badge>
                        {d.version && <span className="text-xs text-muted-foreground">{d.version}</span>}
                        <span className="text-xs text-muted-foreground">{isFile ? "קובץ" : "קישור"}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{formatDate(d.createdAt)}</p>
                      {d.notes && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{d.notes}</p>}
                    </div>
                  </div>

                  <div className="flex gap-1 shrink-0">
                    {url && (
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center h-7 w-7 rounded-md text-blue-600 hover:bg-blue-50 transition-colors"
                        title={isFile ? "הורד קובץ" : "פתח קישור"}
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                    <button
                      onClick={() => openEdit(d)}
                      className="inline-flex items-center justify-center h-7 w-7 rounded-md text-muted-foreground hover:bg-muted transition-colors"
                      title="ערוך"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <ConfirmDialog
                      trigger={
                        <button className="inline-flex items-center justify-center h-7 w-7 rounded-md text-red-400 hover:bg-red-50 transition-colors">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      }
                      onConfirm={() => handleDelete(d.id)}
                    />
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Form Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editDoc ? "עריכת מסמך" : "מסמך חדש"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>שם מסמך *</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                </FormItem>
              )} />

              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="type" render={({ field }) => (
                  <FormItem>
                    <FormLabel>סוג</FormLabel>
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
                  <FormItem>
                    <FormLabel>גרסה</FormLabel>
                    <FormControl><Input placeholder="V1, Final..." {...field} /></FormControl>
                  </FormItem>
                )} />
              </div>

              {/* Link or File toggle */}
              <div>
                <p className="text-sm font-medium mb-2">סוג קובץ</p>
                <div className="flex rounded-lg border border-border overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setUploadMode("link")}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm transition-colors ${
                      uploadMode === "link"
                        ? "bg-primary text-primary-foreground font-medium"
                        : "bg-background text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <Link2 className="h-3.5 w-3.5" />
                    קישור
                  </button>
                  <button
                    type="button"
                    onClick={() => setUploadMode("file")}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm transition-colors border-r border-border ${
                      uploadMode === "file"
                        ? "bg-primary text-primary-foreground font-medium"
                        : "bg-background text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <Upload className="h-3.5 w-3.5" />
                    העלאת קובץ
                  </button>
                </div>
              </div>

              {uploadMode === "link" ? (
                <FormField control={form.control} name="link" render={({ field }) => (
                  <FormItem>
                    <FormLabel>קישור</FormLabel>
                    <FormControl>
                      <Input placeholder="https://drive.google.com/..." {...field} />
                    </FormControl>
                  </FormItem>
                )} />
              ) : (
                <div>
                  <p className="text-sm font-medium mb-2">קובץ</p>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/40 transition-colors"
                  >
                    {selectedFile ? (
                      <div className="space-y-1">
                        <FileText className="h-6 w-6 text-green-500 mx-auto" />
                        <p className="text-sm font-medium text-foreground">{selectedFile.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    ) : editDoc?.fileAttachment ? (
                      <div className="space-y-1">
                        <FileText className="h-6 w-6 text-blue-500 mx-auto" />
                        <p className="text-xs text-muted-foreground">קובץ קיים — לחץ להחלפה</p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <Upload className="h-6 w-6 text-muted-foreground mx-auto" />
                        <p className="text-sm text-muted-foreground">לחץ לבחירת קובץ</p>
                        <p className="text-xs text-muted-foreground">PDF, Word, Excel, תמונה — עד 10MB</p>
                      </div>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.webp"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
                  />
                  {uploadProgress && (
                    <p className={`text-xs mt-1 ${uploadProgress.startsWith("שגיאה") ? "text-red-500" : "text-blue-600"}`}>
                      {uploadProgress}
                    </p>
                  )}
                </div>
              )}

              <FormField control={form.control} name="notes" render={({ field }) => (
                <FormItem>
                  <FormLabel>הערות</FormLabel>
                  <FormControl><Textarea rows={2} {...field} /></FormControl>
                </FormItem>
              )} />

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>ביטול</Button>
                <Button type="submit" disabled={loading}>
                  {loading ? (uploadProgress ?? "שומר...") : editDoc ? "עדכון" : "שמור"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
