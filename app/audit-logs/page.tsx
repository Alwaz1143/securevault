import AuditLogsTimeline from "@/components/AuditLogsTimeline";
import DashboardShell from "@/components/DashboardShell";

export default function AuditLogsPage() {
  return (
    <DashboardShell
      title="Audit Logs"
      description="Track important security-related actions without storing sensitive values."
    >
      <AuditLogsTimeline />
    </DashboardShell>
  );
}