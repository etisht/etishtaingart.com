import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const schema = z.object({
  name: z.string().min(1).optional(),
  type: z.enum(["SPEC", "QUOTE", "CONTRACT", "INVOICE", "DESIGN", "OTHER"]).optional(),
  link: z.string().optional().nullable(),
  fileAttachment: z.string().optional().nullable(),
  version: z.string().optional(),
  notes: z.string().optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ docId: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { docId } = await params
  const body = await req.json()
  const data = schema.parse(body)
  const doc = await prisma.document.update({ where: { id: docId }, data })
  return NextResponse.json(doc)
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ docId: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { docId } = await params
  await prisma.document.delete({ where: { id: docId } })
  return NextResponse.json({ success: true })
}
