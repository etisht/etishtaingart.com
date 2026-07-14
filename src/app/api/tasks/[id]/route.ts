import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const patchSchema = z.object({
  name: z.string().min(1).optional(),
  assignee: z.string().optional().nullable(),
  targetDate: z.string().optional().nullable(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE", "BLOCKED"]).optional(),
  notes: z.string().optional().nullable(),
})

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const data = patchSchema.parse(body)

  const task = await prisma.task.update({
    where: { id },
    data: {
      ...data,
      targetDate: data.targetDate !== undefined
        ? (data.targetDate ? new Date(data.targetDate) : null)
        : undefined,
    },
    include: { project: { select: { id: true, name: true, client: { select: { name: true } } } } },
  })
  return NextResponse.json(task)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  await prisma.task.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
