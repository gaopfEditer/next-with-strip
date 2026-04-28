import { redirect } from "next/navigation"

export default function LegacyLoginPage() {
  redirect("/login?from=%2Flegacy%2Fdashboard")
}
