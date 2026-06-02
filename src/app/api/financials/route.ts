import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { startOfMonth, endOfMonth, subMonths } from "date-fns"

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const now = new Date()
  const startOfCurrentMonth = startOfMonth(now)
  const endOfCurrentMonth = endOfMonth(now)

  const [
    projectStats,
    paidThisMonth,
    outstanding,
    totalCosts,
    openQuotesValue,
    recentMonthsPayments,
  ] = await Promise.all([
    prisma.project.aggregate({
      _count: { id: true },
      where: { status: { code: { notIn: ["COMPLETED", "QUOTE_REJECTED"] } } },
    }),
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: { status: "PAID", paidDate: { gte: startOfCurrentMonth, lte: endOfCurrentMonth } },
    }),
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: { status: { in: ["PENDING", "REQUESTED", "PARTIAL"] } },
    }),
    prisma.cost.aggregate({
      _sum: { amount: true },
      where: { isPaid: false },
    }),
    prisma.project.aggregate({
      _sum: { totalContractValue: true },
      where: { status: { code: { in: ["QUOTE_SENT", "NEGOTIATION"] } } },
    }),
    // Last 6 months of payments
    prisma.payment.groupBy({
      by: ["paidDate"],
      _sum: { amount: true },
      where: {
        status: "PAID",
        paidDate: { gte: subMonths(now, 6) },
      },
    }),
  ])

  return NextResponse.json({
    activeProjectsCount: projectStats._count.id,
    paidThisMonth: Number(paidThisMonth._sum.amount ?? 0),
    outstanding: Number(outstanding._sum.amount ?? 0),
    unpaidCosts: Number(totalCosts._sum.amount ?? 0),
    openQuotesValue: Number(openQuotesValue._sum.totalContractValue ?? 0),
    recentMonthsPayments,
  })
}
