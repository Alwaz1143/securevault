import DashboardOverview from "@/components/DashboardOverview";
import DashboardShell from "@/components/DashboardShell";
import MasterPasswordUnlock from "@/components/MasterPasswordUnlock";
import DashboardSecuritySnapshot from "@/components/DashboardSecuritySnapshot";

export default function DashboardPage() {
  return (
    <DashboardShell
      title="Dashboard"
      description="Overview of your encrypted vault, security status, and recent activity."
    >
      <div className="space-y-8">
        <MasterPasswordUnlock />

        <DashboardOverview />
        <DashboardSecuritySnapshot />
      </div>
    </DashboardShell>
  );
}