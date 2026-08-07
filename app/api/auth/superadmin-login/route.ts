import { createHash, timingSafeEqual } from "node:crypto"
import { NextResponse } from "next/server"
import { handleApiCorsPreflight, withApiCorsHeaders } from "@/lib/api-cors"
import { getSupabaseServer } from "@/lib/supabase/server"

export const runtime = "nodejs"

export function OPTIONS() {
  return handleApiCorsPreflight()
}

function digest(value: string): Buffer {
  return createHash("sha256").update(value, "utf8").digest()
}

function safeEqualString(a: string, b: string): boolean {
  const left = digest(a)
  const right = digest(b)
  return timingSafeEqual(left, right)
}

async function findUserByEmail(email: string) {
  const supabase = getSupabaseServer()
  const normalized = email.trim().toLowerCase()
  // Paginate a bit — projects are usually small; enough for admin lookup.
  for (let page = 1; page <= 10; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 })
    if (error) throw new Error(error.message)
    const match = data.users.find((u) => (u.email || "").toLowerCase() === normalized)
    if (match) return match
    if (data.users.length < 200) break
  }
  return null
}

/**
 * Hardcoded Super Admin login gate.
 * Only SUPER_ADMIN_EMAIL + SUPER_ADMIN_PASSWORD from env are accepted.
 * Does not promote artist/paid users — wrong credentials always fail.
 */
export async function POST(request: Request) {
  try {
    const expectedEmail = (process.env.SUPER_ADMIN_EMAIL || "").trim()
    const expectedPassword = process.env.SUPER_ADMIN_PASSWORD || ""

    if (!expectedEmail || !expectedPassword) {
      return withApiCorsHeaders(
        NextResponse.json(
          {
            error:
              "Super Admin no está configurado en el servidor (SUPER_ADMIN_EMAIL / SUPER_ADMIN_PASSWORD).",
          },
          { status: 503 },
        ),
      )
    }

    const body = (await request.json().catch(() => null)) as {
      email?: string
      password?: string
    } | null

    const email = String(body?.email || "").trim()
    const password = String(body?.password || "")

    const emailOk = safeEqualString(email.toLowerCase(), expectedEmail.toLowerCase())
    const passwordOk = safeEqualString(password, expectedPassword)

    if (!emailOk || !passwordOk) {
      return withApiCorsHeaders(
        NextResponse.json({ error: "Credenciales incorrectas" }, { status: 401 }),
      )
    }

    // Credentials match the hardcoded Super Admin — ensure that ONE account exists in Auth.
    const supabase = getSupabaseServer()
    let user = await findUserByEmail(expectedEmail)

    if (!user) {
      const { data, error } = await supabase.auth.admin.createUser({
        email: expectedEmail,
        password: expectedPassword,
        email_confirm: true,
        user_metadata: { name: "Super Admin", role: "Super Admin" },
        app_metadata: { role: "Super Admin" },
      })
      if (error || !data.user) {
        return withApiCorsHeaders(
          NextResponse.json(
            { error: error?.message || "No se pudo preparar la cuenta Super Admin" },
            { status: 500 },
          ),
        )
      }
      user = data.user
    } else {
      const prevApp = (user.app_metadata ?? {}) as Record<string, unknown>
      const prevUser = (user.user_metadata ?? {}) as Record<string, unknown>
      const { error } = await supabase.auth.admin.updateUserById(user.id, {
        password: expectedPassword,
        email_confirm: true,
        app_metadata: { ...prevApp, role: "Super Admin" },
        user_metadata: { ...prevUser, name: prevUser.name || "Super Admin", role: "Super Admin" },
      })
      if (error) {
        return withApiCorsHeaders(
          NextResponse.json({ error: error.message }, { status: 500 }),
        )
      }
    }

    return withApiCorsHeaders(
      NextResponse.json({
        ok: true,
        email: expectedEmail,
        role: "Super Admin",
      }),
    )
  } catch (error) {
    return withApiCorsHeaders(
      NextResponse.json(
        { error: error instanceof Error ? error.message : "Server error" },
        { status: 500 },
      ),
    )
  }
}
