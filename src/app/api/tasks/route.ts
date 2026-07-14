import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const schema = z.object({
  projectId: z.string().min(1),
  name: z.string().min(1),
  assignee: z.string().optional().nullable(),
  targetDate: z.string().optional().nullable(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE", "BLOCKED"]).optional(),
  notes: z.string().optional().nullable(),
})

export async function GET(_: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const tasks = await prisma.task.findMany({
    include: { project: { select: { id: true, name: true, client: { select: { name: true } } } } },
    orderBy: [{ status: "asc" }, { targetDate: "asc" }, { createdAt: "desc" }],
  })
  return NextResponse.json(tasks)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { projectId, ...data } = schema.parse(body)
  const task = await prisma.task.create({
    data: {
      ...data,
      projectId,
      targetDate: data.targetDate ? new Date(data.targetDate) : undefined,
    },
    include: { project: { select: { id: true, name: true, client: { select: { name: true } } } } },
  })
  return NextResponse.json(task, { status: 201 })
}
