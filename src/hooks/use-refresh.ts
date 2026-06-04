"use client"

import { useRouter } from "next/navigation"
import { useCallback } from "react"

export function useRefresh() {
  const router = useRouter()
  return useCallback(() => {
    router.refresh()
  }, [router])
}
