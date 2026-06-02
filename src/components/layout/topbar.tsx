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

  const dedupedCrumbs =
    crumbs.length === 1 && crumbs[0].href === "/"
      ? crumbs
      : crumbs.slice(0, -1).concat(crumbs.slice(-1))

  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center px-6 gap-2">
      <nav className="flex items-center gap-1 text-sm">
        {crumbs.map((crumb, i) => (
          <span key={crumb.href} className="flex items-center gap-1">
            {i > 0 && <ChevronLeft className="h-3 w-3 text-slate-400" />}
            {i === crumbs.length - 1 ? (
              <span className="font-semibold text-slate-800">{crumb.label}</span>
            ) : (
              <Link href={crumb.href} className="text-slate-500 hover:text-slate-800 transition-colors">
                {crumb.label}
              </Link>
            )}
          </span>
        ))}
      </nav>
    </header>
  )
}
