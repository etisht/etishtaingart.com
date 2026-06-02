import { prisma } from "@/lib/prisma"
import { BusinessEntitiesClient } from "./client"

export default async function BusinessEntitiesPage() {
  const entities = await prisma.businessEntity.findMany({ orderBy: { name: "asc" } })
  return <BusinessEntitiesClient entities={entities} />
}
