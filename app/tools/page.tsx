import DashboardShell from "@/components/DashboardShell";
import PasswordGeneratorPanel from "@/components/PasswordGeneratorPanel";
import PasswordStrengthChecker from "@/components/PasswordStrengthChecker";

export default function ToolsPage() {
  return (
    <DashboardShell
      title="Password Tools"
      description="Generate strong passwords, check password strength, and prepare for safe breach checking."
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <PasswordGeneratorPanel />

        <PasswordStrengthChecker />

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 lg:col-span-2">
          <h3 className="text-xl font-semibold">Breach Check</h3>

          <p className="mt-2 text-sm leading-6 text-slate-400">
            Next, we will add HaveIBeenPwned k-anonymity checking. The app will
            hash the password locally, send only the first 5 characters of the
            SHA-1 hash, and compare the returned suffixes locally.
          </p>

          <div className="mt-5 rounded-xl border border-slate-800 bg-slate-950 p-4">
            <p className="text-xs leading-5 text-slate-500">
              The full password will not be sent to HaveIBeenPwned.
            </p>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}