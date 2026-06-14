import { prisma } from "@/lib/prisma"
import { KpiCard } from "@/components/dashboard/kpi-card"
import { HoursReportTab } from "@/components/dashboard/hours-report-tab"
import { StatusBadge } from "@/components/projects/status-badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatCurrency, formatDate } from "@/lib/utils"
import Link from "next/link"
import {
  FolderKanban, FileText, TrendingUp,
  Banknote, AlertTriangle, CalendarClock, Clock, ArrowLeft,
} from "lucide-react"
import { subDays, addDays } from "date-fns"

export default async function DashboardPage() {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [
    activeCount,
    openQuotesCount,
    inDevCount,
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
      take: 5,
    }),
    prisma.project.findMany({
      where: {
        targetDate: { gte: now, lte: addDays(now, 14) },
        status: { code: { notIn: ["COMPLETED", "QUOTE_REJECTED"] } },
      },
      include: { client: true, status: true },
      orderBy: { targetDate: "asc" },
      take: 5,
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
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">דשבורד</h1>
        <p className="text-sm text-muted-foreground mt-0.5">תמונת מצב עסקית עדכנית</p>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">סקירה כללית</TabsTrigger>
          <TabsTrigger value="hours">דוח שעות</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-4">
          {/* KPI Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              title="פרויקטים פעילים"
              value={activeCount}
              icon={FolderKanban}
              iconColor="text-blue-600"
              iconBg="bg-blue-50"
              subtitle={`${inDevCount} בפיתוח כעת`}
            />
            <KpiCard
              title="הצעות פתוחות"
              value={openQuotesCount}
              icon={FileText}
              iconColor="text-amber-600"
              iconBg="bg-amber-50"
              subtitle={formatCurrency(quotesValue)}
              valueClassName="text-amber-600"
            />
            <KpiCard
              title="שולם החודש"
              value={formatCurrency(paidAmount)}
              icon={Banknote}
              iconColor="text-green-600"
              iconBg="bg-green-50"
              valueClassName="text-green-600"
            />
            <KpiCard
              title="יתרה לגבייה"
              value={formatCurrency(outstandingAmount)}
              icon={TrendingUp}
              iconColor="text-orange-500"
              iconBg="bg-orange-50"
              valueClassName={outstandingAmount > 0 ? "text-orange-500" : "text-foreground"}
            />
          </div>

          {/* Bottom Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

            {/* Upcoming Milestones */}
            <div className="bg-white rounded-xl border border-border/60 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-border/60">
                <div className="flex items-center gap-2">
                  <CalendarClock className="h-4 w-4 text-blue-500" />
                  <h3 className="font-semibold text-sm">מיילסטונים קרובים</h3>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">30 יום</span>
                </div>
                <Link href="/projects" className="text-xs text-primary hover:underline flex items-center gap-1">
                  כל הפרויקטים <ArrowLeft className="h-3 w-3" />
                </Link>
              </div>
              <div className="divide-y divide-border/40">
                {upcomingMilestones.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-10">אין מיילסטונים קרובים</p>
                ) : (
                  upcomingMilestones.map((m) => (
                    <Link key={m.id} href={`/projects/${m.project.id}`}
                      className="flex items-center justify-between px-5 py-3 hover:bg-muted/40 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{m.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{m.project.client.name}</p>
                      </div>
                      <div className="text-left shrink-0 mr-4 space-y-0.5">
                        <p className="text-xs font-semibold text-blue-600">{formatDate(m.targetDate)}</p>
                        {m.amount && (
                          <p className="text-xs text-muted-foreground">{formatCurrency(Number(m.amount))}</p>
                        )}
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>

            {/* Stuck Projects */}
            <div className="bg-white rounded-xl border border-border/60 overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-4 border-b border-border/60">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                <h3 className="font-semibold text-sm">פרויקטים ללא עדכון</h3>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">14+ יום</span>
              </div>
              <div className="divide-y divide-border/40">
                {stuckProjects.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-10">כל הפרויקטים מעודכנים ✓</p>
                ) : (
                  stuckProjects.map((p) => (
                    <Link key={p.id} href={`/projects/${p.id}`}
                      className="flex items-center justify-between px-5 py-3 hover:bg-muted/40 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.client.name}</p>
                      </div>
                      <div className="shrink-0 mr-4">
                        <StatusBadge code={p.status.code} />
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>

            {/* Upcoming Deadlines */}
            {upcomingDeadlines.length > 0 && (
              <div className="bg-white rounded-xl border border-border/60 overflow-hidden lg:col-span-2">
                <div className="flex items-center gap-2 px-5 py-4 border-b border-border/60">
                  <Clock className="h-4 w-4 text-red-500" />
                  <h3 className="font-semibold text-sm">דדליינים קרובים</h3>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">14 יום</span>
                </div>
                <div className="divide-y divide-border/40">
                  {upcomingDeadlines.map((p) => (
                    <Link key={p.id} href={`/projects/${p.id}`}
                      className="flex items-center justify-between px-5 py-3 hover:bg-muted/40 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.client.name}</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 mr-4">
                        <p className="text-xs font-semibold text-red-600">{formatDate(p.targetDate)}</p>
                        <StatusBadge code={p.status.code} />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="hours" className="mt-4">
          <HoursReportTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
