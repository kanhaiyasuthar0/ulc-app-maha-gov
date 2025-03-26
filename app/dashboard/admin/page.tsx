import { AdminDashboard } from "@/components/admin/dashboard";
import { DashboardHeader } from "@/components/dashboard-header";
import { DashboardShell } from "@/components/dashboard-shell";
import { unauthorized } from "next/navigation";

import { auth } from "@/auth";

export default async function AdminDashboardPage() {
  const session = await auth();

  if (!session || session.user.role !== 1) {
    unauthorized();
  }

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Admin Dashboard"
        text="Manage sub-admins, jurisdictions, and platform settings."
      />
      <AdminDashboard />
    </DashboardShell>
  );
}
