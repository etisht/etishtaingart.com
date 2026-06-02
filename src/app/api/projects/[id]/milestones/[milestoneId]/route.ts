import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const schema = z.object({
  name: z.string().optional(),
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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ milestoneId: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { milestoneId } = await params
  const body = await req.json()
  const data = schema.parse(body)
  const milestone = await prisma.milestone.update({
    where: { id: milestoneId },
    data: {
      ...data,
      targetDate: data.targetDate ? new Date(data.targetDate) : data.targetDate,
      completedAt: data.completedAt ? new Date(data.completedAt) : data.completedAt,
      paidAt: data.paidAt ? new Date(data.paidAt) : data.paidAt,
    },
  })
  return NextResponse.json(milestone)
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ milestoneId: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { milestoneId } = await params
  await prisma.milestone.delete({ where: { id: milestoneId } })
  return NextResponse.json({ success: true })
}
