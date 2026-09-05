"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bootstrap = searchParams.get("bootstrap") === "1";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError || !data.user) {
        setError("E-mail ou senha inválidos.");
        return;
      }

      if (bootstrap) {
        const { error: bootstrapError } = await supabase.rpc("bootstrap_first_super_admin", {
          p_full_name: (data.user.user_metadata?.full_name as string | undefined) ?? "Super Admin",
        });

        if (bootstrapError && !bootstrapError.message.includes("super admin already configured")) {
          setError("A conta foi autenticada, mas não foi possível concluir a configuração do Super Admin.");
          return;
        }
      }

      const { data: roleRows } = await supabase
        .from("user_global_roles")
        .select("role")
        .eq("user_id", data.user.id);

      const isSuperAdmin = roleRows?.some((row) => row.role === "super_admin") ?? false;
      router.replace(isSuperAdmin ? "/power" : "/");
      router.refresh();
    } catch {
      setError("Não foi possível concluir o login agora.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
      <section className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#D4AF37]">BARBA10</p>
        <h1 className="mt-3 text-2xl font-bold">{bootstrap ? "Finalizar configuração do Power" : "Entrar"}</h1>
        <p className="mt-2 text-sm text-zinc-400">
          {bootstrap ? "Entre com a conta criada para concluir o primeiro acesso administrativo." : "Acesso seguro à plataforma."}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block text-sm">
            <span className="mb-2 block text-zinc-300">E-mail</span>
            <input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 outline-none focus:border-[#D4AF37]" />
          </label>

          <label className="block text-sm">
            <span className="mb-2 block text-zinc-300">Senha</span>
            <input type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 outline-none focus:border-[#D4AF37]" />
          </label>

          {error ? <p className="rounded-lg border border-red-900 bg-red-950/40 px-3 py-2 text-sm text-red-300">{error}</p> : null}

          <button type="submit" disabled={loading} className="w-full rounded-xl bg-[#D4AF37] px-4 py-3 font-semibold text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60">
            {loading ? "Entrando..." : bootstrap ? "Concluir configuração" : "Entrar"}
          </button>
        </form>

        {!bootstrap ? <a href="/setup/super-admin" className="mt-5 block text-center text-sm text-zinc-500 hover:text-white">Primeiro acesso: configurar Super Admin</a> : null}
      </section>
    </main>
  );
}
