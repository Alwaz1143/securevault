import DashboardShell from "@/components/DashboardShell";

export default function DashboardPage() {
  return (
    <DashboardShell
      title="Dashboard"
      description="Overview of your encrypted vault, security status, and recent activity."
    >
      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <p className="text-sm text-slate-400">Total Vault Items</p>
          <h3 className="mt-3 text-3xl font-bold">0</h3>
          <p className="mt-2 text-sm text-slate-500">
            Vault CRUD will be added later.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <p className="text-sm text-slate-400">Vault Status</p>
          <h3 className="mt-3 text-3xl font-bold text-yellow-300">Locked</h3>
          <p className="mt-2 text-sm text-slate-500">
            Master password unlock flow is coming soon.
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

      <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <h3 className="text-xl font-semibold">Next Milestone</h3>
        <p className="mt-3 text-slate-400">
          Add Clerk authentication so only logged-in users can access protected
          app pages.
        </p>
      </div>
    </DashboardShell>
  );
}