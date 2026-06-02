import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ costId: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { costId } = await params
  await prisma.cost.delete({ where: { id: costId } })
  return NextResponse.json({ success: true })
}
