import { NextRequest, NextResponse } from "next/server"
import { auth, getSessionUserId } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const schema = z.object({
  workDate: z.string(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  totalHours: z.number().positive(),
  performedBy: z.string().min(1),
  performerType: z.enum(["INTERNAL", "PARTNER", "EXTERNAL"]).optional(),
  workType: z.enum([
    "SPEC", "QUOTE", "DEVELOPMENT", "DESIGN", "QA", "BUG_FIXES",
    "CLIENT_MEETING", "PROJECT_MANAGEMENT", "SUPPORT", "INTEGRATIONS",
    "RESEARCH", "CONTENT", "TRAINING", "DEVOPS", "OTHER",
  ]),
  workDescription: z.string().optional(),
  billable: z.boolean().optional(),
  hourlyRate: z.number().optional().nullable(),
  calculatedCost: z.number().optional().nullable(),
  supplierId: z.string().optional(),
  supplierPaymentStatus: z.enum(["PENDING", "REQUESTED", "PARTIAL", "PAID", "OVERDUE", "CANCELLED"]).optional().nullable(),
  invoiceLink: z.string().optional(),
  notes: z.string().optional(),
})

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id: projectId } = await params
  const logs = await prisma.workLog.findMany({
    where: { projectId },
    orderBy: { workDate: "desc" },
  })
  return NextResponse.json(logs)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getSessionUserId()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id: projectId } = await params
  const body = await req.json()
  const data = schema.parse(body)
  const log = await prisma.workLog.create({
    data: {
      ...data,
      projectId,
      userId,
      workDate: new Date(data.workDate),
    },
  })
  return NextResponse.json(log, { status: 201 })
}
