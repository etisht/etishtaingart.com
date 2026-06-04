import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const schema = z.object({
  role: z.string().optional(),
  agreementType: z.enum(["PERCENTAGE", "PROFIT_SHARE", "FIXED"]).optional(),
  contractPercentage: z.number().optional().nullable(),
  profitPercentage: z.number().optional().nullable(),
  fixedAmount: z.number().optional().nullable(),
  notes: z.string().optional(),
  agreementLink: z.string().optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ ppId: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { ppId } = await params
  const body = await req.json()
  const data = schema.parse(body)
  const updated = await prisma.projectPartner.update({
    where: { id: ppId },
    data,
    include: { partner: true },
  })
  return NextResponse.json(updated)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ ppId: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { ppId } = await params
  await prisma.projectPartner.delete({ where: { id: ppId } })
  return NextResponse.json({ success: true })
}
