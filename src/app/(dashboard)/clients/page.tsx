import { prisma } from "@/lib/prisma"
import { ClientsTable } from "@/components/clients/clients-table"

export default async function ClientsPage() {
  const clients = await prisma.client.findMany({
    include: {
      contacts: { where: { isPrimary: true }, take: 1 },
      _count: { select: { contacts: true, projects: true } },
    },
    orderBy: { updatedAt: "desc" },
  })

  return <ClientsTable initialClients={clients} />
}
