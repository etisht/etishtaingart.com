import { PrismaClient, StatusCode } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const STATUS_CONFIG: Record<StatusCode, { label: string; color: string; order: number }> = {
  SPEC_BEFORE_QUOTE: { label: "אפיון לפני הצעה",   color: "bg-blue-200 text-blue-800",    order: 1 },
  QUOTE_BEFORE_SPEC: { label: "הצעה לפני אפיון",   color: "bg-cyan-200 text-cyan-800",    order: 2 },
  QUOTE_SENT:        { label: "הצעת מחיר",          color: "bg-yellow-200 text-yellow-800", order: 3 },
  NEGOTIATION:       { label: "משא ומתן",            color: "bg-orange-200 text-orange-800", order: 4 },
  DEVELOPMENT:       { label: "פיתוח",               color: "bg-purple-200 text-purple-800", order: 5 },
  DELIVERED_V1:      { label: "אספקה גרסה 1.0",     color: "bg-blue-700 text-white",        order: 6 },
  BUG_FIXES:         { label: "תיקוני באגים",        color: "bg-rose-200 text-rose-800",    order: 7 },
  SUPPORT:           { label: "תמיכה",               color: "bg-green-200 text-green-800",  order: 8 },
  QUOTE_REJECTED:    { label: "הצעה נדחתה",          color: "bg-gray-200 text-gray-600",    order: 9 },
  ON_HOLD:           { label: "הוקפא",               color: "bg-gray-500 text-white",        order: 10 },
  COMPLETED:         { label: "הסתיים",              color: "bg-green-700 text-white",       order: 11 },
}

async function main() {
  console.log("Seeding database...")

  // Seed all project statuses
  for (const [code, config] of Object.entries(STATUS_CONFIG)) {
    await prisma.projectStatus.upsert({
      where: { code: code as StatusCode },
      update: { label: config.label, color: config.color, order: config.order },
      create: { code: code as StatusCode, label: config.label, color: config.color, order: config.order },
    })
  }
  console.log("✓ ProjectStatus rows seeded (11 statuses)")

  // Seed admin user
  await prisma.user.upsert({
    where: { email: "etishtaingart@gmail.com" },
    update: {},
    create: {
      email: "etishtaingart@gmail.com",
      name: "אתי שטיינגרט",
      role: "ADMIN",
    },
  })
  console.log("✓ Admin user seeded")

  // Seed default business entities
  const mindora = await prisma.businessEntity.upsert({
    where: { id: "be_mindora" },
    update: {},
    create: {
      id: "be_mindora",
      name: "Mindora",
      type: "company",
      isActive: true,
    },
  })

  const freelance = await prisma.businessEntity.upsert({
    where: { id: "be_freelance" },
    update: {},
    create: {
      id: "be_freelance",
      name: "אתי שטיינגרט — עוסק פרטי",
      type: "freelance",
      isActive: true,
    },
  })

  console.log(`✓ Business entities seeded (${mindora.name}, ${freelance.name})`)
  console.log("Seeding complete!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
