import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const schema = z.object({
  costType: z.enum(["DEVELOPMENT", "DESIGN", "HOSTING", "TOOLS", "LICENSES", "PARTNER", "SUBCONTRACTOR", "OTHER"]),
  billingType: z.enum(["ONE_TIME", "MONTHLY", "YEARLY"]).optional(),
  description: z.string().optional(),
  vendor: z.string().optional(),
  amount: z.number(),
  currency: z.string().optional(),
  date: z.string().optional().nullable(),
  isPaid: z.boolean().optional(),
  paymentMethod: z.string().optional(),
  invoiceLink: z.string().optional(),
  notes: z.string().optional(),
})

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id: projectId } = await params
  const costs = await prisma.cost.findMany({
    where: { projectId },
    orderBy: { date: "desc" },
  })
  return NextResponse.json(costs)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id: projectId } = await params
  const body = await req.json()
  const data = schema.parse(body)
  const cost = await prisma.cost.create({
    data: {
      ...data,
      projectId,
      date: data.date ? new Date(data.date) : undefined,
    },
  })
  return NextResponse.json(cost, { status: 201 })
}
