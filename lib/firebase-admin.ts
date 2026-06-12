import { getApps, initializeApp, cert, App } from "firebase-admin/app"
import { getMessaging } from "firebase-admin/messaging"

let firebaseApp: App | null = null

function getPrivateKey() {
  const key = process.env.FIREBASE_PRIVATE_KEY
  return key ? key.replace(/\\n/g, "\n") : undefined
}

let warnedProjectMismatch = false

export function getFirebaseAdminApp(): App | null {
  const projectId = process.env.FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKey = getPrivateKey()
  const publicProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID

  if (publicProjectId && projectId && publicProjectId !== projectId && !warnedProjectMismatch) {
    warnedProjectMismatch = true
    console.error(
      "[notifications] FIREBASE_PROJECT_ID must match NEXT_PUBLIC_FIREBASE_PROJECT_ID.",
      "Admin:",
      projectId,
      "Client:",
      publicProjectId,
      "→ FCM returns SenderId mismatch; push will not reach Android.",
    )
  }

  if (!projectId || !clientEmail || !privateKey) return null
  if (firebaseApp) return firebaseApp

  firebaseApp =
    getApps()[0] ??
    initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    })

  return firebaseApp
}

function stringifyData(data?: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [key, value] of Object.entries(data ?? {})) {
    out[key] = value == null ? "" : String(value)
  }
  return out
}

export async function sendPushToTokens(
  tokens: string[],
  payload: { title: string; body: string; data?: Record<string, string> },
) {
  const app = getFirebaseAdminApp()
  if (!app || tokens.length === 0) {
    return {
      successCount: 0,
      failureCount: 0,
      responses: [] as Array<{ success: boolean; error?: unknown }>,
      invalidTokens: [] as string[],
    }
  }

  const messaging = getMessaging(app)
  const data = stringifyData(payload.data)
  const res = await messaging.sendEachForMulticast({
    tokens,
    notification: { title: payload.title, body: payload.body },
    data,
    android: {
      priority: "high",
      notification: {
        channelId: "inmaculada_default",
        sound: "default",
      },
    },
    apns: {
      payload: {
        aps: {
          alert: { title: payload.title, body: payload.body },
          sound: "default",
        },
      },
    },
    webpush: {
      notification: {
        title: payload.title,
        body: payload.body,
      },
      fcmOptions: {
        link: data.deepLink || data.deep_link || undefined,
      },
    },
  })

  const invalidTokens: string[] = []
  res.responses.forEach((response, index) => {
    if (response.success) return
    const code = response.error?.code
    const message = response.error?.message
    if (
      code === "messaging/invalid-registration-token" ||
      code === "messaging/registration-token-not-registered" ||
      code === "messaging/mismatched-credential"
    ) {
      const token = tokens[index]
      if (token) invalidTokens.push(token)
    }
    console.warn("[notifications] FCM delivery failed for token index", index, code, message)
  })

  return { ...res, invalidTokens }
}
