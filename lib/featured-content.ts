import { getSupabase } from "@/lib/supabase/client"

export type FeaturedContentType = "announcement" | "promotion" | "event"

export type FeaturedContent = {
  id: string
  title: string
  description: string
  imageUrl: string
  linkUrl: string
  isActive: boolean
  priority: number
  type: FeaturedContentType
  createdAt: string
  updatedAt: string
  createdBy?: string | null
}

export type FeaturedContentInput = {
  title: string
  description: string
  imageUrl: string
  linkUrl: string
  type: FeaturedContentType
  isActive: boolean
  priority?: number
}

type FeaturedRow = {
  id: string
  title: string
  description: string | null
  image_url: string | null
  link_url: string | null
  is_active: boolean
  priority: number
  type: string
  created_at: string
  updated_at: string
  created_by?: string | null
}

function mapRow(row: FeaturedRow): FeaturedContent {
  const type =
    row.type === "promotion" || row.type === "event" || row.type === "announcement"
      ? row.type
      : "announcement"
  return {
    id: row.id,
    title: row.title,
    description: row.description || "",
    imageUrl: row.image_url || "/placeholder.svg",
    linkUrl: row.link_url || "/",
    isActive: !!row.is_active,
    priority: row.priority ?? 1,
    type,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: row.created_by ?? null,
  }
}

/** Public: active featured items for artist profile / dashboard. */
export async function fetchActiveFeaturedContent(): Promise<FeaturedContent[]> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from("featured_content")
    .select(
      "id, title, description, image_url, link_url, is_active, priority, type, created_at, updated_at, created_by",
    )
    .eq("is_active", true)
    .order("priority", { ascending: true })

  if (error) throw new Error(error.message)
  return (data || []).map((row) => mapRow(row as FeaturedRow))
}

/** Super Admin: all items including inactive. */
export async function fetchAllFeaturedContent(): Promise<FeaturedContent[]> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from("featured_content")
    .select(
      "id, title, description, image_url, link_url, is_active, priority, type, created_at, updated_at, created_by",
    )
    .order("priority", { ascending: true })

  if (error) throw new Error(error.message)
  return (data || []).map((row) => mapRow(row as FeaturedRow))
}

export async function fetchFeaturedContentById(id: string): Promise<FeaturedContent | null> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from("featured_content")
    .select(
      "id, title, description, image_url, link_url, is_active, priority, type, created_at, updated_at, created_by",
    )
    .eq("id", id)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) return null
  return mapRow(data as FeaturedRow)
}

export async function createFeaturedContent(
  input: FeaturedContentInput,
  userId?: string | null,
): Promise<FeaturedContent> {
  const title = input.title.trim()
  if (!title) throw new Error("El título es obligatorio")

  const supabase = getSupabase()
  let priority = input.priority
  if (priority == null) {
    const { data: existing } = await supabase
      .from("featured_content")
      .select("priority")
      .order("priority", { ascending: false })
      .limit(1)
    priority = ((existing?.[0]?.priority as number | undefined) ?? 0) + 1
  }

  const { data, error } = await supabase
    .from("featured_content")
    .insert({
      title,
      description: input.description.trim(),
      image_url: input.imageUrl.trim() || "/placeholder.svg",
      link_url: input.linkUrl.trim() || "/",
      type: input.type,
      is_active: input.isActive,
      priority,
      created_by: userId || null,
      updated_at: new Date().toISOString(),
    })
    .select(
      "id, title, description, image_url, link_url, is_active, priority, type, created_at, updated_at, created_by",
    )
    .single()

  if (error || !data) throw new Error(error?.message || "No se pudo crear el contenido")
  return mapRow(data as FeaturedRow)
}

export async function updateFeaturedContent(
  id: string,
  input: Partial<FeaturedContentInput>,
): Promise<FeaturedContent> {
  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }
  if (input.title != null) {
    const title = input.title.trim()
    if (!title) throw new Error("El título es obligatorio")
    patch.title = title
  }
  if (input.description != null) patch.description = input.description.trim()
  if (input.imageUrl != null) patch.image_url = input.imageUrl.trim() || "/placeholder.svg"
  if (input.linkUrl != null) patch.link_url = input.linkUrl.trim() || "/"
  if (input.type != null) patch.type = input.type
  if (input.isActive != null) patch.is_active = input.isActive
  if (input.priority != null) patch.priority = input.priority

  const supabase = getSupabase()
  const { data, error } = await supabase
    .from("featured_content")
    .update(patch)
    .eq("id", id)
    .select(
      "id, title, description, image_url, link_url, is_active, priority, type, created_at, updated_at, created_by",
    )
    .single()

  if (error || !data) throw new Error(error?.message || "No se pudo actualizar")
  return mapRow(data as FeaturedRow)
}

export async function deleteFeaturedContent(id: string): Promise<void> {
  const supabase = getSupabase()
  const { error } = await supabase.from("featured_content").delete().eq("id", id)
  if (error) throw new Error(error.message)
}

export async function setFeaturedContentActive(id: string, isActive: boolean): Promise<void> {
  await updateFeaturedContent(id, { isActive })
}

export async function moveFeaturedContentPriority(
  id: string,
  direction: "up" | "down",
): Promise<void> {
  const items = await fetchAllFeaturedContent()
  const index = items.findIndex((item) => item.id === id)
  if (index < 0) return
  const swapWith = direction === "up" ? index - 1 : index + 1
  if (swapWith < 0 || swapWith >= items.length) return

  const a = items[index]
  const b = items[swapWith]
  await updateFeaturedContent(a.id, { priority: b.priority })
  await updateFeaturedContent(b.id, { priority: a.priority })
}

export function featuredEditHref(id: string): string {
  return `/admin/featured/edit?id=${encodeURIComponent(id)}`
}
