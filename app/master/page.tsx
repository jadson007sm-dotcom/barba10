"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase";

type Barbershop = {
  id: string;
  name: string;
  city: string;
  neighborhood: string;
  status: "Ativa" | "Inativa";
};

export default function MasterPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"Todas" | "Ativa" | "Inativa">("Todas");
  const [sort, setSort] = useState<"recent" | "name">("recent");

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

  // A lista permanece vazia até existirem barbearias reais no sistema.
  const barbershops: Barbershop[] = [];

  const filteredBarbershops = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("pt-BR");
    const filtered = barbershops.filter((barbershop) => {
      const searchable = [
        barbershop.name,
        barbershop.city,
        barbershop.neighborhood,
      ]
        .join(" ")
        .toLocaleLowerCase("pt-BR");

      const matchesSearch = !term || searchable.includes(term);
      const matchesStatus = status === "Todas" || barbershop.status === status;
      return matchesSearch && matchesStatus;
    });

    return [...filtered].sort((a, b) =>
      sort === "name" ? a.name.localeCompare(b.name, "pt-BR") : 0,
    );
  }, [barbershops, search, sort, status]);

  const hasFilters = Boolean(search.trim()) || status !== "Todas" || sort !== "recent";

  function clearFilters() {
    setSearch("");
    setStatus("Todas");
    setSort("recent");
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
          <button className="sidebar-logout" type="button" onClick={() => setMenuOpen(false)}>
            Barbearias
          </button>
          <button className="sidebar-logout" onClick={logout} type="button">
            Sair
          </button>
        </div>
      </aside>

      <section className="barbearias-panel" aria-label="Barbearias">
        <div className="barbearias-header">
          <div>
            <h1>Barbearias</h1>
          </div>
          <span className="barbearias-count" aria-label={`${filteredBarbershops.length} barbearias encontradas`}>
            {filteredBarbershops.length}
          </span>
        </div>

        <div className="barbearias-filters">
          <label className="smart-search">
            <span aria-hidden="true">⌕</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nome, cidade ou bairro..."
              aria-label="Buscar barbearia por nome, cidade ou bairro"
            />
            {search && (
              <button type="button" className="clear-search" onClick={() => setSearch("")} aria-label="Limpar busca">
                ×
              </button>
            )}
          </label>

          <div className="filter-controls">
            <label className="filter-select">
              <span>Status</span>
              <select value={status} onChange={(event) => setStatus(event.target.value as typeof status)}>
                <option>Todas</option>
                <option>Ativa</option>
                <option>Inativa</option>
              </select>
            </label>

            <label className="filter-select">
              <span>Ordenar</span>
              <select value={sort} onChange={(event) => setSort(event.target.value as typeof sort)}>
                <option value="recent">Mais recentes</option>
                <option value="name">Nome A–Z</option>
              </select>
            </label>

            {hasFilters && (
              <button className="clear-filters" type="button" onClick={clearFilters}>
                Limpar filtros
              </button>
            )}
          </div>
        </div>

        {filteredBarbershops.length === 0 && (
          <div className="barbearias-empty-filter">
            <div className="empty-filter-icon" aria-hidden="true">⌕</div>
            <h2>{hasFilters ? "Nenhum resultado encontrado" : "Aguardando barbearias"}</h2>
            <p>
              {hasFilters
                ? "Ajuste a busca ou os filtros para encontrar uma barbearia."
                : "Quando uma barbearia real for cadastrada, ela aparecerá aqui automaticamente."}
            </p>
            {hasFilters && (
              <button className="clear-filters primary" type="button" onClick={clearFilters}>
                Limpar filtros
              </button>
            )}
          </div>
        )}

        {filteredBarbershops.length > 0 && (
          <div className="barbearias-grid">
            {filteredBarbershops.map((barbershop) => (
              <article className="barbearia-card" key={barbershop.id}>
                <div>
                  <h2>{barbershop.name}</h2>
                  <p>{barbershop.neighborhood} • {barbershop.city}</p>
                </div>
                <span className={`status-badge ${barbershop.status.toLowerCase()}`}>{barbershop.status}</span>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
