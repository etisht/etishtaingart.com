"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ClientForm } from "./client-form"
import { CLIENT_STATUS_CONFIG } from "@/lib/constants"
import { formatDate } from "@/lib/utils"
import { Plus, Search, MoreHorizontal, Eye, Edit, Trash2, Building2 } from "lucide-react"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { EmptyState } from "@/components/shared/empty-state"
import type { Client, Contact } from "@/generated/prisma/client"

type ClientRow = Client & {
  contacts: Contact[]
  _count: { contacts: number; projects: number }
}

interface ClientsTableProps {
  initialClients: ClientRow[]
}

export function ClientsTable({ initialClients }: ClientsTableProps) {
  const router = useRouter()
  const [clients, setClients] = useState(initialClients)
  const [search, setSearch] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [editClient, setEditClient] = useState<ClientRow | null>(null)

  const filtered = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.industry ?? "").toLowerCase().includes(search.toLowerCase())
  )

  const handleDelete = async (id: string) => {
    await fetch(`/api/clients/${id}`, { method: "DELETE" })
    setClients((prev) => prev.filter((c) => c.id !== id))
  }

  const handleSaved = () => {
    setShowForm(false)
    setEditClient(null)
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">לקוחות</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{clients.length} לקוחות</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 ml-2" />
          לקוח חדש
        </Button>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="חיפוש לקוח..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-9"
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <EmptyState
              icon={Building2}
              title="אין לקוחות"
              description="הוסף לקוח ראשון כדי להתחיל"
              action={
                <Button onClick={() => setShowForm(true)} variant="outline" size="sm">
                  <Plus className="h-4 w-4 ml-2" />
                  לקוח חדש
                </Button>
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">שם לקוח</TableHead>
                  <TableHead className="text-right">סוג / תחום</TableHead>
                  <TableHead className="text-right">איש קשר ראשי</TableHead>
                  <TableHead className="text-right">פרויקטים</TableHead>
                  <TableHead className="text-right">סטטוס</TableHead>
                  <TableHead className="text-right">עדכון אחרון</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((client) => {
                  const statusCfg = CLIENT_STATUS_CONFIG[client.status]
                  const primaryContact = client.contacts[0]
                  return (
                    <TableRow key={client.id} className="hover:bg-slate-50 cursor-pointer">
                      <TableCell>
                        <Link href={`/clients/${client.id}`} className="font-medium hover:text-blue-600 transition-colors">
                          {client.name}
                        </Link>
                        {client.industry && (
                          <p className="text-xs text-muted-foreground">{client.industry}</p>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {client.type && <span>{client.type}</span>}
                        </div>
                      </TableCell>
                      <TableCell>
                        {primaryContact ? (
                          <div>
                            <p className="text-sm">{primaryContact.fullName}</p>
                            {primaryContact.email && (
                              <p className="text-xs text-muted-foreground">{primaryContact.email}</p>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{client._count.projects}</Badge>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusCfg.color}`}>
                          {statusCfg.label}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(client.updatedAt)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/clients/${client.id}`} className="flex items-center gap-2">
                                <Eye className="h-4 w-4" />
                                צפייה
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setEditClient(client)}>
                              <Edit className="h-4 w-4 ml-2" />
                              עריכה
                            </DropdownMenuItem>
                            <ConfirmDialog
                              trigger={
                                <DropdownMenuItem
                                  onSelect={(e) => e.preventDefault()}
                                  className="text-red-600 focus:text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 ml-2" />
                                  מחיקה
                                </DropdownMenuItem>
                              }
                              onConfirm={() => handleDelete(client.id)}
                            />
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {(showForm || editClient) && (
        <ClientForm
          client={editClient}
          onSaved={handleSaved}
          onClose={() => { setShowForm(false); setEditClient(null) }}
        />
      )}
    </div>
  )
}
