"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";

export default function MasterPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) {
        window.location.href = "/";
        return;
      }
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).maybeSingle();
      if (profile?.role !== "master") {
        window.location.href = "/";
        return;
      }
      setAuthorized(true);
      setLoading(false);
    });
  }, []);

  async function logout() {
    await createClient().auth.signOut();
    window.location.href = "/";
  }

  if (loading || !authorized) return <main className="master-shell"><div className="master-loading">Carregando...</div></main>;

  return (
    <main className="master-shell">
      <header className="master-header">
        <div className="master-brand">
          <div className="master-logo">Barba<span>10</span></div>
          <div className="master-slogan">Painel Master</div>
        </div>
        <button className="menu-button" type="button" aria-label={menuOpen ? "Fechar menu" : "Abrir menu"} onClick={() => setMenuOpen((value) => !value)}>
          <span /><span /><span />
        </button>
      </header>
      <aside className={`master-sidebar${menuOpen ? " open" : ""}`}>
        <div className="sidebar-content">
          <button className="sidebar-logout" type="button" onClick={logout}>Sair</button>
        </div>
      </aside>
      <section className="master-dashboard">
        <div className="vision-kicker">BARBA10 • ADMINISTRAÇÃO</div>
        <h1>Painel Master</h1>
        <p>Ambiente central de administração do Barba10.</p>
      </section>
    </main>
  );
}
