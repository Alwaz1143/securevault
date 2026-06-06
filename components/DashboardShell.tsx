"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";

type DashboardShellProps = {
  children: React.ReactNode;
  title: string;
  description: string;
};

const navItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
  },
  {
    label: "Vault",
    href: "/vault",
  },
  {
    label: "Password Tools",
    href: "/tools",
  },
  {
    label: "Audit Logs",
    href: "/audit-logs",
  },
  {
    label: "Settings",
    href: "/settings",
  },
];

export default function DashboardShell({
  children,
  title,
  description,
}: DashboardShellProps) {
  const pathname = usePathname();

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 border-r border-slate-800 bg-slate-900/70 p-6 md:block">
          <Link href="/" className="block">
            <h1 className="text-2xl font-bold text-cyan-300">SecureVault</h1>
            <p className="mt-1 text-sm text-slate-400">
              Encrypted Password Manager
            </p>
          </Link>

          <nav className="mt-10 space-y-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block rounded-xl px-4 py-3 text-sm font-medium transition ${
                    isActive
                      ? "bg-cyan-400 text-slate-950"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-10 rounded-2xl border border-slate-800 bg-slate-950 p-4">
            <p className="text-sm font-semibold text-slate-200">
              Vault Status
            </p>
            <p className="mt-2 text-sm text-yellow-300">Locked</p>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              Later, the vault will unlock only after entering the master
              password.
            </p>
          </div>
        </aside>

        <section className="flex-1">
          <header className="border-b border-slate-800 bg-slate-950/80 p-6">
            <div className="mx-auto flex max-w-6xl items-start justify-between gap-6">
              <div>
                <p className="text-sm text-cyan-300">SecureVault MVP</p>
                <h2 className="mt-2 text-3xl font-bold">{title}</h2>
                <p className="mt-2 max-w-2xl text-sm text-slate-400">
                  {description}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  href="/"
                  className="hidden rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:border-cyan-400 hover:text-cyan-300 sm:block"
                >
                  Home
                </Link>

                <UserButton />
              </div>
            </div>
          </header>

          <div className="mx-auto max-w-6xl p-6">{children}</div>
        </section>
      </div>
    </main>
  );
}