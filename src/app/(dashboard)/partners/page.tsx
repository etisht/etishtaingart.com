import { prisma } from "@/lib/prisma"
import { PartnersClient } from "./client"

export default async function PartnersPage() {
  const partners = await prisma.partner.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { projects: true } } },
  })
  return <PartnersClient partners={partners} />
}
