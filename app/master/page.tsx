"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";

export default function MasterPage() {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) window.location.href = "/";
      else setEmail(data.user.email ?? null);
    });
  }, []);

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <div className="brand">
          <div className="brand-mark">Barba<span>10</span></div>
          <p>Painel Master</p>
        </div>
        <p style={{ color: "#d5d5d9", textAlign: "center" }}>
          Acesso autorizado{email ? ` para ${email}` : ""}.
        </p>
        <button className="submit" onClick={logout} type="button">Sair</button>
      </section>
    </main>
  );
}
