import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const schema = z.object({
  name: z.string().min(1).optional(),
  clientId: z.string().optional(),
  businessEntityId: z.string().optional(),
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
  totalContractValue: z.number().optional().nullable(),
  currency: z.string().optional(),
})

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      client: { include: { contacts: true } },
      businessEntity: true,
      status: true,
      primaryContact: true,
      milestones: { orderBy: { targetDate: "asc" } },
      payments: { orderBy: { createdAt: "desc" } },
      costs: { orderBy: { date: "desc" } },
      partners: { include: { partner: true } },
      documents: { orderBy: { createdAt: "desc" } },
      technicalLink: true,
      worklogs: { orderBy: { workDate: "desc" } },
      tasks: { orderBy: { targetDate: "asc" } },
      projectNotes: { orderBy: { createdAt: "desc" } },
      activities: { orderBy: { createdAt: "desc" }, take: 50 },
    },
  })
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(project)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const body = await req.json()
  const data = schema.parse(body)

  const old = await prisma.project.findUnique({ where: { id }, select: { statusId: true } })

  const project = await prisma.project.update({
    where: { id },
    data: {
      ...data,
      startDate: data.startDate ? new Date(data.startDate) : data.startDate,
      targetDate: data.targetDate ? new Date(data.targetDate) : data.targetDate,
      nextMilestoneDate: data.nextMilestoneDate ? new Date(data.nextMilestoneDate) : data.nextMilestoneDate,
      totalContractValue: data.totalContractValue ?? undefined,
    },
    include: { status: true },
  })

  const action = data.statusId && old?.statusId !== data.statusId ? "status_changed" : "updated"
  await prisma.activityLog.create({
    data: {
      entityType: "PROJECT",
      entityId: id,
      action,
      oldValue: old ?? undefined,
      newValue: data,
      createdBy: (session.user as { id: string }).id,
      projectId: id,
    },
  })

  return NextResponse.json(project)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  await prisma.project.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
