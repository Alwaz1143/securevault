import AutoLockSettings from "@/components/AutoLockSettings";
import DashboardShell from "@/components/DashboardShell";

export default function SettingsPage() {
  return (
    <DashboardShell
      title="Settings"
      description="Configure vault behavior, security preferences, and future account options."
    >
      <div className="space-y-6">
        <AutoLockSettings />

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h3 className="text-xl font-semibold">Future Security Options</h3>

          <p className="mt-2 text-sm leading-6 text-slate-400">
            These are not part of the current MVP, but they are strong future
            improvements for a real password manager.
          </p>

          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-slate-400">
            <li>Change master password with vault re-encryption</li>
            <li>Export encrypted vault backup</li>
            <li>TOTP two-factor authentication</li>
            <li>Recovery codes</li>
            <li>Passkey support</li>
            <li>Encrypted vault sharing</li>
          </ul>
        </div>
      </div>
    </DashboardShell>
  );
}