import { prisma } from "@/lib/prisma"
import { KpiCard } from "@/components/dashboard/kpi-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/components/projects/status-badge"
import { formatCurrency, formatDate } from "@/lib/utils"
import { PRIORITY_CONFIG } from "@/lib/constants"
import Link from "next/link"
import {
  FolderKanban, FileText, Hammer, TrendingUp,
  Banknote, Clock, AlertTriangle, CalendarClock,
} from "lucide-react"
import { subDays, addDays } from "date-fns"

export default async function DashboardPage() {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [
    activeCount,
    openQuotesCount,
    inDevCount,
    negotiationCount,
    paidThisMonth,
    outstanding,
    upcomingMilestones,
    stuckProjects,
    upcomingDeadlines,
    openQuotesValue,
  ] = await Promise.all([
    prisma.project.count({
      where: { status: { code: { notIn: ["COMPLETED", "QUOTE_REJECTED"] } } },
    }),
    prisma.project.count({
      where: { status: { code: { in: ["QUOTE_SENT", "QUOTE_BEFORE_SPEC", "SPEC_BEFORE_QUOTE"] } } },
    }),
    prisma.project.count({ where: { status: { code: "DEVELOPMENT" } } }),
    prisma.project.count({ where: { status: { code: "NEGOTIATION" } } }),
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: { status: "PAID", paidDate: { gte: startOfMonth } },
    }),
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: { status: { in: ["PENDING", "REQUESTED", "PARTIAL"] } },
    }),
    prisma.milestone.findMany({
      where: {
        targetDate: { gte: now, lte: addDays(now, 30) },
        executionStatus: { not: "COMPLETED" },
      },
      include: { project: { include: { client: true, status: true } } },
      orderBy: { targetDate: "asc" },
      take: 8,
    }),
    prisma.project.findMany({
      where: {
        status: { code: { in: ["DEVELOPMENT", "BUG_FIXES", "SUPPORT", "NEGOTIATION"] } },
        updatedAt: { lt: subDays(now, 14) },
      },
      include: { client: true, status: true },
      orderBy: { updatedAt: "asc" },
      take: 6,
    }),
    prisma.project.findMany({
      where: {
        targetDate: { gte: now, lte: addDays(now, 14) },
        status: { code: { notIn: ["COMPLETED", "QUOTE_REJECTED"] } },
      },
      include: { client: true, status: true },
      orderBy: { targetDate: "asc" },
      take: 6,
    }),
    prisma.project.aggregate({
      _sum: { totalContractValue: true },
      where: { status: { code: { in: ["QUOTE_SENT", "NEGOTIATION"] } } },
    }),
  ])

  const paidAmount = Number(paidThisMonth._sum.amount ?? 0)
  const outstandingAmount = Number(outstanding._sum.amount ?? 0)
  const quotesValue = Number(openQuotesValue._sum.totalContractValue ?? 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">דשבורד</h1>
        <p className="text-sm text-muted-foreground mt-1">תמונת מצב עסקית</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="פרויקטים פעילים"
          value={activeCount}
          icon={FolderKanban}
          subtitle={`${inDevCount} בפיתוח`}
        />
        <KpiCard
          title="הצעות מחיר פתוחות"
          value={openQuotesCount}
          icon={FileText}
          subtitle={formatCurrency(quotesValue)}
          valueClassName="text-yellow-600"
        />
        <KpiCard
          title="שולם החודש"
          value={formatCurrency(paidAmount)}
          icon={Banknote}
          valueClassName="text-green-600"
        />
        <KpiCard
          title="יתרה לגבייה"
          value={formatCurrency(outstandingAmount)}
          icon={TrendingUp}
          valueClassName={outstandingAmount > 0 ? "text-orange-600" : undefined}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Milestones */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-blue-600" />
              מיילסטונים קרובים (30 יום)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingMilestones.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">אין מיילסטונים קרובים</p>
            ) : (
              <div className="space-y-3">
                {upcomingMilestones.map((m) => (
                  <Link
                    key={m.id}
                    href={`/projects/${m.project.id}`}
                    className="flex items-center justify-between hover:bg-slate-50 p-2 rounded-lg transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{m.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{m.project.client.name}</p>
                    </div>
                    <div className="text-left shrink-0 mr-4">
                      <p className="text-xs font-medium text-blue-600">{formatDate(m.targetDate)}</p>
                      {m.amount && (
                        <p className="text-xs text-muted-foreground">{formatCurrency(Number(m.amount))}</p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stuck Projects */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              פרויקטים ללא עדכון (14+ יום)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stuckProjects.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">כל הפרויקטים מעודכנים</p>
            ) : (
              <div className="space-y-3">
                {stuckProjects.map((p) => (
                  <Link
                    key={p.id}
                    href={`/projects/${p.id}`}
                    className="flex items-center justify-between hover:bg-slate-50 p-2 rounded-lg transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.client.name}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 mr-4">
                      <StatusBadge code={p.status.code} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Deadlines */}
        {upcomingDeadlines.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4 text-red-500" />
                דדליינים קרובים (14 יום)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingDeadlines.map((p) => (
                  <Link
                    key={p.id}
                    href={`/projects/${p.id}`}
                    className="flex items-center justify-between hover:bg-slate-50 p-2 rounded-lg transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.client.name}</p>
                    </div>
                    <div className="text-left shrink-0 mr-4">
                      <p className="text-xs font-semibold text-red-600">{formatDate(p.targetDate)}</p>
                      <StatusBadge code={p.status.code} className="mt-1" />
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
