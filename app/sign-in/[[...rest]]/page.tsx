import Link from "next/link";
import { Show, SignIn, UserButton } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />
      </div>

      <nav className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link href="/" className="text-xl font-bold text-cyan-300">
          SecureVault
        </Link>

        <div className="flex items-center gap-4">
          <Show when="signed-out">
            <Link
              href="/sign-up"
              className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-cyan-400 hover:text-cyan-300"
            >
              Create account
            </Link>
          </Show>

          <Show when="signed-in">
            <Link
              href="/dashboard"
              className="rounded-xl bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
            >
              Dashboard
            </Link>

            <UserButton />
          </Show>
        </div>
      </nav>

      <section className="relative z-10 mx-auto grid min-h-[calc(100vh-96px)] max-w-6xl items-center gap-10 px-6 py-10 lg:grid-cols-[1fr_440px]">
        <div>
          <div className="mb-4 inline-flex rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-300">
            Welcome back
          </div>

          <h1 className="max-w-2xl text-4xl font-bold tracking-tight sm:text-6xl">
            Sign in to your encrypted vault.
          </h1>

          <p className="mt-6 max-w-xl text-base leading-7 text-slate-400 sm:text-lg">
            SecureVault uses Clerk for account authentication and a separate
            master password for client-side vault encryption.
          </p>

          <div className="mt-8 grid max-w-xl gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
              <p className="text-sm font-semibold text-slate-100">
                Clerk Auth
              </p>

              <p className="mt-2 text-xs leading-5 text-slate-500">
                Secure login and session management.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
              <p className="text-sm font-semibold text-slate-100">
                Master Unlock
              </p>

              <p className="mt-2 text-xs leading-5 text-slate-500">
                Your vault key is derived locally.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
              <p className="text-sm font-semibold text-slate-100">
                Encrypted Data
              </p>

              <p className="mt-2 text-xs leading-5 text-slate-500">
                Server stores ciphertext, not plaintext.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-4 shadow-2xl shadow-cyan-950/20 backdrop-blur">
          <SignIn
            routing="path"
            path="/sign-in"
            signUpUrl="/sign-up"
            fallbackRedirectUrl="/dashboard"
            appearance={{
              variables: {
                colorPrimary: "#22d3ee",
                colorBackground: "#0f172a",
                colorInputBackground: "#020617",
                colorInputText: "#e2e8f0",
                colorText: "#e2e8f0",
                colorTextSecondary: "#94a3b8",
                borderRadius: "0.9rem",
              },
              elements: {
                cardBox: "w-full shadow-none",
                card: "border border-slate-800 bg-slate-900 shadow-none",
                headerTitle: "text-slate-100",
                headerSubtitle: "text-slate-400",
                socialButtonsBlockButton:
                  "border-slate-700 bg-slate-950 text-slate-200 hover:bg-slate-800",
                formFieldInput:
                  "border-slate-700 bg-slate-950 text-slate-100",
                formFieldLabel: "text-slate-300",
                formButtonPrimary:
                  "bg-cyan-400 text-slate-950 hover:bg-cyan-300",
                footerActionText: "text-slate-400",
                footerActionLink: "text-cyan-300 hover:text-cyan-200",
              },
            }}
          />
        </div>
      </section>
    </main>
  );
}