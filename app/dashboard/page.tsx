import DashboardShell from "@/components/DashboardShell";
import MasterPasswordUnlock from "@/components/MasterPasswordUnlock";

export default function DashboardPage() {
  return (
    <DashboardShell
      title="Dashboard"
      description="Overview of your encrypted vault, security status, and recent activity."
    >
      <div className="space-y-8">
        <MasterPasswordUnlock />

        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-sm text-slate-400">Total Vault Items</p>
            <h3 className="mt-3 text-3xl font-bold">0</h3>
            <p className="mt-2 text-sm text-slate-500">
              Vault CRUD UI will be added after encryption utilities.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-sm text-slate-400">Encryption Mode</p>
            <h3 className="mt-3 text-2xl font-bold text-cyan-300">
              Client-Side
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Vault data will be encrypted before API requests.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-sm text-slate-400">Security Events</p>
            <h3 className="mt-3 text-3xl font-bold">0</h3>
            <p className="mt-2 text-sm text-slate-500">
              Audit logs will appear here.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h3 className="text-xl font-semibold">Next Milestone</h3>
          <p className="mt-3 text-slate-400">
            Add PBKDF2 key derivation and AES-GCM encryption using the Web
            Crypto API.
          </p>
        </div>
      </div>
    </DashboardShell>
  );
}