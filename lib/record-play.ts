import { getSupabase } from "@/lib/supabase/client"

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

/** Fire-and-forget: log a play when a real catalog song starts. Ignores mock/non-UUID ids. */
export async function recordSongPlay(songId: string, userId?: string | null): Promise<void> {
  if (!songId || !UUID_RE.test(songId)) return

  try {
    const supabase = getSupabase()
    const { error } = await supabase.from("plays").insert({
      song_id: songId,
      user_id: userId || null,
    })
    if (error) {
      console.warn("[plays] failed to record:", error.message)
    }
  } catch (err) {
    console.warn("[plays] failed to record:", err)
  }
}
