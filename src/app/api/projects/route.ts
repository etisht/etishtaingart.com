import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const schema = z.object({
  name: z.string().min(1),
  clientId: z.string().min(1),
  businessEntityId: z.string().min(1),
  primaryContactId: z.string().optional().nullable(),
  description: z.string().optional(),
  type: z.string().optional(),
  statusId: z.string().optional(),
  platform: z.string().optional(),
  startDate: z.string().optional().nullable(),
  targetDate: z.string().optional().nullable(),
  nextMilestoneDate: z.string().optional().nullable(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  internalNotes: z.string().optional(),
  contractOneTime: z.number().optional().nullable(),
  contractRecurring: z.number().optional().nullable(),
  contractRecurringType: z.enum(["MONTHLY", "YEARLY"]).optional().nullable(),
  totalContractValue: z.number().optional().nullable(),
  currency: z.string().optional(),
})

function computeTotal(oneTime?: number | null, recurring?: number | null, type?: string | null): number | null {
  if (!oneTime && !recurring) return null
  const base = oneTime ?? 0
  const rec = recurring ?? 0
  return base + (type === "MONTHLY" ? rec * 12 : rec)
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const statusCode = searchParams.get("status")
  const clientId = searchParams.get("clientId")
  const businessEntityId = searchParams.get("businessEntityId")
  const search = searchParams.get("search")

  const projects = await prisma.project.findMany({
    where: {
      ...(statusCode && { status: { code: statusCode as never } }),
      ...(clientId && { clientId }),
      ...(businessEntityId && { businessEntityId }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { client: { name: { contains: search, mode: "insensitive" } } },
        ],
      }),
    },
    include: {
      client: true,
      businessEntity: true,
      status: true,
      primaryContact: true,
      _count: { select: { milestones: true, tasks: true } },
    },
    orderBy: { updatedAt: "desc" },
  })
  return NextResponse.json(projects)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const data = schema.parse(body)

  let statusId = data.statusId
  if (!statusId) {
    const defaultStatus = await prisma.projectStatus.findFirst({
      orderBy: { order: "asc" },
    })
    statusId = defaultStatus!.id
  }

  const project = await prisma.project.create({
    data: {
      ...data,
      statusId,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      targetDate: data.targetDate ? new Date(data.targetDate) : undefined,
      nextMilestoneDate: data.nextMilestoneDate ? new Date(data.nextMilestoneDate) : undefined,
      contractOneTime: data.contractOneTime ?? undefined,
      contractRecurring: data.contractRecurring ?? undefined,
      contractRecurringType: data.contractRecurringType ?? undefined,
      totalContractValue: computeTotal(data.contractOneTime, data.contractRecurring, data.contractRecurringType) ?? data.totalContractValue ?? undefined,
    },
    include: { client: true, status: true, businessEntity: true },
  })

  await prisma.activityLog.create({
    data: {
      entityType: "PROJECT",
      entityId: project.id,
      action: "created",
      newValue: { name: project.name },
      createdBy: (session.user as { id: string }).id,
      projectId: project.id,
    },
  })

  return NextResponse.json(project, { status: 201 })
}
