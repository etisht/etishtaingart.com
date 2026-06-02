import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const schema = z.object({
  name: z.string().min(1),
  type: z.string().optional(),
  industry: z.string().optional(),
  website: z.string().optional(),
  businessEntityId: z.string().optional(),
  status: z.enum(["LEAD", "ACTIVE", "INACTIVE", "CHURNED"]).optional(),
  source: z.string().optional(),
  notes: z.string().optional(),
})

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get("status") as "LEAD" | "ACTIVE" | "INACTIVE" | "CHURNED" | null
  const search = searchParams.get("search")

  const clients = await prisma.client.findMany({
    where: {
      ...(status && { status }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { industry: { contains: search, mode: "insensitive" } },
        ],
      }),
    },
    include: {
      _count: { select: { contacts: true, projects: true } },
      contacts: { where: { isPrimary: true }, take: 1 },
    },
    orderBy: { updatedAt: "desc" },
  })
  return NextResponse.json(clients)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const data = schema.parse(body)
  const client = await prisma.client.create({ data })
  return NextResponse.json(client, { status: 201 })
}
