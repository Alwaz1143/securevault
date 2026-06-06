import DashboardShell from "@/components/DashboardShell";

export default function SettingsPage() {
  return (
    <DashboardShell
      title="Settings"
      description="Configure vault behavior, security preferences, and future account options."
    >
      <div className="space-y-6">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h3 className="text-xl font-semibold">Auto-Lock Timeout</h3>
          <p className="mt-2 text-sm text-slate-400">
            Later, this setting will control when the vault automatically locks
            after inactivity.
          </p>

          <select className="mt-5 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-200 outline-none">
            <option>5 minutes</option>
            <option>10 minutes</option>
            <option>15 minutes</option>
          </select>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h3 className="text-xl font-semibold">Future Security Options</h3>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-slate-400">
            <li>Change master password</li>
            <li>Export encrypted vault</li>
            <li>TOTP two-factor authentication</li>
            <li>Recovery codes</li>
          </ul>
        </div>
      </div>
    </DashboardShell>
  );
}