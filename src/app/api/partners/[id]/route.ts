import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const schema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  notes: z.string().optional(),
})

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const partner = await prisma.partner.findUnique({
    where: { id },
    include: {
      projects: {
        include: {
          project: { include: { client: true, status: true } },
        },
      },
    },
  })
  if (!partner) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(partner)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const body = await req.json()
  const data = schema.parse(body)
  const partner = await prisma.partner.update({ where: { id }, data })
  return NextResponse.json(partner)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  await prisma.partner.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
