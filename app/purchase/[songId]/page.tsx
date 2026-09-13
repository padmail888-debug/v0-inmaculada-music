import { redirect } from "next/navigation"

/** Per-song checkout was a demo stub. Paid access is subscription-only via Stripe. */
export default function PurchasePage() {
  redirect("/subscription")
}

export function generateStaticParams() {
  return [{ songId: "_" }]
}
