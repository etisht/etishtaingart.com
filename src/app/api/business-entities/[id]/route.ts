import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const schema = z.object({
  name: z.string().min(1).optional(),
  type: z.string().optional(),
  taxId: z.string().optional(),
  address: z.string().optional(),
  email: z.string().optional(),
  notes: z.string().optional(),
  isActive: z.boolean().optional(),
})

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const entity = await prisma.businessEntity.findUnique({ where: { id } })
  if (!entity) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(entity)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const body = await req.json()
  const data = schema.parse(body)
  const entity = await prisma.businessEntity.update({ where: { id }, data })
  return NextResponse.json(entity)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  await prisma.businessEntity.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
