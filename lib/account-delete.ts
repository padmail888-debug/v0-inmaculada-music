export const DELETE_ACCOUNT_CONFIRM_PHRASES = ["ELIMINAR", "DELETE"] as const

export function normalizeDeleteAccountConfirm(value: string): string {
  return value.trim().toUpperCase()
}

export function isDeleteAccountConfirm(value: string): boolean {
  const normalized = normalizeDeleteAccountConfirm(value)
  return (DELETE_ACCOUNT_CONFIRM_PHRASES as readonly string[]).includes(normalized)
}
