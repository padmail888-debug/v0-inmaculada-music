import { redirect } from "next/navigation"

/** Real checkout lives on /subscription (Stripe). This route used to be a fake card form. */
export default function PaymentPage() {
  redirect("/subscription")
}
