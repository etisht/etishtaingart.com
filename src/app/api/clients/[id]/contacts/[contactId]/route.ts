import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const schema = z.object({
  fullName: z.string().min(1).optional(),
  role: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  isPrimary: z.boolean().optional(),
  notes: z.string().optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; contactId: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id: clientId, contactId } = await params
  const body = await req.json()
  const data = schema.parse(body)

  if (data.isPrimary) {
    await prisma.contact.updateMany({
      where: { clientId },
      data: { isPrimary: false },
    })
  }

  const contact = await prisma.contact.update({ where: { id: contactId }, data })
  return NextResponse.json(contact)
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ contactId: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { contactId } = await params
  await prisma.contact.delete({ where: { id: contactId } })
  return NextResponse.json({ success: true })
}
