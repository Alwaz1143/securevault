import DashboardShell from "@/components/DashboardShell";

export default function AuditLogsPage() {
  return (
    <DashboardShell
      title="Audit Logs"
      description="Track important security-related actions without storing sensitive values."
    >
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <h3 className="text-xl font-semibold">Activity Timeline</h3>
        <p className="mt-2 text-sm text-slate-400">
          Audit logs will record events like vault unlock, vault lock, item
          created, item updated, item deleted, and breach checks.
        </p>

        <div className="mt-8 space-y-4">
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
            <p className="text-sm font-medium text-slate-300">
              No audit events yet.
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Sensitive data like passwords, notes, or master password should
              never be logged.
            </p>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}