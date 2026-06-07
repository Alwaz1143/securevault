import DashboardShell from "@/components/DashboardShell";
import MasterPasswordUnlock from "@/components/MasterPasswordUnlock";
import VaultLockedNotice from "@/components/VaultLockedNotice";
import VaultManager from "@/components/VaultManager";

export default function VaultPage() {
  return (
    <DashboardShell
      title="Vault"
      description="Manage encrypted website, app, and account credentials."
    >
      <div className="space-y-8">
        <MasterPasswordUnlock />

        <VaultLockedNotice />

        <VaultManager />
      </div>
    </DashboardShell>
  );
}