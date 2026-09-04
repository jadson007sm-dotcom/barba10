"use client";

import { useEffect, useState } from "react";
import "../barbershop.css";
import "./area-cliente.css";
import { createClient } from "@/lib/supabase";

type Shop = { id: string; name: string };

export default function AreaClientePage() {
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { const supabase = createClient(); let mounted = true; (async () => { const { data: userData } = await supabase.auth.getUser(); if (!userData.user) { window.location.href = "/"; return; } const { data } = await supabase.from("barbershops").select("id,name").eq("owner_id", userData.user.id).order("created_at", { ascending:false }).limit(1).maybeSingle(); if (mounted) { setShop(data as Shop | null); setLoading(false); } })(); return () => { mounted = false; }; }, []);
  const openClient = () => { if (shop) window.location.href = `/agendamento?barbershop=${encodeURIComponent(shop.id)}`; };
  return <main className="barbershop-shell"><header className="barbershop-header"><div className="barbershop-brand" aria-label="Barba10"><div className="barbershop-logo">Barba<span>10</span></div><div className="barbershop-divider"/><div className="barbershop-name">{loading ? "Carregando..." : shop?.name || "Minha Barbearia"}</div></div></header><section className="barbershop-content"><div className="barbershop-welcome"><div><span className="dashboard-kicker">BARBA10 • ÁREA DO CLIENTE</span><h1>Visão Cliente</h1><p>Acesso direto ao sistema de agendamento desta barbearia.</p></div></div><article className="feature-panel client-access-panel"><div className="feature-icon" aria-hidden="true">V</div><h2>{shop?.name || "Minha Barbearia"}</h2><p>O botão abaixo abre a experiência que o cliente utilizará para marcar seu atendimento.</p><button type="button" className="primary client-vision-button" onClick={openClient} disabled={!shop}>Visão Cliente</button></article></section></main>;
}
