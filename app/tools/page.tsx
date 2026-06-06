import DashboardShell from "@/components/DashboardShell";

export default function ToolsPage() {
  return (
    <DashboardShell
      title="Password Tools"
      description="Generate strong passwords, check password strength, and verify breach exposure."
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h3 className="text-xl font-semibold">Password Generator</h3>
          <p className="mt-2 text-sm text-slate-400">
            This tool will generate strong random passwords with length,
            numbers, symbols, uppercase, and lowercase options.
          </p>

          <button className="mt-6 rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300">
            Generate Password
          </button>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h3 className="text-xl font-semibold">Strength Checker</h3>
          <p className="mt-2 text-sm text-slate-400">
            This will estimate password strength using length, character
            variety, and common pattern checks.
          </p>

          <div className="mt-6 rounded-xl border border-slate-700 bg-slate-950 p-4 text-sm text-slate-500">
            Strength result will appear here.
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 lg:col-span-2">
          <h3 className="text-xl font-semibold">Breach Check</h3>
          <p className="mt-2 text-sm text-slate-400">
            Later, this will use HaveIBeenPwned k-anonymity checking. The full
            password will not be sent to the API.
          </p>
        </div>
      </div>
    </DashboardShell>
  );
}