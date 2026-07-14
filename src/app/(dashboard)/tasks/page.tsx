import { prisma } from "@/lib/prisma"
import { TasksView } from "@/components/tasks/tasks-view"

export default async function TasksPage() {
  const [tasks, projects] = await Promise.all([
    prisma.task.findMany({
      include: { project: { select: { id: true, name: true, client: { select: { name: true } } } } },
      orderBy: [{ status: "asc" }, { targetDate: "asc" }, { createdAt: "desc" }],
    }),
    prisma.project.findMany({
      select: { id: true, name: true, client: { select: { name: true } } },
      orderBy: { name: "asc" },
    }),
  ])

  return <TasksView initialTasks={tasks} projects={projects} />
}
