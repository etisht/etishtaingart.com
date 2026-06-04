import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get("file") as File | null

  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 })

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "קובץ גדול מדי (מקסימום 10MB)" }, { status: 400 })
  }

  const allowed = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "image/png", "image/jpeg", "image/webp",
  ]
  if (!allowed.includes(file.type)) {
    return NextResponse.json({ error: "סוג קובץ לא נתמך" }, { status: 400 })
  }

  // Build safe filename: timestamp + sanitized original name
  const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`

  const uploadDir = join(process.cwd(), "public", "uploads")
  await mkdir(uploadDir, { recursive: true })

  const bytes = await file.arrayBuffer()
  await writeFile(join(uploadDir, safeName), Buffer.from(bytes))

  return NextResponse.json({
    url: `/uploads/${safeName}`,
    name: file.name,
  })
}
