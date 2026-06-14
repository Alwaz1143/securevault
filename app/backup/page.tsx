import DashboardShell from "@/components/DashboardShell";
import EncryptedBackupPanel from "@/components/EncryptedBackupPanel";
import MasterPasswordUnlock from "@/components/MasterPasswordUnlock";

export default function BackupPage() {
  return (
    <DashboardShell
      title="Backup & Restore"
      description="Export and import encrypted SecureVault backup files without exposing plaintext passwords."
    >
      <div className="space-y-8">
        <MasterPasswordUnlock />

        <EncryptedBackupPanel />
      </div>
    </DashboardShell>
  );
}