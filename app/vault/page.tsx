import DashboardShell from "@/components/DashboardShell";

export default function VaultPage() {
  return (
    <DashboardShell
      title="Vault"
      description="Manage encrypted website, app, and account credentials."
    >
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h3 className="text-xl font-semibold">Encrypted Vault Items</h3>
            <p className="mt-2 text-sm text-slate-400">
              Later, each item will be encrypted in the browser before being
              saved to the database.
            </p>
          </div>

          <button className="rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300">
            Add Vault Item
          </button>
        </div>

        <div className="mt-8 rounded-xl border border-dashed border-slate-700 p-8 text-center">
          <p className="text-slate-300">No vault items yet.</p>
          <p className="mt-2 text-sm text-slate-500">
            Vault CRUD will be implemented after authentication and database
            setup.
          </p>
        </div>
      </div>
    </DashboardShell>
  );
}