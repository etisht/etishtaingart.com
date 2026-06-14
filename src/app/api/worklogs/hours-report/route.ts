import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { startOfMonth, endOfMonth, parse } from "date-fns"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const monthParam = req.nextUrl.searchParams.get("month")
  const reference = monthParam ? parse(monthParam, "yyyy-MM", new Date()) : new Date()
  const from = startOfMonth(reference)
  const to = endOfMonth(reference)

  const logs = await prisma.workLog.findMany({
    where: {
      userId: (session.user as { id: string }).id,
      workDate: { gte: from, lte: to },
    },
    include: { project: { include: { client: true } } },
  })

  const byProject = new Map<string, { projectId: string; projectName: string; clientName: string; hours: number }>()
  let totalHours = 0

  for (const log of logs) {
    const hours = Number(log.totalHours)
    totalHours += hours
    const existing = byProject.get(log.projectId)
    if (existing) {
      existing.hours += hours
    } else {
      byProject.set(log.projectId, {
        projectId: log.projectId,
        projectName: log.project.name,
        clientName: log.project.client.name,
        hours,
      })
    }
  }

  const projects = Array.from(byProject.values()).sort((a, b) => b.hours - a.hours)

  return NextResponse.json({ totalHours, projects })
}
