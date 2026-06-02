import { StatusCode } from "@/generated/prisma/client"

export const STATUS_CONFIG: Record<
  StatusCode,
  { label: string; color: string; bgColor: string; order: number }
> = {
  SPEC_BEFORE_QUOTE: {
    label: "אפיון לפני הצעה",
    color: "text-blue-800",
    bgColor: "bg-blue-100 border-blue-200",
    order: 1,
  },
  QUOTE_BEFORE_SPEC: {
    label: "הצעה לפני אפיון",
    color: "text-cyan-800",
    bgColor: "bg-cyan-100 border-cyan-200",
    order: 2,
  },
  QUOTE_SENT: {
    label: "הצעת מחיר",
    color: "text-yellow-800",
    bgColor: "bg-yellow-100 border-yellow-200",
    order: 3,
  },
  NEGOTIATION: {
    label: "משא ומתן",
    color: "text-orange-800",
    bgColor: "bg-orange-100 border-orange-200",
    order: 4,
  },
  DEVELOPMENT: {
    label: "פיתוח",
    color: "text-purple-800",
    bgColor: "bg-purple-100 border-purple-200",
    order: 5,
  },
  DELIVERED_V1: {
    label: "אספקה גרסה 1.0",
    color: "text-white",
    bgColor: "bg-blue-700 border-blue-800",
    order: 6,
  },
  BUG_FIXES: {
    label: "תיקוני באגים",
    color: "text-rose-800",
    bgColor: "bg-rose-100 border-rose-200",
    order: 7,
  },
  SUPPORT: {
    label: "תמיכה",
    color: "text-green-800",
    bgColor: "bg-green-100 border-green-200",
    order: 8,
  },
  QUOTE_REJECTED: {
    label: "הצעה נדחתה",
    color: "text-gray-600",
    bgColor: "bg-gray-100 border-gray-200",
    order: 9,
  },
  ON_HOLD: {
    label: "הוקפא",
    color: "text-white",
    bgColor: "bg-gray-500 border-gray-600",
    order: 10,
  },
  COMPLETED: {
    label: "הסתיים",
    color: "text-white",
    bgColor: "bg-green-700 border-green-800",
    order: 11,
  },
}

export const PRIORITY_CONFIG = {
  LOW:    { label: "נמוכה",  color: "text-slate-500" },
  MEDIUM: { label: "רגילה",  color: "text-blue-600" },
  HIGH:   { label: "גבוהה",  color: "text-orange-600" },
  URGENT: { label: "דחופה",  color: "text-red-600" },
}

export const CLIENT_STATUS_CONFIG = {
  LEAD:     { label: "ליד",       color: "bg-yellow-100 text-yellow-800" },
  ACTIVE:   { label: "פעיל",      color: "bg-green-100 text-green-800" },
  INACTIVE: { label: "לא פעיל",   color: "bg-gray-100 text-gray-600" },
  CHURNED:  { label: "לקוח עבר",  color: "bg-red-100 text-red-800" },
}

export const WORK_TYPE_LABELS: Record<string, string> = {
  SPEC:               "אפיון",
  QUOTE:              "הצעת מחיר",
  DEVELOPMENT:        "פיתוח",
  DESIGN:             "עיצוב",
  QA:                 "QA / בדיקות",
  BUG_FIXES:          "תיקוני באגים",
  CLIENT_MEETING:     "פגישת לקוח",
  PROJECT_MANAGEMENT: "ניהול פרויקט",
  SUPPORT:            "תמיכה",
  INTEGRATIONS:       "אינטגרציות",
  RESEARCH:           "מחקר / בדיקה טכנית",
  CONTENT:            "כתיבת תוכן / מסמכים",
  TRAINING:           "הדרכה ללקוח",
  DEVOPS:             "DevOps / Hosting",
  OTHER:              "אחר",
}

export const PERFORMER_TYPE_LABELS: Record<string, string> = {
  INTERNAL: "פנימי (אתי)",
  PARTNER:  "שותף",
  EXTERNAL: "ספק חיצוני",
}

export const COST_TYPE_LABELS: Record<string, string> = {
  DEVELOPMENT:   "פיתוח",
  DESIGN:        "עיצוב",
  HOSTING:       "אחסון",
  TOOLS:         "כלים",
  LICENSES:      "רישיונות",
  PARTNER:       "שותף",
  SUBCONTRACTOR: "קבלן משנה",
  OTHER:         "אחר",
}

export const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  SPEC:     "אפיון",
  QUOTE:    "הצעת מחיר",
  CONTRACT: "חוזה",
  INVOICE:  "חשבונית",
  DESIGN:   "עיצוב",
  OTHER:    "אחר",
}

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PENDING:   "ממתין",
  REQUESTED: "נשלחה דרישה",
  PARTIAL:   "שולם חלקית",
  PAID:      "שולם",
  OVERDUE:   "באיחור",
  CANCELLED: "בוטל",
}

export const AGREEMENT_TYPE_LABELS: Record<string, string> = {
  PERCENTAGE:   "אחוז מהחוזה",
  PROFIT_SHARE: "אחוז מהרווח",
  FIXED:        "סכום קבוע",
}

export const TASK_STATUS_LABELS: Record<string, string> = {
  TODO:        "פתוח",
  IN_PROGRESS: "בביצוע",
  DONE:        "הושלם",
  BLOCKED:     "חסום",
}

export const NOTE_TYPE_LABELS: Record<string, string> = {
  general:       "כללי",
  meeting:       "סיכום פגישה",
  call:          "שיחה עם לקוח",
  decision:      "החלטה",
  price_change:  "שינוי מחיר",
  status_change: "שינוי סטטוס",
  risk:          "סיכון",
  client_request:"בקשת לקוח",
  payment:       "תיעוד תשלום",
}

export const CLIENT_TYPE_OPTIONS = [
  "חברה",
  "סטארטאפ",
  "עמותה",
  "מפעל",
  "עצמאי",
  "לקוח פרטי",
  "מוסד ממשלתי",
  "אחר",
]

export const INDUSTRY_OPTIONS = [
  "טכנולוגיה",
  "בריאות",
  "חינוך",
  "פיננסים",
  "נדל\"ן",
  "מסחר",
  "תעשייה",
  "עמותות",
  "AI",
  "מדיה",
  "אחר",
]

export const SOURCE_OPTIONS = [
  "לינקדאין",
  "היכרות אישית",
  "המלצה",
  "פגישה",
  "אתר אינטרנט",
  "קמפיין",
  "אחר",
]

export const PROJECT_TYPE_OPTIONS = [
  "מערכת CRM",
  "אוטומציה",
  "דשבורד",
  "AI",
  "אפיון",
  "ייעוץ",
  "אתר אינטרנט",
  "אפליקציה",
  "אינטגרציה",
  "אחר",
]

export const PLATFORM_OPTIONS = [
  "Base44",
  "React",
  "Next.js",
  "Firebase",
  "Bubble",
  "Lovable",
  "WordPress",
  "Canva",
  "Supabase",
  "אחר",
]

export const CURRENCY_OPTIONS = ["ILS", "USD", "EUR"]

export const CURRENCY_SYMBOLS: Record<string, string> = {
  ILS: "₪",
  USD: "$",
  EUR: "€",
}
