"use client";

import { FormEvent, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";

type Service = {
  id: string;
  name: string;
  duration_minutes: number;
  price: number;
  active: boolean;
};

function money(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export default function ServicosPanel({ barbershopId }: { barbershopId: string }) {
  const [services, setServices] = useState<Service[]>([]);
  const [name, setName] = useState("");
  const [duration, setDuration] = useState("30");
  const [price, setPrice] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadServices() {
    setLoading(true);
    const { data, error: queryError } = await createClient()
      .from("services")
      .select("id,name,duration_minutes,price,active")
      .eq("barbershop_id", barbershopId)
      .order("active", { ascending: false })
      .order("created_at", { ascending: true });
    if (queryError) setError("Não foi possível carregar os serviços.");
    else setServices((data ?? []) as Service[]);
    setLoading(false);
  }

  useEffect(() => { loadServices(); }, [barbershopId]);

  function resetForm() {
    setName("");
    setDuration("30");
    setPrice("");
    setEditingId(null);
  }

  async function saveService(event: FormEvent) {
    event.preventDefault();
    const cleanName = name.trim();
    const durationMinutes = Number(duration);
    const priceValue = Number(price.replace(",", "."));
    if (!cleanName) { setError("Informe o nome do serviço."); return; }
    if (!Number.isInteger(durationMinutes) || durationMinutes < 5 || durationMinutes > 1440) { setError("A duração deve estar entre 5 e 1440 minutos."); return; }
    if (!Number.isFinite(priceValue) || priceValue < 0) { setError("Informe um valor válido."); return; }
    setSaving(true); setError(""); setMessage("");
    const client = createClient();
    const payload = { name: cleanName, duration_minutes: durationMinutes, price: priceValue };
    const result = editingId
      ? await client.from("services").update(payload).eq("id", editingId).eq("barbershop_id", barbershopId)
      : await client.from("services").insert({ ...payload, barbershop_id: barbershopId });
    if (result.error) { setError("Não foi possível salvar o serviço."); setSaving(false); return; }
    setMessage(editingId ? "Serviço atualizado com sucesso." : "Serviço cadastrado com sucesso.");
    resetForm(); setSaving(false); await loadServices();
  }

  function editService(service: Service) {
    setEditingId(service.id); setName(service.name); setDuration(String(service.duration_minutes)); setPrice(String(service.price)); setMessage(""); setError("");
  }

  async function toggleService(service: Service) {
    setError(""); setMessage("");
    const { error: updateError } = await createClient().from("services").update({ active: !service.active }).eq("id", service.id).eq("barbershop_id", barbershopId);
    if (updateError) setError("Não foi possível alterar o status do serviço.");
    else { setMessage(service.active ? "Serviço desativado." : "Serviço ativado."); await loadServices(); }
  }

  async function deleteService(service: Service) {
    if (!window.confirm(`Excluir o serviço “${service.name}”?`)) return;
    setError(""); setMessage("");
    const { error: deleteError } = await createClient().from("services").delete().eq("id", service.id).eq("barbershop_id", barbershopId);
    if (deleteError) setError("Não foi possível excluir o serviço.");
    else { setMessage("Serviço excluído."); if (editingId === service.id) resetForm(); await loadServices(); }
  }

  return (
    <article className="service-panel feature-panel">
      <div className="service-heading">
        <div><div className="feature-icon" aria-hidden="true">S</div><h2>Serviços</h2><p>Cadastre os serviços reais oferecidos pela sua barbearia.</p></div>
        <div className="service-count">{services.filter((item) => item.active).length} ativos</div>
      </div>
      <form className="service-form" onSubmit={saveService}>
        <div className="service-field service-name-field"><label htmlFor="service-name">Nome do serviço</label><input id="service-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Corte masculino" /></div>
        <div className="service-field"><label htmlFor="service-duration">Duração (min)</label><input id="service-duration" type="number" min="5" max="1440" step="5" value={duration} onChange={(e) => setDuration(e.target.value)} /></div>
        <div className="service-field"><label htmlFor="service-price">Valor (R$)</label><input id="service-price" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="25,00" /></div>
        <div className="service-form-actions"><button className="primary" type="submit" disabled={saving}>{saving ? "Salvando..." : editingId ? "Salvar alterações" : "Cadastrar serviço"}</button>{editingId && <button type="button" onClick={resetForm}>Cancelar</button>}</div>
      </form>
      {error && <div className="service-message error" role="alert">{error}</div>}
      {message && <div className="service-message success">{message}</div>}
      {loading ? <div className="service-empty"><span>…</span><h3>Carregando serviços</h3></div> : services.length === 0 ? <div className="service-empty"><span>✂</span><h3>Nenhum serviço cadastrado</h3><p>Cadastre o primeiro serviço da sua barbearia acima.</p></div> : <div className="service-list">{services.map((service) => <div className={`service-item${service.active ? "" : " inactive"}`} key={service.id}><div className="service-icon">S</div><div className="service-info"><strong>{service.name}</strong><span>{service.duration_minutes} min • {money(Number(service.price))}</span><em>{service.active ? "Ativo" : "Inativo"}</em></div><div className="service-actions"><button type="button" onClick={() => editService(service)}>Editar</button><button type="button" onClick={() => toggleService(service)}>{service.active ? "Desativar" : "Ativar"}</button><button type="button" className="danger" onClick={() => deleteService(service)}>Excluir</button></div></div>)}</div>}
    </article>
  );
}
