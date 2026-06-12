import { NextResponse } from "next/server"
import { handleApiCorsPreflight, withApiCorsHeaders } from "@/lib/api-cors"

export function OPTIONS() {
  return handleApiCorsPreflight()
}

/** Lightweight probe for native app API base discovery (Capacitor). */
export async function GET() {
  return withApiCorsHeaders(NextResponse.json({ ok: true }))
}
