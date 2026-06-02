import { prisma } from "@/lib/prisma"
import { KpiCard } from "@/components/dashboard/kpi-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/components/projects/status-badge"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Banknote, TrendingUp, TrendingDown, Receipt, FolderKanban } from "lucide-react"
import Link from "next/link"
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns"
import { he } from "date-fns/locale"

export default async function FinancialsPage() {
  const now = new Date()
  const startCurrentMonth = startOfMonth(now)
  const endCurrentMonth = endOfMonth(now)

  const [
    totalContractValue,
    totalPaidAllTime,
    totalOutstanding,
    totalUnpaidCosts,
    paidThisMonth,
    openQuotesValue,
    projectsWithFinancials,
    monthlySummary,
  ] = await Promise.all([
    prisma.project.aggregate({
      _sum: { totalContractValue: true },
      where: { status: { code: { notIn: ["QUOTE_REJECTED"] } } },
    }),
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: { status: "PAID" },
    }),
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: { status: { in: ["PENDING", "REQUESTED", "PARTIAL"] } },
    }),
    prisma.cost.aggregate({
      _sum: { amount: true },
      where: { isPaid: false },
    }),
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: { status: "PAID", paidDate: { gte: startCurrentMonth, lte: endCurrentMonth } },
    }),
    prisma.project.aggregate({
      _sum: { totalContractValue: true },
      where: { status: { code: { in: ["QUOTE_SENT", "NEGOTIATION"] } } },
    }),
    prisma.project.findMany({
      where: { totalContractValue: { gt: 0 } },
      include: {
        client: true,
        status: true,
        businessEntity: true,
        payments: { where: { status: "PAID" } },
        costs: true,
      },
      orderBy: { totalContractValue: "desc" },
      take: 20,
    }),
    // Monthly payments for last 6 months
    Promise.all(
      Array.from({ length: 6 }, (_, i) => {
        const d = subMonths(now, 5 - i)
        return prisma.payment.aggregate({
          _sum: { amount: true },
          where: {
            status: "PAID",
            paidDate: { gte: startOfMonth(d), lte: endOfMonth(d) },
          },
        }).then((r) => ({
          month: format(d, "MMM yy", { locale: he }),
          amount: Number(r._sum.amount ?? 0),
        }))
      })
    ),
  ])

  const totalContract = Number(totalContractValue._sum.totalContractValue ?? 0)
  const totalPaid = Number(totalPaidAllTime._sum.amount ?? 0)
  const outstanding = Number(totalOutstanding._sum.amount ?? 0)
  const unpaidCosts = Number(totalUnpaidCosts._sum.amount ?? 0)
  const paidMonth = Number(paidThisMonth._sum.amount ?? 0)
  const quotesVal = Number(openQuotesValue._sum.totalContractValue ?? 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">דשבורד פיננסי</h1>
        <p className="text-sm text-muted-foreground mt-0.5">סיכום כספי כולל</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="שווי חוזים פעילים" value={formatCurrency(totalContract)} icon={FolderKanban} />
        <KpiCard title="שולם סה״כ" value={formatCurrency(totalPaid)} icon={Banknote} valueClassName="text-green-600" />
        <KpiCard title="יתרה לגבייה" value={formatCurrency(outstanding)} icon={TrendingUp} valueClassName="text-orange-600" />
        <KpiCard title="עלויות טרם שולמו" value={formatCurrency(unpaidCosts)} icon={Receipt} valueClassName="text-red-600" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <KpiCard title="שולם החודש" value={formatCurrency(paidMonth)} icon={Banknote} valueClassName="text-green-600" subtitle={format(now, "MMMM yyyy", { locale: he })} />
        <KpiCard title="הצעות מחיר פתוחות" value={formatCurrency(quotesVal)} icon={TrendingDown} valueClassName="text-yellow-600" />
      </div>

      {/* Monthly summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">הכנסות לפי חודש (6 חודשים אחרונים)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end h-32">
            {monthlySummary.map(({ month, amount }) => {
              const max = Math.max(...monthlySummary.map((m) => m.amount), 1)
              const height = Math.max((amount / max) * 100, 4)
              return (
                <div key={month} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs font-medium text-slate-600">{formatCurrency(amount)}</span>
                  <div
                    className="w-full bg-blue-500 rounded-t-sm transition-all"
                    style={{ height: `${height}%` }}
                  />
                  <span className="text-xs text-muted-foreground">{month}</span>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Projects financial breakdown */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">פירוט פיננסי לפי פרויקט</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-50">
                  <th className="text-right px-4 py-2 font-medium">פרויקט</th>
                  <th className="text-right px-4 py-2 font-medium">לקוח</th>
                  <th className="text-right px-4 py-2 font-medium">סטטוס</th>
                  <th className="text-left px-4 py-2 font-medium">שווי חוזה</th>
                  <th className="text-left px-4 py-2 font-medium">שולם</th>
                  <th className="text-left px-4 py-2 font-medium">עלויות</th>
                  <th className="text-left px-4 py-2 font-medium">רווח צפוי</th>
                </tr>
              </thead>
              <tbody>
                {projectsWithFinancials.map((p) => {
                  const paid = p.payments.reduce((s, x) => s + Number(x.amount), 0)
                  const costs = p.costs.reduce((s, x) => s + Number(x.amount), 0)
                  const contract = Number(p.totalContractValue ?? 0)
                  const profit = contract - costs
                  return (
                    <tr key={p.id} className="border-b hover:bg-slate-50">
                      <td className="px-4 py-2">
                        <Link href={`/projects/${p.id}`} className="font-medium hover:text-blue-600">{p.name}</Link>
                        <p className="text-xs text-muted-foreground">{p.businessEntity.name}</p>
                      </td>
                      <td className="px-4 py-2 text-muted-foreground">{p.client.name}</td>
                      <td className="px-4 py-2"><StatusBadge code={p.status.code} /></td>
                      <td className="px-4 py-2 text-left font-mono">{formatCurrency(contract, p.currency)}</td>
                      <td className="px-4 py-2 text-left font-mono text-green-600">{formatCurrency(paid, p.currency)}</td>
                      <td className="px-4 py-2 text-left font-mono text-red-600">{formatCurrency(costs, p.currency)}</td>
                      <td className={`px-4 py-2 text-left font-mono font-semibold ${profit >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {formatCurrency(profit, p.currency)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
