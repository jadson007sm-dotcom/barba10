"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { trackLandingEvent } from "@/components/landing-analytics";

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 63);
}

export default function CadastroPage() {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [owner, setOwner] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<{type:"error"|"success";text:string}|null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("barba10_onboarding");
    if (!saved) return;
    try {
      const data = JSON.parse(saved) as Partial<Record<string,string>>;
      setName(data.name ?? "");
      setSlug(data.slug ?? "");
      setOwner(data.owner ?? "");
      setPhone(data.phone ?? "");
      setEmail(data.email ?? "");
    } catch {}
  }, []);

  function handleNameChange(value: string) {
    setName(value);
    setSlug((current) => current || slugify(value));
  }

  async function createTenant() {
    const supabase = createClient();
    const { data, error } = await supabase.rpc("create_barbershop_for_current_user", {
      barbershop_name: name.trim(),
      barbershop_slug: slug.trim(),
      owner_full_name: owner.trim() || null,
      owner_phone: phone.trim() || null,
    });

    if (error) {
      const text =
        error.message.includes("slug_unavailable")
          ? "Esse endereço já está em uso. Escolha outro."
          : "Não foi possível criar a barbearia agora.";
      throw new Error(text);
    }

    if (!data) throw new Error("A criação da barbearia não retornou um identificador.");
    return String(data);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    if (password.length < 8) {
      setMessage({ type:"error", text:"A senha precisa ter pelo menos 8 caracteres." });
      return;
    }

    if (password !== confirmPassword) {
      setMessage({ type:"error", text:"As senhas não conferem." });
      return;
    }

    if (!/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(slug)) {
      setMessage({ type:"error", text:"Use apenas letras minúsculas, números e hífen no endereço." });
      return;
    }

    setLoading(true);

    try {
      await trackLandingEvent("signup_started");

      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { full_name: owner.trim() },
          emailRedirectTo: `${window.location.origin}/cadastro`,
        },
      });

      if (error) {
        if (error.message.toLowerCase().includes("already registered")) {
          setMessage({ type:"error", text:"Este e-mail já possui uma conta. Entre para continuar." });
        } else {
          setMessage({ type:"error", text:"Não foi possível criar sua conta. Verifique os dados." });
        }
        return;
      }

      window.localStorage.setItem(
        "barba10_onboarding",
        JSON.stringify({ name, slug, owner, phone, email })
      );

      if (data.session) {
        await createTenant();
        await trackLandingEvent("signup_completed");
        window.localStorage.removeItem("barba10_onboarding");
        setMessage({ type:"success", text:"Cadastro concluído. Abrindo sua área..." });
        window.setTimeout(() => window.location.assign("/"), 500);
        return;
      }

      setMessage({
        type:"success",
        text:"Conta criada. Confirme seu e-mail para ativar o acesso e concluir o cadastro da barbearia."
      });
    } catch (error) {
      setMessage({
        type:"error",
        text: error instanceof Error ? error.message : "Não foi possível concluir o cadastro.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-black px-4 py-8 text-white sm:px-6">
      <div className="mx-auto grid min-h-[90vh] max-w-6xl items-center gap-10 lg:grid-cols-[1.05fr_.95fr]">
        <section className="hidden lg:block">
          <p className="text-sm font-semibold uppercase tracking-[0.32em] text-[#D4AF37]">BARBA10</p>
          <h1 className="mt-6 text-5xl font-semibold leading-tight">Sua barbearia merece uma operação à altura da sua marca.</h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-zinc-400">
            Crie sua conta e entre em uma plataforma pensada para gestão, equipe, agenda e relacionamento com clientes.
          </p>
        </section>

        <section className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl sm:p-8">
          <Link href="/" className="text-sm text-zinc-500 hover:text-white">← Voltar</Link>
          <div className="mt-6">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#D4AF37]">Comece agora</p>
            <h2 className="mt-2 text-3xl font-bold">Cadastre sua barbearia</h2>
            <p className="mt-2 text-sm text-zinc-400">Seu endereço será reservado em barba10.com.</p>
          </div>

          <form onSubmit={submit} className="mt-7 space-y-4">
            <input value={name} onChange={(e)=>handleNameChange(e.target.value)} required placeholder="Nome da barbearia" className="input" />
            <div>
              <input value={slug} onChange={(e)=>setSlug(slugify(e.target.value))} required placeholder="endereco-da-barbearia" className="input" />
              <p className="mt-1 text-xs text-zinc-600">{slug || "seu-endereco"}.barba10.com</p>
            </div>
            <input value={owner} onChange={(e)=>setOwner(e.target.value)} required placeholder="Seu nome completo" className="input" />
            <input value={phone} onChange={(e)=>setPhone(e.target.value)} placeholder="Telefone (opcional)" className="input" />
            <input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required placeholder="Seu melhor e-mail" className="input" />
            <input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} required placeholder="Senha (mín. 8 caracteres)" autoComplete="new-password" className="input" />
            <input type="password" value={confirmPassword} onChange={(e)=>setConfirmPassword(e.target.value)} required placeholder="Confirme sua senha" autoComplete="new-password" className="input" />

            {message ? (
              <div className={message.type === "error" ? "notice-error" : "notice-success"}>{message.text}</div>
            ) : null}

            <button disabled={loading} className="w-full rounded-2xl bg-[#D4AF37] px-5 py-3.5 font-semibold text-black transition hover:brightness-110 disabled:opacity-60">
              {loading ? "Criando sua conta..." : "Criar minha barbearia"}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-zinc-500">
            Já possui acesso? <Link href="/login" className="text-[#D4AF37] hover:underline">Entrar</Link>
          </p>
        </section>
      </div>
    </main>
  );
}
