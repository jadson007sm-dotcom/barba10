"use client";

import { useEffect, useMemo, useState } from "react";
import "./agendamento.css";
import { createClient } from "@/lib/supabase";
import ClienteMenu from "@/app/cliente/ClienteMenu";

type Step = "date" | "barber" | "time" | "service" | "summary";
type Barber = { id: string; name: string; active: boolean };
type Service = { id: string; name: string; duration_minutes: number; price: number };
const steps: Step[] = ["date", "barber", "time", "service", "summary"];
const stepTitle: Record<Step, string> = { date: "Escolha a data", barber: "Escolha o barbeiro", time: "Escolha o horário", service: "Escolha os serviços", summary: "Resumo do agendamento" };
const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
function toDateKey(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; }
function formatDate(value: string) { if (!value) return ""; const [y, m, d] = value.split("-").map(Number); return new Date(y, m - 1, d).toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" }); }
function money(value: number) { return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value); }
type BookingDraft = { barbershopId: string; barbershopName: string; date: string; time: string; barberId: string; barberName: string; services: string[]; serviceNames: string[]; clientName: string; clientWhatsapp: string };
function isCompleteDraft(draft: BookingDraft) { return Boolean(draft.barbershopId && draft.date && draft.time && draft.barberId && draft.services.length && draft.serviceNames.length); }

export default function ClientBookingPage() {
  const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const barbershopId = params?.get("barbershop") || "";
  const barbershopName = params?.get("nome") || "Sua Barbearia";
  const [step, setStep] = useState<Step>("date");
  const [month, setMonth] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [barber, setBarber] = useState("");
  const [services, setServices] = useState<string[]>([]);
  const [confirmed, setConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [loadingBarbers, setLoadingBarbers] = useState(true);
  const [serviceOptions, setServiceOptions] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!barbershopId) {
        if (mounted) { setLoadingBarbers(false); setLoadingServices(false); setError("Não foi possível identificar a barbearia para o agendamento."); }
        return;
      }
      const client = createClient();
      const [br, sr] = await Promise.all([
        client.from("barbers").select("id,name,active").eq("barbershop_id", barbershopId).eq("active", true).order("created_at", { ascending: true }),
        client.from("services").select("id,name,duration_minutes,price").eq("barbershop_id", barbershopId).eq("active", true).order("name", { ascending: true }),
      ]);
      if (mounted) {
        setBarbers(br.error ? [] : (br.data ?? []) as Barber[]);
        setServiceOptions(sr.error ? [] : (sr.data ?? []) as Service[]);
        setLoadingBarbers(false); setLoadingServices(false);
        if (br.error || sr.error) setError("Não foi possível carregar as opções disponíveis.");
      }
    })();
    return () => { mounted = false; };
  }, [barbershopId]);

  const duration = useMemo(() => serviceOptions.filter((service) => services.includes(service.id)).reduce((sum, service) => sum + service.duration_minutes, 0), [serviceOptions, services]);
  const slotDuration = duration || 30;

  useEffect(() => {
    if (!barbershopId || !date || !barber) { setAvailableSlots([]); return; }
    let mounted = true;
    setLoadingSlots(true);
    setError("");
    (async () => {
      const { data, error: rpcError } = await createClient().rpc("get_available_slots", {
        p_barbershop_id: barbershopId,
        p_date: date,
        p_barber_id: barber,
        p_duration_minutes: slotDuration,
        p_interval_minutes: 30,
      });
      if (mounted) {
        setAvailableSlots(rpcError ? [] : (data ?? []).map((x: { slot_time: string }) => x.slot_time.slice(0, 5)));
        if (rpcError) setError("Não foi possível calcular os horários disponíveis.");
        setLoadingSlots(false);
      }
    })();
    return () => { mounted = false; };
  }, [barbershopId, date, barber, slotDuration]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const calendar = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const last = new Date(month.getFullYear(), month.getMonth() + 1, 0);
    const cells: Date[] = [];
    for (let i = 0; i < first.getDay(); i++) cells.push(new Date(month.getFullYear(), month.getMonth(), -i));
    for (let d = 1; d <= last.getDate(); d++) cells.push(new Date(month.getFullYear(), month.getMonth(), d));
    while (cells.length % 7) cells.push(new Date(month.getFullYear(), month.getMonth() + 1, cells.length - cells.length % 7 + 1));
    return cells;
  }, [month]);

  const selectedServices = serviceOptions.filter((service) => services.includes(service.id));
  const draft = (): BookingDraft => ({ barbershopId, barbershopName, date, time, barberId: barber, barberName: barbers.find((item) => item.id === barber)?.name || "", services, serviceNames: selectedServices.map((item) => item.name), clientName: "", clientWhatsapp: "" });

  const goToCustomerAuth = () => {
    const current = draft();
    if (!isCompleteDraft(current)) { setError("Complete os dados do agendamento antes de confirmar."); return; }
    sessionStorage.setItem("barba10_pending_booking", JSON.stringify(current));
    window.location.href = `/cliente/login?barbershop=${encodeURIComponent(barbershopId)}&nome=${encodeURIComponent(barbershopName)}`;
  };

  const next = () => {
    setError("");
    if (step === "date" && date) setStep("barber");
    else if (step === "barber" && barber) setStep("time");
    else if (step === "time" && time) setStep("service");
    else if (step === "service" && services.length) setStep("summary");
  };
  const back = () => { const index = steps.indexOf(step); if (index > 0) setStep(steps[index - 1]); };
  const toggleService = (id: string) => { setServices((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]); };

  const confirmBooking = async () => {
    if (!barbershopId) { setError("Não foi possível identificar a barbearia."); return; }
    const { data: { user } } = await createClient().auth.getUser();
    if (!user) { goToCustomerAuth(); return; }
    const selected = barbers.find((item) => item.id === barber);
    if (!selected) { setError("Selecione um barbeiro disponível."); return; }
    const valid = serviceOptions.filter((service) => services.includes(service.id));
    if (!valid.length) { setError("Selecione ao menos um serviço disponível."); return; }
    if (!availableSlots.includes(time)) { setError("Esse horário não está mais disponível. Escolha outro."); return; }
    setSaving(true); setError("");
    const supabase = createClient();
    const { data: profile } = await supabase.from("customer_profiles").select("name,whatsapp").eq("id", user.id).maybeSingle();
    if (!profile?.name || !profile?.whatsapp) {
      setSaving(false);
      sessionStorage.setItem("barba10_pending_booking", JSON.stringify(draft()));
      window.location.href = `/cliente/login?barbershop=${encodeURIComponent(barbershopId)}&nome=${encodeURIComponent(barbershopName)}`;
      return;
    }
    const { error: insertError } = await supabase.from("appointments").insert({ barbershop_id: barbershopId, client_id: user.id, barber_id: selected.id, appointment_date: date, appointment_time: time, barber_name: selected.name, service_ids: valid.map((service) => service.id), services: valid.map((service) => service.name), client_name: profile.name, client_whatsapp: profile.whatsapp });
    if (insertError) {
      setError(insertError.message.includes("Horário") || insertError.message.includes("reservado") ? "Esse horário acabou de ser reservado. Escolha outro." : "Não foi possível concluir o agendamento. Tente novamente.");
      setSaving(false); return;
    }
    sessionStorage.removeItem("barba10_pending_booking"); setSaving(false); setConfirmed(true);
  };

  const restart = () => { setStep("date"); setDate(""); setTime(""); setBarber(""); setServices([]); setConfirmed(false); setError(""); };
  const enter = () => { const current = draft(); if (isCompleteDraft(current)) sessionStorage.setItem("barba10_pending_booking", JSON.stringify(current)); else sessionStorage.removeItem("barba10_pending_booking"); window.location.href = `/cliente/login?barbershop=${encodeURIComponent(barbershopId)}&nome=${encodeURIComponent(barbershopName)}`; };

  return <main className="booking-shell">
    <header className="booking-header"><div className="booking-brand">Barba<span>10</span></div><div className="booking-shop-name">{barbershopName}</div><ClienteMenu /></header>
    <section className="booking-content"><div className="booking-progress">{steps.map((item, index) => <span key={item} className={steps.indexOf(step) >= index ? "done" : ""} />)}</div>
      <div className="booking-card"><span className="booking-kicker">AGENDAMENTO</span><h1>{confirmed ? "Agendamento confirmado" : stepTitle[step]}</h1><p className="booking-subtitle">{confirmed ? "Seu agendamento foi registrado com sucesso." : "Horários calculados conforme funcionamento, duração do serviço e disponibilidade do barbeiro."}</p>
        {!confirmed && step === "date" && <div className="calendar"><div className="calendar-nav"><button type="button" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} disabled={month <= new Date(today.getFullYear(), today.getMonth(), 1)}>‹</button><strong>{monthNames[month.getMonth()]} {month.getFullYear()}</strong><button type="button" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}>›</button></div><div className="weekdays">{["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day) => <span key={day}>{day}</span>)}</div><div className="calendar-grid">{calendar.map((day, index) => { const current = day.getMonth() === month.getMonth(); const past = day < today; const key = toDateKey(day); return <button key={`${key}-${index}`} type="button" disabled={!current || past} className={`${date === key ? "selected " : ""}${!current ? "muted " : ""}`} onClick={() => setDate(key)}>{day.getDate()}</button>; })}</div></div>}
        {!confirmed && step === "barber" && (loadingBarbers ? <div className="booking-empty">Carregando barbeiros disponíveis...</div> : barbers.length === 0 ? <div className="booking-empty">Nenhum barbeiro ativo está disponível no momento.</div> : <div className="choice-grid">{barbers.map((item) => <button key={item.id} type="button" className={barber === item.id ? "selected" : ""} onClick={() => { setBarber(item.id); setTime(""); }}>{item.name}</button>)}</div>)}
        {!confirmed && step === "time" && (loadingSlots ? <div className="booking-empty">Calculando horários disponíveis...</div> : availableSlots.length === 0 ? <div className="booking-empty">Nenhum horário disponível para este barbeiro e data. Volte e escolha outra opção.</div> : <div className="choice-grid">{availableSlots.map((item) => <button key={item} type="button" className={time === item ? "selected" : ""} onClick={() => setTime(item)}>{item}</button>)}</div>)}
        {!confirmed && step === "service" && (loadingServices ? <div className="booking-empty">Carregando serviços disponíveis...</div> : serviceOptions.length === 0 ? <div className="booking-empty">Nenhum serviço ativo está disponível no momento.</div> : <div className="choice-grid service-choice-grid">{serviceOptions.map((item) => <button key={item.id} type="button" className={services.includes(item.id) ? "selected" : ""} onClick={() => toggleService(item.id)}><strong>{services.includes(item.id) ? "✓ " : ""}{item.name}</strong><small>{item.duration_minutes} min • {money(Number(item.price))}</small></button>)}</div>)}
        {!confirmed && step === "summary" && <div className="summary"><div><span>Barbearia</span><strong>{barbershopName}</strong></div><div><span>Data</span><strong>{formatDate(date)}</strong></div><div><span>Horário</span><strong>{time}</strong></div><div><span>Barbeiro</span><strong>{barbers.find((item) => item.id === barber)?.name || "—"}</strong></div><div><span>Serviços</span><strong>{selectedServices.map((service) => `${service.name} (${service.duration_minutes} min • ${money(Number(service.price))})`).join(", ")}</strong></div><button className="confirm" type="button" onClick={confirmBooking} disabled={saving}>{saving ? "Salvando..." : "Confirmar agendamento"}</button><p className="booking-auth-note">Para confirmar, você precisa entrar ou criar sua conta de cliente.</p></div>}
        {error && <div className="booking-error" role="alert">{error}</div>}
        {confirmed && <button className="primary" type="button" onClick={restart}>Voltar ao calendário</button>}
        {!confirmed && <div className="booking-actions">{step !== "date" && <button className="secondary" type="button" onClick={back}>Voltar</button>}{step !== "summary" && <button className="primary" type="button" onClick={next} disabled={(step === "date" && !date) || (step === "barber" && (!barber || !barbers.length)) || (step === "time" && !time) || (step === "service" && (!services.length || !serviceOptions.length))}>Continuar</button>}</div>}
      </div>
    </section>
  </main>;
}
