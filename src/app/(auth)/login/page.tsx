"use client"

import { signIn } from "next-auth/react"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"

function LoginContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get("error")

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, oklch(0.18 0.04 260) 0%, oklch(0.13 0.03 250) 55%, oklch(0.16 0.05 280) 100%)",
      }}
    >
      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-40 -right-40 w-80 h-80 rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, oklch(0.6 0.245 262), transparent)" }}
        />
        <div
          className="absolute -bottom-40 -left-20 w-96 h-96 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, oklch(0.5 0.22 280), transparent)" }}
        />
      </div>

      <div className="relative w-full max-w-sm mx-4">
        <div
          className="rounded-2xl p-8 space-y-7"
          style={{
            background: "oklch(1 0 0 / 0.05)",
            backdropFilter: "blur(24px)",
            border: "1px solid oklch(1 0 0 / 0.12)",
            boxShadow: "0 25px 50px oklch(0 0 0 / 0.5), inset 0 1px 0 oklch(1 0 0 / 0.1)",
          }}
        >
          {/* Logo */}
          <div className="text-center space-y-3">
            <div
              className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center text-white font-bold text-2xl"
              style={{
                background: "linear-gradient(135deg, oklch(0.6 0.245 262), oklch(0.5 0.22 280))",
                boxShadow: "0 8px 24px oklch(0.546 0.245 262 / 0.4)",
              }}
            >
              M
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Eti Shtaingart CRM</h1>
              <p className="text-sm mt-0.5" style={{ color: "oklch(1 0 0 / 0.5)" }}>
                מערכת ניהול עסקית
              </p>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div
              className="rounded-xl px-4 py-3 text-sm text-center"
              style={{
                background: "oklch(0.577 0.245 27 / 0.15)",
                border: "1px solid oklch(0.577 0.245 27 / 0.3)",
                color: "oklch(0.85 0.12 27)",
              }}
            >
              {error === "AccessDenied"
                ? "אין לך הרשאה להיכנס למערכת"
                : "אירעה שגיאה. נסי שוב."}
            </div>
          )}

          {/* Google Button */}
          <button
            onClick={() => signIn("google", { callbackUrl: "/" })}
            className="w-full flex items-center justify-center gap-3 h-12 rounded-xl font-medium text-sm transition-all duration-150 cursor-pointer"
            style={{
              background: "oklch(1 0 0)",
              color: "oklch(0.2 0 0)",
              boxShadow: "0 2px 8px oklch(0 0 0 / 0.3)",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-1px)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            המשך עם Google
          </button>

          <p className="text-xs text-center" style={{ color: "oklch(1 0 0 / 0.3)" }}>
            גישה מוגבלת למשתמשים מורשים בלבד
          </p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  )
}
