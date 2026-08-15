/** Clear leftover Radix/sheet body locks that block taps after logout on Capacitor. */
export function clearBodyScrollLocks() {
  if (typeof document === "undefined") return

  const { body, documentElement } = document
  body.style.pointerEvents = ""
  body.style.overflow = ""
  body.style.paddingRight = ""
  body.removeAttribute("data-scroll-locked")
  documentElement.style.overflow = ""
  documentElement.style.pointerEvents = ""

  document.querySelectorAll("[data-scroll-locked]").forEach((el) => {
    el.removeAttribute("data-scroll-locked")
  })

  // Orphan overlays from sheets/dialogs that unmounted uncleanly can eat all touches.
  document.querySelectorAll("[data-slot='sheet-overlay'], [data-slot='dialog-overlay']").forEach((el) => {
    el.parentElement?.removeChild(el)
  })
}
