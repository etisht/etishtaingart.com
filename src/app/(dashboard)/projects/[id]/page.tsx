import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StatusSelect } from "@/components/projects/status-select"
import { PRIORITY_CONFIG } from "@/lib/constants"
import { formatDate, formatCurrency } from "@/lib/utils"
import { TabGeneral } from "@/components/projects/tabs/tab-general"
import { TabMilestones } from "@/components/projects/tabs/tab-milestones"
import { TabPayments } from "@/components/projects/tabs/tab-payments"
import { TabCosts } from "@/components/projects/tabs/tab-costs"
import { TabPartners } from "@/components/projects/tabs/tab-partners"
import { TabDocuments } from "@/components/projects/tabs/tab-documents"
import { TabTechnical } from "@/components/projects/tabs/tab-technical"
import { TabTimeTrackingLazy } from "@/components/projects/tabs/tab-time-tracking-lazy"
import { TabNotesLazy } from "@/components/projects/tabs/tab-notes-lazy"
import { calculateProjectFinancials } from "@/lib/calculations"

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const [project, allPartners, allStatuses] = await Promise.all([
    prisma.project.findUnique({
      where: { id },
      include: {
        client: { include: { contacts: true } },
        businessEntity: true,
        status: true,
        primaryContact: true,
        milestones: { orderBy: { targetDate: "asc" } },
        payments: { include: { milestone: true }, orderBy: { createdAt: "desc" } },
        costs: { orderBy: { date: "desc" } },
        partners: { include: { partner: true } },
        documents: { orderBy: { createdAt: "desc" } },
        technicalLink: true,
        tasks: { orderBy: { targetDate: "asc" } },
        // worklogs, projectNotes, activities loaded lazily per tab
      },
    }),
    prisma.partner.findMany({ orderBy: { name: "asc" } }),
    prisma.projectStatus.findMany({ orderBy: { order: "asc" } }),
  ])

  if (!project) notFound()

  // Financials without worklogs (worklogs loaded lazily in the time tab)
  const financials = calculateProjectFinancials(
    project.totalContractValue ? Number(project.totalContractValue) : null,
    project.payments as never[],
    project.costs as never[],
    []
  )

  const priority = PRIORITY_CONFIG[project.priority]

  return (
    <div className="space-y-4 max-w-6xl">
      {/* Project Header */}
      <div className="bg-white rounded-xl border border-border/60 p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold">{project.name}</h1>
              <StatusSelect
                projectId={project.id}
                currentStatusId={project.statusId}
                currentCode={project.status.code}
                statuses={allStatuses}
              />
              <span className={`text-xs font-semibold ${priority.color}`}>{priority.label}</span>
            </div>
            <div className="flex gap-4 mt-2 text-sm text-muted-foreground flex-wrap">
              <span>{project.client.name}</span>
              <span>·</span>
              <span>{project.businessEntity.name}</span>
              {project.type && <><span>·</span><span>{project.type}</span></>}
              {project.platform && <><span>·</span><span>{project.platform}</span></>}
            </div>
          </div>
          <div className="shrink-0 text-left space-y-1">
            {project.totalContractValue && (
              <p className="text-lg font-bold">
                {formatCurrency(Number(project.totalContractValue), project.currency)}
              </p>
            )}
            {project.targetDate && (
              <p className="text-xs text-muted-foreground">יעד: {formatDate(project.targetDate)}</p>
            )}
          </div>
        </div>

        {/* Financial quick summary */}
        {(financials.totalContractValue > 0 || financials.salePrice > 0) && (
          <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-slate-100">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">שולם</p>
              <p className="font-semibold text-green-600">{formatCurrency(financials.totalPaid, project.currency)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">יתרה לגבייה</p>
              <p className="font-semibold text-orange-600">{formatCurrency(financials.balance, project.currency)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">רווח צפוי</p>
              <p className={`font-semibold ${financials.expectedProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                {formatCurrency(financials.expectedProfit, project.currency)}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="general" dir="rtl">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="general">כללי</TabsTrigger>
          <TabsTrigger value="milestones">מיילסטונים</TabsTrigger>
          <TabsTrigger value="payments">תשלומים</TabsTrigger>
          <TabsTrigger value="costs">עלויות</TabsTrigger>
          <TabsTrigger value="partners">שותפים</TabsTrigger>
          <TabsTrigger value="documents">מסמכים</TabsTrigger>
          <TabsTrigger value="technical">מידע טכני</TabsTrigger>
          <TabsTrigger value="time">שעות עבודה</TabsTrigger>
          <TabsTrigger value="notes">הערות</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-4">
          <TabGeneral project={project} />
        </TabsContent>
        <TabsContent value="milestones" className="mt-4">
          <TabMilestones projectId={project.id} milestones={project.milestones} financials={financials} currency={project.currency} />
        </TabsContent>
        <TabsContent value="payments" className="mt-4">
          <TabPayments projectId={project.id} payments={project.payments} milestones={project.milestones} financials={financials} currency={project.currency} />
        </TabsContent>
        <TabsContent value="costs" className="mt-4">
          <TabCosts projectId={project.id} costs={project.costs} financials={financials} currency={project.currency} />
        </TabsContent>
        <TabsContent value="partners" className="mt-4">
          <TabPartners projectId={project.id} projectPartners={project.partners} allPartners={allPartners} currency={project.currency} />
        </TabsContent>
        <TabsContent value="documents" className="mt-4">
          <TabDocuments projectId={project.id} documents={project.documents} />
        </TabsContent>
        <TabsContent value="technical" className="mt-4">
          <TabTechnical projectId={project.id} technicalLink={project.technicalLink} />
        </TabsContent>
        <TabsContent value="time" className="mt-4">
          <TabTimeTrackingLazy projectId={project.id} currency={project.currency} />
        </TabsContent>
        <TabsContent value="notes" className="mt-4">
          <TabNotesLazy projectId={project.id} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
