import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"

const ALLOWED_EMAILS = (process.env.ALLOWED_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim())
  .filter(Boolean)

export async function getSessionUserId(): Promise<string | null> {
  // 1. Try the standard session (works in Server Components)
  const session = await auth()
  if (!session) return null

  const id = (session.user as { id?: string } | undefined)?.id
  if (id) return id

  const email = session.user?.email
  if (email) {
    const user = await prisma.user.findUnique({ where: { email }, select: { id: true } })
    if (user?.id) return user.id
  }

  // 2. Fallback: read session token from cookies and look up DB directly
  // (NextAuth v5 beta doesn't always populate session.user in route handlers)
  try {
    const { cookies } = await import("next/headers")
    const cookieStore = await cookies()
    const token =
      cookieStore.get("next-auth.session-token")?.value ??
      cookieStore.get("__Secure-next-auth.session-token")?.value
    if (token) {
      const dbSession = await prisma.session.findUnique({
        where: { sessionToken: token },
        select: { userId: true },
      })
      if (dbSession?.userId) return dbSession.userId
    }
  } catch {
    // cookies() unavailable outside request context — ignore
  }

  return null
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false
      if (ALLOWED_EMAILS.length === 0) return true // dev mode: allow all
      return ALLOWED_EMAILS.includes(user.email)
    },
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id
        const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
        ;(session.user as typeof session.user & { role: string }).role =
          dbUser?.role ?? "VIEWER"
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
})
