import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/projects/status-badge"
import { ContactsList } from "@/components/clients/contacts-list"
import { CLIENT_STATUS_CONFIG } from "@/lib/constants"
import { formatDate, formatCurrency } from "@/lib/utils"
import { Globe, Plus, ExternalLink } from "lucide-react"

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      contacts: { orderBy: [{ isPrimary: "desc" }, { fullName: "asc" }] },
      projects: {
        include: { status: true, businessEntity: true },
        orderBy: { updatedAt: "desc" },
      },
    },
  })
  if (!client) notFound()

  const statusCfg = CLIENT_STATUS_CONFIG[client.status]

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-slate-900">{client.name}</h1>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusCfg.color}`}>
              {statusCfg.label}
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            {client.type && <span>{client.type}</span>}
            {client.industry && <span>· {client.industry}</span>}
            {client.source && <span>· מקור: {client.source}</span>}
          </div>
        </div>
        <div className="flex gap-2">
          {client.website && (
            <a href={client.website} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm">
                <Globe className="h-4 w-4 ml-2" />
                אתר
                <ExternalLink className="h-3 w-3 mr-1" />
              </Button>
            </a>
          )}
          <Link href={`/projects/new?clientId=${client.id}`}>
            <Button size="sm">
              <Plus className="h-4 w-4 ml-2" />
              פרויקט חדש
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info + Notes */}
        <div className="lg:col-span-1 space-y-4">
          {client.notes && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">הערות</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{client.notes}</p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="pt-4">
              <ContactsList clientId={client.id} contacts={client.contacts} />
            </CardContent>
          </Card>
        </div>

        {/* Projects */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base">פרויקטים ({client.projects.length})</CardTitle>
              <Link href={`/projects/new?clientId=${client.id}`}>
                <Button size="sm" variant="outline">
                  <Plus className="h-3.5 w-3.5 ml-1.5" />
                  חדש
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {client.projects.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">אין פרויקטים עדיין</p>
              ) : (
                <div className="space-y-3">
                  {client.projects.map((p) => (
                    <Link key={p.id} href={`/projects/${p.id}`}>
                      <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition-colors cursor-pointer">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm">{p.name}</p>
                          <p className="text-xs text-muted-foreground">{p.businessEntity.name}</p>
                        </div>
                        <div className="flex items-center gap-3 mr-4 shrink-0">
                          {p.totalContractValue && (
                            <span className="text-sm font-medium">{formatCurrency(Number(p.totalContractValue), p.currency)}</span>
                          )}
                          <StatusBadge code={p.status.code} />
                          <span className="text-xs text-muted-foreground">{formatDate(p.targetDate)}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
