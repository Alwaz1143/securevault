import DashboardShell from "@/components/DashboardShell";
import MasterPasswordUnlock from "@/components/MasterPasswordUnlock";
import SecurityCenterPanel from "@/components/SecurityCenterPanel";

export default function SecurityCenterPage() {
  return (
    <DashboardShell
      title="Security Center"
      description="Analyze your unlocked vault locally for weak, reused, old, and risky credentials."
    >
      <div className="space-y-8">
        <MasterPasswordUnlock />

        <SecurityCenterPanel />
      </div>
    </DashboardShell>
  );
}