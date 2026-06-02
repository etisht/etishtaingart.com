import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ paymentId: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { paymentId } = await params
  await prisma.payment.delete({ where: { id: paymentId } })
  return NextResponse.json({ success: true })
}
