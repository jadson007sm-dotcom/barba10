"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";

export default function MasterPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [barbeariasOpen, setBarbeariasOpen] = useState(false);
  const [filter, setFilter] = useState("");
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

      <section className="master-content">
        {barbeariasOpen && (
          <section className="barbearias-page" aria-label="Barbearias">
            <div className="barbearias-actions">
              <button className="barbearias-register-button" type="button">
                Cadastrar Barbearia
              </button>
            </div>

            <section className="barbearias-filter-card" aria-label="Filtro de barbearias">
              <div className="barbearias-filter-heading">
                <h1>Barbearias</h1>
                <p>Pesquise entre as barbearias cadastradas.</p>
              </div>

              <label className="barbearias-search-label" htmlFor="barbearias-search">
                Pesquisar
              </label>
              <input
                id="barbearias-search"
                className="barbearias-search-input"
                type="search"
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
                placeholder="Digite o nome da barbearia"
              />
            </section>

            <section className="barbearias-results" aria-live="polite">
              <div className="barbearias-empty-state">
                <h2>Nenhuma barbearia encontrada</h2>
                <p>As barbearias cadastradas aparecerão aqui.</p>
              </div>
            </section>
          </section>
        )}
      </section>

      <aside className={`master-sidebar${menuOpen ? " open" : ""}`} aria-label="Menu lateral">
        <div className="sidebar-content">
          <button
            className="sidebar-menu-button"
            type="button"
            onClick={() => {
              setBarbeariasOpen(true);
              setMenuOpen(false);
            }}
          >
            Barbearias
          </button>
        </div>
      </aside>
    </main>
  );
}
