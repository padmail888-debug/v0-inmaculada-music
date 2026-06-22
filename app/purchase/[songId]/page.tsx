export const dynamic = 'force-dynamic'

import PurchasePageClient from "./PurchasePageClient"

export default function PurchasePage({ params }: { params: { songId: string } }) {
  return <PurchasePageClient params={params} />
}

// Tell Next.js which songIds to pre-generate for static export
export function generateStaticParams() {
  const ids = ["1", "2", "3"]
  return ids.map((songId) => ({ songId }))
}

