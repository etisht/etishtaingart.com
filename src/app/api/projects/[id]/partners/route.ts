import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const schema = z.object({
  partnerId: z.string().min(1),
  role: z.string().optional(),
  agreementType: z.enum(["PERCENTAGE", "PROFIT_SHARE", "FIXED"]).optional(),
  contractPercentage: z.number().optional().nullable(),
  profitPercentage: z.number().optional().nullable(),
  fixedAmount: z.number().optional().nullable(),
  notes: z.string().optional(),
  agreementLink: z.string().optional(),
})

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id: projectId } = await params
  const partners = await prisma.projectPartner.findMany({
    where: { projectId },
    include: { partner: true },
  })
  return NextResponse.json(partners)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id: projectId } = await params
  const body = await req.json()
  const data = schema.parse(body)
  const pp = await prisma.projectPartner.create({
    data: { ...data, projectId },
    include: { partner: true },
  })
  return NextResponse.json(pp, { status: 201 })
}
