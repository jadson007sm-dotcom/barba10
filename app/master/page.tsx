"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";

export default function MasterPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) window.location.href = "/";
    });
  }, [supabase]);

  return (
    <main className="master-shell">
      <header className="master-header">
        <div className="master-brand">
          <div className="master-logo">Barba<span>10</span></div>
          <div className="master-slogan">Painel Master</div>
        </div>

        <button
          className="menu-button"
          type="button"
          aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((value) => !value)}
        >
          <span />
          <span />
          <span />
        </button>
      </header>

      <aside className={`master-sidebar${menuOpen ? " open" : ""}`} aria-label="Menu lateral">
        <div className="sidebar-content">
          <button
            className="sidebar-menu-button"
            type="button"
            onClick={() => {
              setMenuOpen(false);
              window.location.href = "/master/barbearias";
            }}
          >
            Barbearias
          </button>
        </div>
      </aside>
    </main>
  );
}
