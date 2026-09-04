"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";

type Customer={id:string;name:string;whatsapp:string;email:string;created_at:string};

export default function ClientesPanel({barbershopId}:{barbershopId:string}){
 const [customers,setCustomers]=useState<Customer[]>([]);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState("");
 const [query,setQuery]=useState("");
 const load=async()=>{
  setLoading(true);setError("");
  const s=createClient();
  const {data,error:e}=await s.from("customer_profiles").select("id,name,whatsapp,email,created_at").order("name",{ascending:true});
  if(e){setError("Não foi possível carregar os clientes.");setCustomers([])}else setCustomers((data??[]) as Customer[]);
  setLoading(false);
 };
 useEffect(()=>{load()},[barbershopId]);
 const normalized=query.trim().toLocaleLowerCase("pt-BR");
 const filtered=customers.filter(c=>!normalized||c.name.toLocaleLowerCase("pt-BR").includes(normalized)||c.whatsapp.includes(query)||c.email.toLocaleLowerCase("pt-BR").includes(normalized));
 return <article className="feature-panel clients-panel">
  <div className="clients-heading"><div><div className="feature-icon">C</div><h2>Clientes</h2><p>Clientes reais que já possuem vínculo com sua barbearia por meio de agendamentos.</p></div><button type="button" className="primary" onClick={load} disabled={loading}>{loading?"Atualizando...":"Atualizar"}</button></div>
  <div className="clients-toolbar"><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar por nome, WhatsApp ou e-mail" aria-label="Buscar clientes"/><span>{filtered.length} {filtered.length===1?"cliente":"clientes"}</span></div>
  {loading?<div className="booking-empty">Carregando clientes...</div>:error?<div className="service-message error">{error}</div>:filtered.length===0?<div className="booking-empty">{customers.length===0?"Nenhum cliente cadastrado realizou agendamento ainda.":"Nenhum cliente encontrado para esta busca."}</div>:<div className="clients-list">{filtered.map(c=><div className="client-row" key={c.id}><div><strong>{c.name}</strong><span>{c.whatsapp}</span></div><div><span>{c.email}</span><small>Cliente desde {new Date(c.created_at).toLocaleDateString("pt-BR")}</small></div></div>)}</div>}
 </article>;
}
