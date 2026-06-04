import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id: projectId } = await params
  const activities = await prisma.activityLog.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
    take: 50,
  })
  return NextResponse.json(activities)
}
