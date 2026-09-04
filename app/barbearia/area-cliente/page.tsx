"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import "../barbershop.css";

export default function AreaClientePage(){
 const [shop,setShop]=useState<{id:string;name:string}|null>(null);
 const [loading,setLoading]=useState(true);
 useEffect(()=>{const load=async()=>{const supabase=createClient();const {data:user}=await supabase.auth.getUser();if(!user){window.location.href="/";return;}const {data}=await supabase.from("barbershops").select("id,name").eq("owner_id",user.user.id).order("created_at",{ascending:false}).limit(1).maybeSingle();setShop(data);setLoading(false)};load()},[]);
 const openClient=()=>{if(shop)window.location.href=`/agendamento?barbershop=${encodeURIComponent(shop.id)}&nome=${encodeURIComponent(shop.name)}`};
 return <main className="barbershop-shell"><header className="barbershop-header"><div className="barbershop-brand"><div className="barbershop-logo">Barba<span>10</span></div><div className="barbershop-divider"/><div className="barbershop-name">{loading?"Carregando...":shop?.name||"Minha Barbearia"}</div></div></header><section className="barbershop-content"><div className="barbershop-welcome"><div><span className="dashboard-kicker">BARBA10 • ÁREA DO CLIENTE</span><h1>Visão Cliente</h1><p>Acesse a experiência de agendamento da sua barbearia.</p></div></div><article className="feature-panel client-access-panel"><div className="feature-icon" aria-hidden="true">V</div><h2>{shop?.name||"Minha Barbearia"}</h2><p>O cliente poderá escolher data, horário, barbeiro e serviços e concluir o agendamento.</p><button type="button" className="primary client-vision-button" disabled={!shop} onClick={openClient}>Visão Cliente</button></article></section></main>;
}
