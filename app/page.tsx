export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center px-6 text-center">
        <div className="mb-4 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-300">
          Secure Password Manager
        </div>

        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
          SecureVault
        </h1>

        <p className="mt-4 text-xl font-medium text-slate-300">
          Encrypted Password Manager
        </p>

        <p className="mt-6 max-w-2xl text-base leading-7 text-slate-400 sm:text-lg">
          Designed with a zero-knowledge approach using client-side encryption,
          so sensitive vault data is encrypted before it is stored.
        </p>

        <div className="mt-8 flex flex-col gap-4 sm:flex-row">
          <button className="rounded-xl bg-cyan-400 px-6 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300">
            Login
          </button>

          <button className="rounded-xl border border-slate-700 px-6 py-3 font-semibold text-slate-200 transition hover:border-cyan-400 hover:text-cyan-300">
            Sign Up
          </button>
        </div>

        <div className="mt-12 grid max-w-4xl gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <h2 className="font-semibold text-slate-100">Client-Side Encryption</h2>
            <p className="mt-2 text-sm text-slate-400">
              Vault data is encrypted in the browser before reaching the server.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <h2 className="font-semibold text-slate-100">Master Password</h2>
            <p className="mt-2 text-sm text-slate-400">
              The master password is used to unlock the vault, not for app login.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <h2 className="font-semibold text-slate-100">Encrypted Storage</h2>
            <p className="mt-2 text-sm text-slate-400">
              The database stores ciphertext, IV, salt, and metadata only.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}