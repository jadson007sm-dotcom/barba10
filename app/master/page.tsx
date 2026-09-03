"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";

export default function MasterPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) window.location.href = "/";
    });
  }, []);

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <main className="master-shell">
      <header className="master-header">
        <div className="master-brand" aria-label="Barba10 — Painel Master">
          <div className="master-logo">Barba<span>10</span></div>
          <div className="master-slogan">Painel Master</div>
        </div>

        <button
          className="menu-button"
          type="button"
          aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span />
          <span />
          <span />
        </button>
      </header>

      <aside className={`master-sidebar${menuOpen ? " open" : ""}`} aria-hidden={!menuOpen}>
        <div className="sidebar-content">
          <button className="sidebar-logout" onClick={logout} type="button">
            Sair
          </button>
        </div>
      </aside>
    </main>
  );
}
