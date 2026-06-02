import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ docId: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { docId } = await params
  await prisma.document.delete({ where: { id: docId } })
  return NextResponse.json({ success: true })
}
