import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const schema = z.object({
  milestoneId: z.string().optional().nullable(),
  amount: z.number(),
  currency: z.string().optional(),
  requestDate: z.string().optional().nullable(),
  paidDate: z.string().optional().nullable(),
  status: z.enum(["PENDING", "REQUESTED", "PARTIAL", "PAID", "OVERDUE", "CANCELLED"]).optional(),
  method: z.string().optional(),
  invoiceNumber: z.string().optional(),
  invoiceLink: z.string().optional(),
  notes: z.string().optional(),
})

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id: projectId } = await params
  const payments = await prisma.payment.findMany({
    where: { projectId },
    include: { milestone: true },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(payments)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id: projectId } = await params
  const body = await req.json()
  const data = schema.parse(body)
  const payment = await prisma.payment.create({
    data: {
      ...data,
      projectId,
      requestDate: data.requestDate ? new Date(data.requestDate) : undefined,
      paidDate: data.paidDate ? new Date(data.paidDate) : undefined,
    },
  })
  return NextResponse.json(payment, { status: 201 })
}
