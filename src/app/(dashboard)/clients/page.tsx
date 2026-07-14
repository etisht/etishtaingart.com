import { prisma } from "@/lib/prisma"
import { ClientsTable } from "@/components/clients/clients-table"

export default async function ClientsPage() {
  const [clients, businessEntities] = await Promise.all([
    prisma.client.findMany({
      include: {
        contacts: { where: { isPrimary: true }, take: 1 },
        _count: { select: { contacts: true, projects: true } },
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.businessEntity.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ])

  return <ClientsTable initialClients={clients} businessEntities={businessEntities} />
}
