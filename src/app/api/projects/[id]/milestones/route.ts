import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const schema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  amount: z.number().optional().nullable(),
  percentage: z.number().optional().nullable(),
  targetDate: z.string().optional().nullable(),
  executionStatus: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "BLOCKED"]).optional(),
  completedAt: z.string().optional().nullable(),
  paymentStatus: z.enum(["PENDING", "REQUESTED", "PARTIAL", "PAID", "OVERDUE", "CANCELLED"]).optional(),
  paidAmount: z.number().optional().nullable(),
  paidAt: z.string().optional().nullable(),
  notes: z.string().optional(),
})

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id: projectId } = await params
  const milestones = await prisma.milestone.findMany({
    where: { projectId },
    orderBy: { targetDate: "asc" },
  })
  return NextResponse.json(milestones)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id: projectId } = await params
  const body = await req.json()
  const data = schema.parse(body)
  const milestone = await prisma.milestone.create({
    data: {
      ...data,
      projectId,
      targetDate: data.targetDate ? new Date(data.targetDate) : undefined,
      completedAt: data.completedAt ? new Date(data.completedAt) : undefined,
      paidAt: data.paidAt ? new Date(data.paidAt) : undefined,
    },
  })
  return NextResponse.json(milestone, { status: 201 })
}
