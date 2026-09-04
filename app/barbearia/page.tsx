"use client";

import "./barbershop.css";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase";
import EquipePanel from "./equipe";
import AgendamentosPanel from "./agendamentos";

type Barbershop = {
  id: string;
  name: string;
  responsible_name: string;
  whatsapp: string;
  email: string;
  city: string;
  state: string;
  number: string;
  address: string;
  cep: string;
};

type MenuKey = "inicio" | "agendamentos" | "clientes" | "equipe" | "feed" | "servico" | "horarios" | "estoque" | "configuracoes";

const menuItems: { key: MenuKey; label: string; description: string }[] = [
  { key: "inicio", label: "Início", description: "Visão geral da sua barbearia." },
  { key: "agendamentos", label: "Agendamentos", description: "Controle sua agenda e os próximos atendimentos." },
  { key: "clientes", label: "Clientes", description: "Cadastre e acompanhe seus clientes." },
  { key: "equipe", label: "Equipe", description: "Gerencie barbeiros e permissões da equipe." },
  { key: "feed", label: "Feed", description: "Publique novidades e conteúdos para seus clientes." },
  { key: "servico", label: "Serviço", description: "Cadastre serviços, duração e valores." },
  { key: "horarios", label: "Horários", description: "Defina o funcionamento e os horários disponíveis." },
  { key: "estoque", label: "Estoque", description: "Controle produtos e materiais da barbearia." },
  { key: "configuracoes", label: "Configurações", description: "Ajuste os dados e preferências da barbearia." },
];

export default function BarbershopDashboard() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [active, setActive] = useState<MenuKey>("inicio");
  const [barbershop, setBarbershop] = useState<Barbershop | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const s = createClient();
    let mounted = true;
    (async () => {
      const { data: u } = await s.auth.getUser();
      if (!u.user) {
        window.location.href = "/";
        return;
      }
      const { data } = await s
        .from("barbershops")
        .select("id,name,responsible_name,whatsapp,email,city,state,number,address,cep")
        .eq("owner_id", u.user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (mounted) {
        setBarbershop(data as Barbershop | null);
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  async function logout() {
    await createClient().auth.signOut();
    window.location.href = "/";
  }

  function selectMenu(k: MenuKey) {
    setActive(k);
    setMenuOpen(false);
  }

  const current = useMemo(() => menuItems.find((i) => i.key === active) ?? menuItems[0], [active]);

  const clientArea = () => {
    setMenuOpen(false);
    if (barbershop) window.location.href = `/barbearia/area-cliente?barbershop=${encodeURIComponent(barbershop.id)}`;
  };

  return (
    <main className="barbershop-shell">
      <header className="barbershop-header">
        <div className="barbershop-brand" aria-label="Barba10">
          <div className="barbershop-logo">Barba<span>10</span></div>
          <div className="barbershop-divider" />
          <div className="barbershop-name">{loading ? "Carregando..." : barbershop?.name || "Minha Barbearia"}</div>
        </div>
        <button className="menu-button" type="button" aria-label={menuOpen ? "Fechar menu" : "Abrir menu"} aria-expanded={menuOpen} onClick={() => setMenuOpen((o) => !o)}>
          <span /><span /><span />
        </button>
      </header>

      <aside className={`barbershop-sidebar${menuOpen ? " open" : ""}`} aria-hidden={!menuOpen}>
        <div className="barbershop-sidebar-title">Menu</div>
        <nav className="barbershop-nav" aria-label="Menu da barbearia">
          {menuItems.map((item) => (
            <button key={item.key} type="button" className={`barbershop-nav-item${active === item.key ? " active" : ""}`} onClick={() => selectMenu(item.key)}>
              <span>{item.label}</span>
            </button>
          ))}
          <button type="button" className="barbershop-nav-item client-area-nav" onClick={clientArea}><span>Área do Cliente</span></button>
        </nav>
        <button className="barbershop-nav-item nav-logout" type="button" onClick={logout}><span>Sair</span></button>
      </aside>

      {menuOpen && <button className="barbershop-overlay" aria-label="Fechar menu" type="button" onClick={() => setMenuOpen(false)} />}

      <section className="barbershop-content">
        <div className="barbershop-welcome">
          <div>
            <span className="dashboard-kicker">BARBA10 • PAINEL DA BARBEARIA</span>
            <h1>{active === "inicio" ? `Olá, ${barbershop?.responsible_name?.split(" ")[0] || "seja bem-vindo"}` : current.label}</h1>
            <p>{current.description}</p>
          </div>
          <div className="shop-status"><span /> Ativa</div>
        </div>

        {active === "inicio" ? (
          <>
            <div className="dashboard-cards">
              <article className="dashboard-card"><span>Agendamentos hoje</span><strong>0</strong><p>Nenhum atendimento registrado</p></article>
              <article className="dashboard-card"><span>Clientes</span><strong>0</strong><p>Clientes cadastrados</p></article>
              <article className="dashboard-card"><span>Equipe</span><strong>0</strong><p>Profissionais cadastrados</p></article>
              <article className="dashboard-card"><span>Serviços</span><strong>0</strong><p>Serviços ativos</p></article>
            </div>

            <div className="dashboard-grid">
              <article className="dashboard-panel">
                <div className="panel-heading"><h2>Próximos agendamentos</h2><button type="button" onClick={() => setActive("agendamentos")}>Agendamentos</button></div>
                <div className="dashboard-empty"><span>—</span><h3>Agenda livre</h3><p>Os próximos atendimentos aparecerão aqui.</p></div>
              </article>
              <article className="dashboard-panel">
                <div className="panel-heading"><h2>Acesso rápido</h2></div>
                <div className="quick-actions">
                  <button type="button" onClick={() => setActive("agendamentos")}>Novo agendamento</button>
                  <button type="button" onClick={() => setActive("clientes")}>Novo cliente</button>
                  <button type="button" onClick={() => setActive("servico")}>Novo serviço</button>
                  <button type="button" onClick={() => setActive("horarios")}>Configurar horários</button>
                </div>
              </article>
            </div>

            <article className="dashboard-panel shop-info-panel">
              <div className="panel-heading"><h2>Dados da barbearia</h2><button type="button" onClick={() => setActive("configuracoes")}>Configurações</button></div>
              <div className="shop-info-grid">
                <div><span>Barbearia</span><strong>{barbershop?.name || "—"}</strong></div>
                <div><span>Responsável</span><strong>{barbershop?.responsible_name || "—"}</strong></div>
                <div><span>Endereço</span><strong>{barbershop ? `${barbershop.address}, ${barbershop.number}` : "—"}</strong></div>
                <div><span>Localização</span><strong>{barbershop ? `${barbershop.city} - ${barbershop.state}` : "—"}</strong></div>
                <div><span>WhatsApp</span><strong>{barbershop?.whatsapp || "—"}</strong></div>
                <div><span>CEP</span><strong>{barbershop?.cep || "—"}</strong></div>
              </div>
            </article>
          </>
        ) : active === "equipe" && barbershop ? (
          <EquipePanel barbershopId={barbershop.id} />
        ) : active === "agendamentos" && barbershop ? (
          <AgendamentosPanel barbershopId={barbershop.id} />
        ) : (
          <article className="feature-panel">
            <div className="feature-icon" aria-hidden="true">{current.label.slice(0, 1)}</div>
            <h2>{current.label}</h2>
            <p>{current.description}</p>
            <div className="feature-coming">Área pronta para receber as funções deste módulo.</div>
            <div className="feature-actions">
              <button type="button" onClick={() => setActive("inicio")}>Voltar ao Início</button>
              {active === "agendamentos" && <button type="button" className="primary">Novo agendamento</button>}
              {active === "clientes" && <button type="button" className="primary">Novo cliente</button>}
              {active === "servico" && <button type="button" className="primary">Novo serviço</button>}
            </div>
          </article>
        )}
      </section>
    </main>
  );
}
