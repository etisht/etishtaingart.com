import type {
  BusinessEntity,
  Client,
  Contact,
  Project,
  ProjectStatus,
  Milestone,
  Payment,
  Cost,
  Partner,
  ProjectPartner,
  Document,
  TechnicalLink,
  WorkLog,
  Note,
  ActivityLog,
  Task,
  User,
} from "@/generated/prisma/client"

export type {
  BusinessEntity,
  Client,
  Contact,
  Project,
  ProjectStatus,
  Milestone,
  Payment,
  Cost,
  Partner,
  ProjectPartner,
  Document,
  TechnicalLink,
  WorkLog,
  Note,
  ActivityLog,
  Task,
  User,
}

export type ProjectWithRelations = Project & {
  client: Client
  businessEntity: BusinessEntity
  status: ProjectStatus
  primaryContact?: Contact | null
  milestones?: Milestone[]
  payments?: Payment[]
  costs?: Cost[]
  partners?: (ProjectPartner & { partner: Partner })[]
  documents?: Document[]
  technicalLink?: TechnicalLink | null
  worklogs?: WorkLog[]
  tasks?: Task[]
  projectNotes?: Note[]
  activities?: ActivityLog[]
  _count?: {
    milestones: number
    payments: number
    tasks: number
  }
}

export type ClientWithRelations = Client & {
  contacts?: Contact[]
  projects?: ProjectWithRelations[]
  _count?: {
    contacts: number
    projects: number
  }
}

export type PartnerWithRelations = Partner & {
  projects?: (ProjectPartner & { project: ProjectWithRelations })[]
  _count?: {
    projects: number
  }
}
