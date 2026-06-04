"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"

const PAGE_LABELS: Record<string, string> = {
  "/":                   "דשבורד",
  "/clients":            "לקוחות",
  "/projects":           "פרויקטים",
  "/partners":           "שותפים",
  "/business-entities":  "ישויות עסקיות",
  "/financials":         "פיננסים",
}

export function Topbar() {
  const pathname = usePathname()

  const segments = pathname.split("/").filter(Boolean)
  const crumbs: { label: string; href: string }[] = [{ label: "דשבורד", href: "/" }]

  let builtPath = ""
  for (const seg of segments) {
    builtPath += `/${seg}`
    const label = PAGE_LABELS[builtPath] ?? seg
    crumbs.push({ label, href: builtPath })
  }

  return (
    <header className="h-14 bg-white/80 backdrop-blur-md flex items-center px-6 gap-2 sticky top-0 z-10"
      style={{ borderBottom: "1px solid oklch(0.88 0.008 240)" }}
    >
      <nav className="flex items-center gap-1 text-sm">
        {crumbs.map((crumb, i) => (
          <span key={crumb.href} className="flex items-center gap-1">
            {i > 0 && <ChevronLeft className="h-3 w-3 text-muted-foreground/50" />}
            {i === crumbs.length - 1 ? (
              <span className="font-semibold text-foreground">{crumb.label}</span>
            ) : (
              <Link href={crumb.href} className="text-muted-foreground hover:text-foreground transition-colors">
                {crumb.label}
              </Link>
            )}
          </span>
        ))}
      </nav>
    </header>
  )
}
