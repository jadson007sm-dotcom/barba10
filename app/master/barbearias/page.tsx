"use client";

import { useMemo, useState } from "react";

export default function BarbeariasPage() {
  const [filter, setFilter] = useState("");

  const filteredBarbearias = useMemo(() => {
    return [] as string[];
  }, [filter]);

  return (
    <main className="master-shell">
      <header className="master-header">
        <div className="master-brand">
          <div className="master-logo">Barba<span>10</span></div>
          <div className="master-slogan">Painel Master</div>
        </div>
      </header>

      <section className="barbearias-page">
        <div className="barbearias-page-title">
          <h1>Barbearias</h1>
        </div>

        <div className="barbearias-actions">
          <button className="barbearias-register-button" type="button">
            Cadastrar Barbearia
          </button>
        </div>

        <section className="barbearias-filter-card" aria-label="Filtro de barbearias">
          <div className="barbearias-filter-heading">
            <h2>Pesquisar barbearia</h2>
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
          {filteredBarbearias.length === 0 ? (
            <div className="barbearias-empty-state">
              <h2>Nenhuma barbearia encontrada</h2>
              <p>As barbearias cadastradas aparecerão aqui.</p>
            </div>
          ) : (
            filteredBarbearias.map((barbearia) => (
              <article key={barbearia} className="barbearia-card">
                {barbearia}
              </article>
            ))
          )}
        </section>
      </section>
    </main>
  );
}
