import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const schema = z.object({
  name: z.string().min(1),
  type: z.enum(["SPEC", "QUOTE", "CONTRACT", "INVOICE", "DESIGN", "OTHER"]),
  link: z.string().optional().nullable(),
  fileAttachment: z.string().optional().nullable(),
  version: z.string().optional(),
  uploadedBy: z.string().optional(),
  notes: z.string().optional(),
})

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id: projectId } = await params
  const docs = await prisma.document.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(docs)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id: projectId } = await params
  const body = await req.json()
  const data = schema.parse(body)
  const doc = await prisma.document.create({ data: { ...data, projectId } })
  return NextResponse.json(doc, { status: 201 })
}
