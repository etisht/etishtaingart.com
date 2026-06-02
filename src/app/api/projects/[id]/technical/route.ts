import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const schema = z.object({
  platform: z.string().optional(),
  systemUrl: z.string().optional(),
  hostingUrl: z.string().optional(),
  hostingProvider: z.string().optional(),
  dbUrl: z.string().optional(),
  dbProvider: z.string().optional(),
  gitUrl: z.string().optional(),
  repoName: z.string().optional(),
  productionUrl: z.string().optional(),
  devUrl: z.string().optional(),
  integrationNotes: z.string().optional(),
  technicalNotes: z.string().optional(),
})

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id: projectId } = await params
  const tech = await prisma.technicalLink.findUnique({ where: { projectId } })
  return NextResponse.json(tech)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id: projectId } = await params
  const body = await req.json()
  const data = schema.parse(body)
  const tech = await prisma.technicalLink.upsert({
    where: { projectId },
    update: data,
    create: { ...data, projectId },
  })
  return NextResponse.json(tech)
}
