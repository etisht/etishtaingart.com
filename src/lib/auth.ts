import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"

const ALLOWED_EMAILS = (process.env.ALLOWED_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim())
  .filter(Boolean)

export async function getSessionUserId(): Promise<string | null> {
  const session = await auth()
  if (!session) return null
  const id = (session.user as { id?: string } | undefined)?.id
  if (id) return id
  const email = session.user?.email
  if (!email) return null
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } })
  return user?.id ?? null
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
