import { toDecimal } from "./utils"

interface PaymentLike {
  status: string
  amount: number | string | null | undefined
}
interface CostLike {
  isPaid: boolean
  amount: number | string | null | undefined
  costType: string
  billingType?: string | null
}
interface WorkLogLike {
  totalHours: number | string | null | undefined
  performerType: string
  calculatedCost?: number | string | null | undefined
  supplierPaymentStatus?: string | null
}

export interface ProjectFinancials {
  totalContractValue: number
  totalPaid: number
  balance: number
  totalDevCosts: number
  totalPartnerCosts: number
  totalOtherCosts: number
  totalCosts: number
  paidCosts: number
  expectedProfit: number
  actualProfit: number
  profitMargin: number
  totalHours: number
  internalHours: number
  partnerHours: number
  externalHours: number
  externalCosts: number
  effectiveHourlyRate: number
  oneTimeCosts: number
  annualUsageCosts: number
  salePrice: number
}

export function calculateProjectFinancials(
  totalContractValue: number | string | null | undefined,
  payments: PaymentLike[],
  costs: CostLike[],
  worklogs: WorkLogLike[]
): ProjectFinancials {
  const contractValue = toDecimal(totalContractValue)

  const totalPaid = payments
    .filter((p) => p.status === "PAID")
    .reduce((sum, p) => sum + toDecimal(p.amount), 0)

  const totalDevCosts = costs
    .filter((c) => c.costType === "DEVELOPMENT")
    .reduce((sum, c) => sum + toDecimal(c.amount), 0)

  const totalPartnerCosts = costs
    .filter((c) => c.costType === "PARTNER" || c.costType === "SUBCONTRACTOR")
    .reduce((sum, c) => sum + toDecimal(c.amount), 0)

  const totalOtherCosts = costs
    .filter((c) => !["DEVELOPMENT", "PARTNER", "SUBCONTRACTOR"].includes(c.costType))
    .reduce((sum, c) => sum + toDecimal(c.amount), 0)

  const totalCosts = costs.reduce((sum, c) => sum + toDecimal(c.amount), 0)

  const paidCosts = costs
    .filter((c) => c.isPaid)
    .reduce((sum, c) => sum + toDecimal(c.amount), 0)

  // Annual value: one-time + recurring costs
  const oneTimeCosts = costs
    .filter((c) => !c.billingType || c.billingType === "ONE_TIME")
    .reduce((sum, c) => sum + toDecimal(c.amount), 0)

  const annualUsageCosts =
    costs
      .filter((c) => c.billingType === "MONTHLY")
      .reduce((sum, c) => sum + toDecimal(c.amount) * 12, 0) +
    costs
      .filter((c) => c.billingType === "YEARLY")
      .reduce((sum, c) => sum + toDecimal(c.amount), 0)

  const salePrice = oneTimeCosts + annualUsageCosts

  // Balance: use salePrice when available, otherwise fall back to contractValue
  const baseValue = salePrice > 0 ? salePrice : contractValue
  const balance = baseValue - totalPaid

  // expectedProfit uses salePrice (annualized costs: one-time + monthly×12 + yearly)
  const annualizedCosts = salePrice > 0 ? salePrice : totalCosts
  const expectedProfit = contractValue - annualizedCosts
  const actualProfit = totalPaid - paidCosts
  const profitMargin = contractValue > 0 ? (expectedProfit / contractValue) * 100 : 0

  const totalHours = worklogs.reduce((sum, w) => sum + toDecimal(w.totalHours), 0)
  const internalHours = worklogs
    .filter((w) => w.performerType === "INTERNAL")
    .reduce((sum, w) => sum + toDecimal(w.totalHours), 0)
  const partnerHours = worklogs
    .filter((w) => w.performerType === "PARTNER")
    .reduce((sum, w) => sum + toDecimal(w.totalHours), 0)
  const externalHours = worklogs
    .filter((w) => w.performerType === "EXTERNAL")
    .reduce((sum, w) => sum + toDecimal(w.totalHours), 0)
  const externalCosts = worklogs
    .filter((w) => w.performerType === "EXTERNAL")
    .reduce((sum, w) => sum + toDecimal(w.calculatedCost), 0)

  const effectiveHourlyRate = totalHours > 0 ? contractValue / totalHours : 0

  return {
    totalContractValue: contractValue,
    totalPaid,
    balance,
    totalDevCosts,
    totalPartnerCosts,
    totalOtherCosts,
    totalCosts,
    paidCosts,
    expectedProfit,
    actualProfit,
    profitMargin,
    totalHours,
    internalHours,
    partnerHours,
    externalHours,
    externalCosts,
    effectiveHourlyRate,
    oneTimeCosts,
    annualUsageCosts,
    salePrice,
  }
}
