import { SubAdminDashboard } from "@/components/sub-admin/dashboard";
import { DashboardHeader } from "@/components/dashboard-header";
import { DashboardShell } from "@/components/dashboard-shell";
import { unauthorized } from "next/navigation";
import { auth } from "@/auth";

export default async function SubAdminDashboardPage() {
  const session = await auth();
  console.log("🚀 ~ SubAdminDashboardPage ~ session:", session);

  if (!session || session.user.role !== 2) {
    unauthorized();
  }

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Sub-Admin Dashboard"
        text="Manage your assigned jurisdictions and operations."
      />
      <SubAdminDashboard />
    </DashboardShell>
  );
}
