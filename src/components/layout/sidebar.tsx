"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Building2,
  FolderKanban,
  Users,
  Briefcase,
  TrendingUp,
  LogOut,
  CheckSquare,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getInitials } from "@/lib/utils"

const navItems = [
  { href: "/",                   label: "דשבורד",        icon: LayoutDashboard },
  { href: "/clients",            label: "לקוחות",         icon: Building2 },
  { href: "/projects",           label: "פרויקטים",       icon: FolderKanban },
  { href: "/partners",           label: "שותפים",         icon: Users },
  { href: "/business-entities",  label: "ישויות עסקיות",  icon: Briefcase },
  { href: "/financials",         label: "פיננסים",        icon: TrendingUp },
  { href: "/tasks",              label: "משימות",         icon: CheckSquare },
]

interface SidebarProps {
  user?: { name?: string | null; email?: string | null; image?: string | null }
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="fixed inset-y-0 right-0 w-60 flex flex-col z-40"
      style={{
        background: "linear-gradient(180deg, oklch(0.18 0.04 260) 0%, oklch(0.13 0.03 250) 100%)",
        borderLeft: "1px solid oklch(1 0 0 / 0.06)",
      }}
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-5 gap-3" style={{ borderBottom: "1px solid oklch(1 0 0 / 0.08)" }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0"
          style={{ background: "linear-gradient(135deg, oklch(0.6 0.245 262), oklch(0.5 0.22 280))" }}
        >
          M
        </div>
        <div>
          <p className="font-bold text-white text-sm leading-tight">Eti Shtaingart CRM</p>
          <p className="text-xs" style={{ color: "oklch(1 0 0 / 0.4)" }}>ניהול עסקי</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                isActive
                  ? "text-white"
                  : "text-white/55 hover:text-white/90 hover:bg-white/6"
              )}
              style={isActive ? {
                background: "linear-gradient(90deg, oklch(0.546 0.245 262 / 0.9), oklch(0.5 0.22 280 / 0.7))",
                boxShadow: "0 1px 8px oklch(0.546 0.245 262 / 0.35)",
              } : undefined}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div className="p-4 space-y-3" style={{ borderTop: "1px solid oklch(1 0 0 / 0.08)" }}>
        {user && (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarImage src={user.image ?? undefined} />
              <AvatarFallback className="text-xs font-semibold text-white"
                style={{ background: "linear-gradient(135deg, oklch(0.6 0.245 262), oklch(0.5 0.22 280))" }}
              >
                {getInitials(user.name ?? user.email ?? "U")}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-white/90 truncate">{user.name}</p>
              <p className="text-xs truncate" style={{ color: "oklch(1 0 0 / 0.4)" }}>{user.email}</p>
            </div>
          </div>
        )}
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors text-white/45 hover:text-white/80 hover:bg-white/6"
        >
          <LogOut className="h-3.5 w-3.5" />
          התנתקות
        </button>
      </div>
    </aside>
  )
}
