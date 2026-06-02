import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const schema = z.object({
  fullName: z.string().min(1),
  role: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  isPrimary: z.boolean().optional(),
  notes: z.string().optional(),
})

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id: clientId } = await params
  const body = await req.json()
  const data = schema.parse(body)

  if (data.isPrimary) {
    await prisma.contact.updateMany({
      where: { clientId },
      data: { isPrimary: false },
    })
  }

  const contact = await prisma.contact.create({ data: { ...data, clientId } })
  return NextResponse.json(contact, { status: 201 })
}
