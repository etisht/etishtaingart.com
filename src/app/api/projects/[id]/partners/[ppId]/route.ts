import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ ppId: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { ppId } = await params
  await prisma.projectPartner.delete({ where: { id: ppId } })
  return NextResponse.json({ success: true })
}
