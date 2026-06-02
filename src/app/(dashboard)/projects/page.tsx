import { prisma } from "@/lib/prisma"
import { ProjectsView } from "@/components/projects/projects-view"

export default async function ProjectsPage() {
  const [projects, statuses, businessEntities] = await Promise.all([
    prisma.project.findMany({
      include: {
        client: true,
        businessEntity: true,
        status: true,
        primaryContact: true,
        _count: { select: { milestones: true, tasks: true } },
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.projectStatus.findMany({ orderBy: { order: "asc" } }),
    prisma.businessEntity.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
  ])

  return <ProjectsView initialProjects={projects} statuses={statuses} businessEntities={businessEntities} />
}
