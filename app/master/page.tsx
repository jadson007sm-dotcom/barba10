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
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [myBarbershopOpen, setMyBarbershopOpen] = useState(false);
  const [visionOpen, setVisionOpen] = useState(false);
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

  const barbershops: Barbershop[] = [];

  const filteredBarbershops = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("pt-BR");
    const filtered = barbershops.filter((barbershop) => {
      const searchable = [barbershop.name, barbershop.city, barbershop.neighborhood]
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

  function openMyBarbershop() {
    setMyBarbershopOpen(true);
    setVisionOpen(false);
    setMenuOpen(false);
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
          <span /><span /><span />
        </button>
      </header>

      <aside className={`master-sidebar${menuOpen ? " open" : ""}`} aria-hidden={!menuOpen}>
        <div className="sidebar-content">
          <button className="sidebar-logout" type="button" onClick={() => setMenuOpen(false)}>Barbearias</button>
          <button className="sidebar-logout" type="button" onClick={openMyBarbershop}>Minha Barbearia</button>
          <button className="sidebar-logout" onClick={logout} type="button">Sair</button>
        </div>
      </aside>

      {!visionOpen && myBarbershopOpen ? (
        <section className="barbearias-panel" aria-label="Minha Barbearia">
          <div className="barbearias-header">
            <div><h1>Minha Barbearia</h1></div>
          </div>
          <div className="my-barbershop-card">
            <div className="my-barbershop-icon" aria-hidden="true">✂</div>
            <h2>Minha Barbearia</h2>
            <p>Conheça a visão do Barba10 para uma gestão mais simples, organizada e profissional da sua barbearia.</p>
            <button className="vision-button" type="button" onClick={() => setVisionOpen(true)}>
              Visão da barbearia
            </button>
          </div>
        </section>
      ) : visionOpen ? (
        <section className="barbershop-vision" aria-label="Visão da barbearia">
          <div className="vision-hero">
            <span className="vision-kicker">BARBA10 • GESTÃO INTELIGENTE</span>
            <h1>Sua barbearia merece uma agenda que trabalhe por você.</h1>
            <p>Uma agenda organizada é mais do que marcar horários: é controlar o seu dia, reduzir conflitos e oferecer uma experiência profissional para cada cliente.</p>
            <button className="create-barbershop-button" type="button">Criar Barbearia</button>
          </div>

          <div className="vision-benefits">
            <article>
              <span aria-hidden="true">◷</span>
              <h2>Organize seus agendamentos</h2>
              <p>Tenha os horários centralizados para saber quem chega, quando chega e como está o seu dia.</p>
            </article>
            <article>
              <span aria-hidden="true">✓</span>
              <h2>Evite conflitos de horário</h2>
              <p>Uma gestão digital ajuda a reduzir erros, encaixes desorganizados e horários esquecidos.</p>
            </article>
            <article>
              <span aria-hidden="true">★</span>
              <h2>Valorize a experiência</h2>
              <p>Facilite a jornada do cliente e passe uma imagem de organização, confiança e profissionalismo.</p>
            </article>
          </div>

          <div className="vision-footer-card">
            <h2>Mais controle para você. Mais tranquilidade para sua equipe.</h2>
            <p>Comece sua jornada de gestão com o Barba10 e construa uma rotina mais previsível e eficiente.</p>
            <button className="create-barbershop-button secondary" type="button">Criar Barbearia</button>
          </div>
        </section>
      ) : (
        <section className="barbearias-panel" aria-label="Barbearias">
          <div className="barbearias-header">
            <div><h1>Barbearias</h1></div>
            <span className="barbearias-count" aria-label={`${filteredBarbershops.length} barbearias encontradas`}>
              {filteredBarbershops.length}
            </span>
          </div>

          <div className={`barbearias-filters${filtersOpen ? " expanded" : ""}`}>
            <div className="compact-filter-row">
              <label className="smart-search">
                <span aria-hidden="true">⌕</span>
                <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar barbearia..." aria-label="Buscar barbearia por nome, cidade ou bairro" />
                {search && <button type="button" className="clear-search" onClick={() => setSearch("")} aria-label="Limpar busca">×</button>}
              </label>
              <button className={`filter-toggle${hasFilters ? " active" : ""}`} type="button" aria-expanded={filtersOpen} aria-controls="advanced-filters" aria-label={filtersOpen ? "Minimizar filtros" : "Expandir filtros"} onClick={() => setFiltersOpen((open) => !open)}>
                <span aria-hidden="true">{filtersOpen ? "⌃" : "☷"}</span>
                {filtersOpen ? "Minimizar" : "Filtros"}
                {hasFilters && <b>{[status !== "Todas", sort !== "recent"].filter(Boolean).length + (search.trim() ? 1 : 0)}</b>}
              </button>
            </div>
            {filtersOpen && (
              <div className="filter-controls" id="advanced-filters">
                <label className="filter-select"><span>Status</span><select value={status} onChange={(event) => setStatus(event.target.value as typeof status)}><option>Todas</option><option>Ativa</option><option>Inativa</option></select></label>
                <label className="filter-select"><span>Ordenar</span><select value={sort} onChange={(event) => setSort(event.target.value as typeof sort)}><option value="recent">Mais recentes</option><option value="name">Nome A–Z</option></select></label>
                {hasFilters && <button className="clear-filters" type="button" onClick={clearFilters}>Limpar filtros</button>}
              </div>
            )}
          </div>

          {filteredBarbershops.length === 0 && (
            <div className="barbearias-empty-filter">
              <div className="empty-filter-icon" aria-hidden="true">⌕</div>
              <h2>{hasFilters ? "Nenhum resultado encontrado" : "Aguardando barbearias"}</h2>
              <p>{hasFilters ? "Ajuste a busca ou os filtros para encontrar uma barbearia." : "Quando uma barbearia real for cadastrada, ela aparecerá aqui automaticamente."}</p>
              {hasFilters && <button className="clear-filters primary" type="button" onClick={clearFilters}>Limpar filtros</button>}
            </div>
          )}

          {filteredBarbershops.length > 0 && (
            <div className="barbearias-grid">
              {filteredBarbershops.map((barbershop) => (
                <article className="barbearia-card" key={barbershop.id}>
                  <div><h2>{barbershop.name}</h2><p>{barbershop.neighborhood} • {barbershop.city}</p></div>
                  <span className={`status-badge ${barbershop.status.toLowerCase()}`}>{barbershop.status}</span>
                </article>
              ))}
            </div>
          )}
        </section>
      )}
    </main>
  );
}
