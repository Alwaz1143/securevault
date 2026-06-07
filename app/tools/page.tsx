import DashboardShell from "@/components/DashboardShell";
import PasswordBreachChecker from "@/components/PasswordBreachChecker";
import PasswordGeneratorPanel from "@/components/PasswordGeneratorPanel";
import PasswordStrengthChecker from "@/components/PasswordStrengthChecker";

export default function ToolsPage() {
  return (
    <DashboardShell
      title="Password Tools"
      description="Generate strong passwords, check password strength, and verify breach exposure safely."
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <PasswordGeneratorPanel />

        <PasswordStrengthChecker />

        <PasswordBreachChecker />
      </div>
    </DashboardShell>
  );
}