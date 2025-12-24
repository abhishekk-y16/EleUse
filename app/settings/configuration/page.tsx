"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function ConfigurationPage() {
  const router = useRouter()
  useEffect(() => {
    // Redirect to home — page removed
    router.replace("/")
  }, [router])
  return null
}
