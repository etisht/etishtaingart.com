import { NextRequest, NextResponse } from "next/server"
import { auth, getSessionUserId } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const schema = z.object({
  noteType: z.string().optional(),
  content: z.string().min(1),
})

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id: projectId } = await params
  const notes = await prisma.note.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(notes)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getSessionUserId()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { id: projectId } = await params
    const body = await req.json()
    const data = schema.parse(body)
    const note = await prisma.note.create({
      data: {
        ...data,
        entityType: "PROJECT",
        entityId: projectId,
        createdBy: userId,
        projectId,
      },
    })
    return NextResponse.json(note, { status: 201 })
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
