"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase";

export default function Home() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const supabase = createClient();
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name } },
        });
        if (error) throw error;
        setMessage("Cadastro criado. Verifique seu e-mail para confirmar a conta, se a confirmação estiver habilitada no Supabase.");
        setMode("login");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        window.location.href = "/master";
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível concluir a operação.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <div className="brand">
          <div className="brand-mark">Barba<span>10</span></div>
          <p>Acesso ao Painel Master</p>
        </div>

        <div className="tabs">
          <button className={`tab ${mode === "login" ? "active" : ""}`} onClick={() => setMode("login")} type="button">Entrar</button>
          <button className={`tab ${mode === "signup" ? "active" : ""}`} onClick={() => setMode("signup")} type="button">Cadastrar</button>
        </div>

        <form onSubmit={handleSubmit}>
          {mode === "signup" && (
            <div className="field">
              <label htmlFor="name">Nome</label>
              <input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" required />
            </div>
          )}

          <div className="field">
            <label htmlFor="email">E-mail</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" autoComplete="email" required />
          </div>

          <div className="field">
            <label htmlFor="password">Senha</label>
            <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" minLength={6} autoComplete={mode === "login" ? "current-password" : "new-password"} required />
          </div>

          <button className="submit" type="submit" disabled={loading}>
            {loading ? "Aguarde..." : mode === "login" ? "Entrar no Painel Master" : "Criar conta"}
          </button>
        </form>

        {message && <div className="message" role="status">{message}</div>}
        <div className="foot">Barba10 • Acesso seguro</div>
      </section>
    </main>
  );
}
