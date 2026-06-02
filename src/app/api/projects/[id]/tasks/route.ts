import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const schema = z.object({
  name: z.string().min(1),
  assignee: z.string().optional(),
  targetDate: z.string().optional().nullable(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE", "BLOCKED"]).optional(),
  notes: z.string().optional(),
})

const patchSchema = schema.partial().extend({ id: z.string() })

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id: projectId } = await params
  const tasks = await prisma.task.findMany({
    where: { projectId },
    orderBy: { targetDate: "asc" },
  })
  return NextResponse.json(tasks)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id: projectId } = await params
  const body = await req.json()
  const data = schema.parse(body)
  const task = await prisma.task.create({
    data: {
      ...data,
      projectId,
      targetDate: data.targetDate ? new Date(data.targetDate) : undefined,
    },
  })
  return NextResponse.json(task, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await req.json()
  const { id, ...data } = patchSchema.parse(body)
  const task = await prisma.task.update({
    where: { id },
    data: {
      ...data,
      targetDate: data.targetDate ? new Date(data.targetDate) : data.targetDate,
    },
  })
  return NextResponse.json(task)
}
