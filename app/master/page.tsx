"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase";

type Barbershop = {
  id: string;
  name: string;
  responsible_name: string;
  document: string | null;
  whatsapp: string;
  email: string;
  cep: string;
  address: string;
  city: string;
  state: string;
  number: string;
  created_at: string;
};

type CepResponse = { logradouro?: string; localidade?: string; uf?: string; erro?: boolean };

export default function MasterPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [myBarbershopOpen, setMyBarbershopOpen] = useState(false);
  const [visionOpen, setVisionOpen] = useState(false);
  const [barbershopAuthOpen, setBarbershopAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("signup");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"Todas" | "Ativa" | "Inativa">("Todas");
  const [sort, setSort] = useState<"recent" | "name">("recent");
  const [barbershops, setBarbershops] = useState<Barbershop[]>([]);
  const [loadingBarbershops, setLoadingBarbershops] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [authMessage, setAuthMessage] = useState("");
  const [cepLoading, setCepLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    responsibleName: "",
    document: "",
    whatsapp: "",
    email: "",
    cep: "",
    address: "",
    city: "",
    state: "",
    number: "",
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) window.location.href = "/";
    });
  }, []);

  async function loadBarbershops() {
    setLoadingBarbershops(true);
    const supabase = createClient();
    const { data, error } = await supabase.from("barbershops").select("*").order("created_at", { ascending: false });
    if (!error && data) setBarbershops(data as Barbershop[]);
    setLoadingBarbershops(false);
  }

  useEffect(() => {
    loadBarbershops();
  }, []);

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  const filteredBarbershops = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("pt-BR");
    const filtered = barbershops.filter((barbershop) => {
      const searchable = [barbershop.name, barbershop.city, barbershop.state, barbershop.address]
        .join(" ")
        .toLocaleLowerCase("pt-BR");
      return (!term || searchable.includes(term)) && status === "Todas";
    });
    return [...filtered].sort((a, b) =>
      sort === "name" ? a.name.localeCompare(b.name, "pt-BR") : new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
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
    setBarbershopAuthOpen(false);
    setMenuOpen(false);
  }

  function openBarbershopAuth() {
    setBarbershopAuthOpen(true);
    setAuthMode("signup");
    setAuthMessage("");
    setVisionOpen(false);
  }

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function lookupCep() {
    const cep = form.cep.replace(/\D/g, "");
    if (cep.length !== 8) return;
    setCepLoading(true);
    setAuthMessage("");
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = (await response.json()) as CepResponse;
      if (data.erro) {
        setAuthMessage("CEP não encontrado. Confira o número informado.");
      } else {
        setForm((current) => ({
          ...current,
          cep,
          address: data.logradouro || current.address,
          city: data.localidade || current.city,
          state: data.uf || current.state,
        }));
      }
    } catch {
      setAuthMessage("Não foi possível consultar o CEP agora. Você pode preencher o endereço manualmente.");
    } finally {
      setCepLoading(false);
    }
  }

  async function submitBarbershopAuth(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthLoading(true);
    setAuthMessage("");
    const supabase = createClient();

    if (authMode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email: form.email.trim(), password: form.password });
      setAuthLoading(false);
      if (error) {
        setAuthMessage("Não foi possível entrar. Confira seu e-mail e senha.");
        return;
      }
      await loadBarbershops();
      setAuthMessage("Login realizado com sucesso.");
      return;
    }

    if (form.password.length < 6) {
      setAuthLoading(false);
      setAuthMessage("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setAuthLoading(false);
      setAuthMessage("As senhas não conferem.");
      return;
    }
    if (!form.name || !form.responsibleName || !form.whatsapp || !form.email || !form.cep || !form.address || !form.number || !form.city || !form.state) {
      setAuthLoading(false);
      setAuthMessage("Preencha todos os campos obrigatórios.");
      return;
    }

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: form.email.trim(),
      password: form.password,
      options: { data: { full_name: form.responsibleName } },
    });

    if (signUpError || !signUpData.user) {
      setAuthLoading(false);
      setAuthMessage(signUpError?.message || "Não foi possível criar o acesso da barbearia.");
      return;
    }

    if (!signUpData.session) {
      setAuthLoading(false);
      setAuthMessage("Cadastro criado. Confirme o e-mail recebido para ativar o acesso e depois entre pela opção Login.");
      setAuthMode("login");
      return;
    }

    const { error: insertError } = await supabase.from("barbershops").insert({
      owner_id: signUpData.user.id,
      name: form.name.trim(),
      responsible_name: form.responsibleName.trim(),
      document: form.document.trim() || null,
      whatsapp: form.whatsapp.trim(),
      email: form.email.trim(),
      cep: form.cep.trim(),
      address: form.address.trim(),
      city: form.city.trim(),
      state: form.state.trim().toUpperCase(),
      number: form.number.trim(),
    });

    setAuthLoading(false);
    if (insertError) {
      setAuthMessage("O acesso foi criado, mas não foi possível salvar os dados da barbearia. Entre novamente para concluir.");
      return;
    }

    await loadBarbershops();
    setAuthMessage("Barbearia cadastrada com sucesso! Ela já aparece na tela Barbearias.");
    setForm((current) => ({ ...current, password: "", confirmPassword: "" }));
  }

  return (
    <main className="master-shell">
      <header className="master-header">
        <div className="master-brand" aria-label="Barba10 — Painel Master">
          <div className="master-logo">Barba<span>10</span></div>
          <div className="master-slogan">Painel Master</div>
        </div>
        <button className="menu-button" type="button" aria-label={menuOpen ? "Fechar menu" : "Abrir menu"} aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}>
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

      {barbershopAuthOpen ? (
        <section className="barbershop-auth-panel" aria-label="Login e cadastro de barbearias">
          <div className="barbershop-auth-card">
            <button className="back-link" type="button" onClick={() => setBarbershopAuthOpen(false)}>← Voltar</button>
            <div className="auth-heading">
              <span className="vision-kicker">BARBA10 • SUA BARBEARIA</span>
              <h1>{authMode === "signup" ? "Cadastre sua barbearia" : "Login da barbearia"}</h1>
              <p>{authMode === "signup" ? "Crie o acesso da sua barbearia e comece a organizar seus agendamentos." : "Entre para acessar o ambiente da sua barbearia."}</p>
            </div>
            <div className="auth-mode-tabs">
              <button type="button" className={authMode === "signup" ? "active" : ""} onClick={() => { setAuthMode("signup"); setAuthMessage(""); }}>Cadastro</button>
              <button type="button" className={authMode === "login" ? "active" : ""} onClick={() => { setAuthMode("login"); setAuthMessage(""); }}>Login</button>
            </div>
            <form onSubmit={submitBarbershopAuth}>
              {authMode === "signup" ? (
                <>
                  <div className="form-grid">
                    <label className="form-field"><span>Nome da barbearia *</span><input value={form.name} onChange={(e) => updateField("name", e.target.value)} placeholder="Ex.: Barbearia Jadson" /></label>
                    <label className="form-field"><span>Nome do responsável *</span><input value={form.responsibleName} onChange={(e) => updateField("responsibleName", e.target.value)} placeholder="Nome completo" /></label>
                    <label className="form-field"><span>CNPJ ou CPF (opcional)</span><input value={form.document} onChange={(e) => updateField("document", e.target.value)} placeholder="Documento" /></label>
                    <label className="form-field"><span>WhatsApp *</span><input value={form.whatsapp} onChange={(e) => updateField("whatsapp", e.target.value)} placeholder="(00) 00000-0000" /></label>
                    <label className="form-field full"><span>E-mail *</span><input type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} placeholder="barbearia@email.com" /></label>
                    <label className="form-field"><span>CEP *</span><input inputMode="numeric" value={form.cep} onChange={(e) => updateField("cep", e.target.value)} onBlur={lookupCep} placeholder="00000-000" /></label>
                    <div className="cep-action"><button type="button" onClick={lookupCep} disabled={cepLoading}>{cepLoading ? "Buscando..." : "Buscar CEP"}</button></div>
                    <label className="form-field full"><span>Endereço *</span><input value={form.address} onChange={(e) => updateField("address", e.target.value)} placeholder="Rua, avenida..." /></label>
                    <label className="form-field"><span>Número *</span><input value={form.number} onChange={(e) => updateField("number", e.target.value)} placeholder="123" /></label>
                    <label className="form-field"><span>Cidade *</span><input value={form.city} onChange={(e) => updateField("city", e.target.value)} placeholder="Cidade" /></label>
                    <label className="form-field"><span>Estado *</span><input maxLength={2} value={form.state} onChange={(e) => updateField("state", e.target.value.toUpperCase())} placeholder="BA" /></label>
                    <label className="form-field"><span>Senha *</span><input type="password" value={form.password} onChange={(e) => updateField("password", e.target.value)} placeholder="Mínimo de 6 caracteres" /></label>
                    <label className="form-field"><span>Confirmação de senha *</span><input type="password" value={form.confirmPassword} onChange={(e) => updateField("confirmPassword", e.target.value)} placeholder="Repita sua senha" /></label>
                  </div>
                </>
              ) : (
                <div className="login-fields">
                  <label className="form-field"><span>E-mail *</span><input type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} placeholder="barbearia@email.com" /></label>
                  <label className="form-field"><span>Senha *</span><input type="password" value={form.password} onChange={(e) => updateField("password", e.target.value)} placeholder="Sua senha" /></label>
                </div>
              )}
              <button className="auth-submit" type="submit" disabled={authLoading}>{authLoading ? "Processando..." : authMode === "signup" ? "Cadastrar Barbearia" : "Entrar"}</button>
              {authMessage && <div className="auth-feedback" role="status">{authMessage}</div>}
            </form>
          </div>
        </section>
      ) : !visionOpen && myBarbershopOpen ? (
        <section className="barbearias-panel" aria-label="Minha Barbearia">
          <div className="barbearias-header"><div><h1>Minha Barbearia</h1></div></div>
          <div className="my-barbershop-card">
            <div className="my-barbershop-icon" aria-hidden="true">✂</div>
            <h2>Minha Barbearia</h2>
            <p>Conheça a visão do Barba10 para uma gestão mais simples, organizada e profissional da sua barbearia.</p>
            <button className="vision-button" type="button" onClick={() => setVisionOpen(true)}>Visão da barbearia</button>
          </div>
        </section>
      ) : visionOpen ? (
        <section className="barbershop-vision" aria-label="Visão da barbearia">
          <div className="vision-hero">
            <span className="vision-kicker">BARBA10 • GESTÃO INTELIGENTE</span>
            <h1>Sua barbearia merece uma agenda que trabalhe por você.</h1>
            <p>Uma agenda organizada é mais do que marcar horários: é controlar o seu dia, reduzir conflitos e oferecer uma experiência profissional para cada cliente.</p>
            <button className="create-barbershop-button" type="button" onClick={openBarbershopAuth}>Criar Barbearia</button>
          </div>
          <div className="vision-benefits">
            <article><span aria-hidden="true">◷</span><h2>Organize seus agendamentos</h2><p>Tenha os horários centralizados para saber quem chega, quando chega e como está o seu dia.</p></article>
            <article><span aria-hidden="true">✓</span><h2>Evite conflitos de horário</h2><p>Uma gestão digital ajuda a reduzir erros, encaixes desorganizados e horários esquecidos.</p></article>
            <article><span aria-hidden="true">★</span><h2>Valorize a experiência</h2><p>Facilite a jornada do cliente e passe uma imagem de organização, confiança e profissionalismo.</p></article>
          </div>
          <div className="vision-footer-card"><div><h2>Mais controle para você. Mais tranquilidade para sua equipe.</h2><p>Comece sua jornada de gestão com o Barba10 e construa uma rotina mais previsível e eficiente.</p></div><button className="create-barbershop-button secondary" type="button" onClick={openBarbershopAuth}>Criar Barbearia</button></div>
        </section>
      ) : (
        <section className="barbearias-panel" aria-label="Barbearias">
          <div className="barbearias-header"><div><h1>Barbearias</h1></div><span className="barbearias-count" aria-label={`${filteredBarbershops.length} barbearias encontradas`}>{filteredBarbershops.length}</span></div>
          <div className={`barbearias-filters${filtersOpen ? " expanded" : ""}`}>
            <div className="compact-filter-row">
              <label className="smart-search"><span aria-hidden="true">⌕</span><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar barbearia..." aria-label="Buscar barbearia por nome ou localização" />{search && <button type="button" className="clear-search" onClick={() => setSearch("")} aria-label="Limpar busca">×</button>}</label>
              <button className={`filter-toggle${hasFilters ? " active" : ""}`} type="button" aria-expanded={filtersOpen} aria-controls="advanced-filters" aria-label={filtersOpen ? "Minimizar filtros" : "Expandir filtros"} onClick={() => setFiltersOpen((open) => !open)}><span aria-hidden="true">{filtersOpen ? "⌃" : "☷"}</span>{filtersOpen ? "Minimizar" : "Filtros"}{hasFilters && <b>{[status !== "Todas", sort !== "recent"].filter(Boolean).length + (search.trim() ? 1 : 0)}</b>}</button>
            </div>
            {filtersOpen && <div className="filter-controls" id="advanced-filters"><label className="filter-select"><span>Status</span><select value={status} onChange={(event) => setStatus(event.target.value as typeof status)}><option>Todas</option><option>Ativa</option><option>Inativa</option></select></label><label className="filter-select"><span>Ordenar</span><select value={sort} onChange={(event) => setSort(event.target.value as typeof sort)}><option value="recent">Mais recentes</option><option value="name">Nome A–Z</option></select></label>{hasFilters && <button className="clear-filters" type="button" onClick={clearFilters}>Limpar filtros</button>}</div>}
          </div>
          {loadingBarbershops ? <div className="barbearias-empty-filter"><h2>Carregando barbearias...</h2></div> : filteredBarbershops.length === 0 ? <div className="barbearias-empty-filter"><div className="empty-filter-icon" aria-hidden="true">✂</div><h2>{hasFilters ? "Nenhum resultado encontrado" : "Aguardando barbearias"}</h2><p>{hasFilters ? "Ajuste a busca ou os filtros para encontrar uma barbearia." : "Quando uma barbearia for cadastrada, ela aparecerá aqui automaticamente."}</p>{hasFilters && <button className="clear-filters primary" type="button" onClick={clearFilters}>Limpar filtros</button>}</div> : <div className="barbearias-grid">{filteredBarbershops.map((barbershop) => <article className="barbearia-card" key={barbershop.id}><div><h2>{barbershop.name}</h2><p>Número: {barbershop.number} • {barbershop.city} - {barbershop.state}</p></div><span className="status-badge ativa">Ativa</span></article>)}</div>}
        </section>
      )}
    </main>
  );
}
