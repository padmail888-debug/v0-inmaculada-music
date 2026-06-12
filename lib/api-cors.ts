import { NextResponse } from "next/server"

/** CORS for Capacitor WebView (`http://localhost`) → Next API on another port. */
export const API_CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, HEAD, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type, Accept, Cache-Control, Pragma",
  "Access-Control-Max-Age": "86400",
}

/** Respond to browser preflight before route handlers (which may 500 on OPTIONS). */
export function handleApiCorsPreflight(): NextResponse {
  return new NextResponse(null, { status: 204, headers: API_CORS_HEADERS })
}

export function withApiCorsHeaders(response: NextResponse): NextResponse {
  for (const [key, value] of Object.entries(API_CORS_HEADERS)) {
    response.headers.set(key, value)
  }
  return response
}
