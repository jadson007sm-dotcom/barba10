"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function InitialSuperAdminSetupPage() {
  const router = useRouter();
  const [available, setAvailable] = useState<boolean | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    void supabase.rpc("is_initial_super_admin_setup_available").then(({ data, error: statusError }) => {
      if (statusError) {
        setError("Não foi possível verificar a configuração inicial.");
        setAvailable(false);
        return;
      }
      setAvailable(Boolean(data));
    });
  }, []);

  async function finishBootstrap() {
    const supabase = createClient();
    const { error: bootstrapError } = await supabase.rpc("bootstrap_first_super_admin", {
      p_full_name: fullName.trim(),
    });

    if (bootstrapError) {
      setError(bootstrapError.message.includes("initial super admin setup is closed")
        ? "A configuração inicial já foi encerrada."
        : "Não foi possível concluir a criação do Super Admin.");
      return false;
    }

    return true;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (password.length < 8) {
      setError("A senha deve ter pelo menos 8 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setError("As senhas não conferem.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { full_name: fullName.trim() } },
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      if (data.session) {
        const completed = await finishBootstrap();
        if (completed) {
          router.replace("/power");
          router.refresh();
        }
        return;
      }

      setMessage("Conta criada. Confirme seu e-mail e depois use o botão abaixo para concluir a configuração do Super Admin.");
    } catch {
      setError("Não foi possível concluir a configuração agora.");
    } finally {
      setLoading(false);
    }
  }

  if (available === null) {
    return <main className="flex min-h-screen items-center justify-center bg-black px-6 text-white"><p className="text-sm text-zinc-400">Verificando configuração inicial...</p></main>;
  }

  if (!available) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
        <section className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-950 p-8 shadow-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#D4AF37]">BARBA10 · POWER</p>
          <h1 className="mt-4 text-3xl font-semibold">Configuração inicial encerrada</h1>
          <p className="mt-3 text-sm leading-6 text-zinc-400">O primeiro Super Admin já foi configurado. Use o acesso normal para entrar no Painel Power.</p>
          <Link href="/login" className="mt-6 block rounded-xl bg-[#D4AF37] px-4 py-3 text-center font-semibold text-black">Ir para o login</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
      <section className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-950 p-8 shadow-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#D4AF37]">BARBA10 · POWER</p>
        <h1 className="mt-4 text-3xl font-semibold">Configuração inicial</h1>
        <p className="mt-3 text-sm leading-6 text-zinc-400">Crie o primeiro Super Admin. Esta configuração só fica disponível enquanto o sistema ainda não possui usuários.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block text-sm"><span className="mb-2 block text-zinc-300">Nome completo</span><input required value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 outline-none focus:border-[#D4AF37]" /></label>
          <label className="block text-sm"><span className="mb-2 block text-zinc-300">E-mail</span><input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 outline-none focus:border-[#D4AF37]" /></label>
          <label className="block text-sm"><span className="mb-2 block text-zinc-300">Senha</span><input type="password" required minLength={8} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 outline-none focus:border-[#D4AF37]" /></label>
          <label className="block text-sm"><span className="mb-2 block text-zinc-300">Confirmar senha</span><input type="password" required minLength={8} autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 outline-none focus:border-[#D4AF37]" /></label>

          {error ? <p className="rounded-xl border border-red-900 bg-red-950/40 px-3 py-2 text-sm text-red-300">{error}</p> : null}
          {message ? <p className="rounded-xl border border-emerald-900 bg-emerald-950/40 px-3 py-2 text-sm text-emerald-300">{message}</p> : null}

          <button type="submit" disabled={loading} className="w-full rounded-xl bg-[#D4AF37] px-4 py-3 font-semibold text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60">{loading ? "Configurando..." : "Criar primeiro Super Admin"}</button>
        </form>

        <Link href="/login?bootstrap=1" className="mt-5 block text-center text-sm text-zinc-500 hover:text-white">Já criou a conta? Finalizar configuração</Link>
      </section>
    </main>
  );
}
