import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"

const ALLOWED_EMAILS = (process.env.ALLOWED_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim())
  .filter(Boolean)

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
