import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Sidebar } from "@/components/layout/sidebar"
import { Topbar } from "@/components/layout/topbar"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session) redirect("/login")

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Sidebar user={session.user} />
      <div className="mr-60 flex flex-col min-h-screen">
        <Topbar />
        <main className="flex-1 p-6 max-w-[1400px]">{children}</main>
      </div>
    </div>
  )
}
