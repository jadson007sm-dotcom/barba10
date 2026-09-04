"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase";

type Appointment = {
  id: string;
  appointment_date: string;
  appointment_time: string;
  barber_name: string;
  services: string[] | null;
  client_name: string;
  client_whatsapp: string;
  status: "pending" | "confirmed" | "cancelled" | "completed";
};

type Props = { barbershopId: string };

const statusLabel: Record<Appointment["status"], string> = {
  pending: "Pendente",
  confirmed: "Confirmado",
  cancelled: "Cancelado",
  completed: "Concluído",
};

function formatDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  });
}

export default function AgendamentosPanel({ barbershopId }: Props) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadAppointments() {
    setError("");
    const { data, error: queryError } = await createClient()
      .from("appointments")
      .select("id,appointment_date,appointment_time,barber_name,services,client_name,client_whatsapp,status")
      .eq("barbershop_id", barbershopId)
      .order("appointment_date", { ascending: true })
      .order("appointment_time", { ascending: true });

    if (queryError) {
      setError("Não foi possível carregar os agendamentos.");
      return;
    }

    setAppointments((data ?? []) as Appointment[]);
  }

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      await loadAppointments();
      if (mounted) setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [barbershopId]);

  const todayKey = useMemo(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  }, []);

  const upcoming = appointments.filter((item) => item.appointment_date >= todayKey && item.status !== "cancelled");
  const past = appointments.filter((item) => item.appointment_date < todayKey || item.status === "cancelled");

  if (loading) {
    return <article className="feature-panel appointment-panel"><div className="feature-icon" aria-hidden="true">A</div><h2>Agendamentos</h2><p>Carregando os atendimentos...</p></article>;
  }

  return (
    <article className="feature-panel appointment-panel">
      <div className="appointment-heading">
        <div>
          <div className="feature-icon" aria-hidden="true">A</div>
          <h2>Agendamentos</h2>
          <p>Os agendamentos feitos pelos clientes aparecem automaticamente aqui.</p>
        </div>
        <span className="team-count">{upcoming.length} {upcoming.length === 1 ? "próximo" : "próximos"}</span>
      </div>

      {error && <div className="team-message error" role="alert">{error}</div>}

      {upcoming.length === 0 ? (
        <div className="team-empty">
          <span>—</span>
          <h3>Nenhum agendamento próximo</h3>
          <p>Quando um cliente confirmar um horário, ele aparecerá nesta área.</p>
        </div>
      ) : (
        <div className="appointment-list">
          {upcoming.map((appointment) => (
            <div className="appointment-item" key={appointment.id}>
              <div className="appointment-date"><strong>{appointment.appointment_time.slice(0, 5)}</strong><span>{formatDate(appointment.appointment_date)}</span></div>
              <div className="appointment-client"><strong>{appointment.client_name}</strong><span>{appointment.barber_name} • {(appointment.services ?? []).join(", ") || "Serviço não informado"}</span><span>{appointment.client_whatsapp}</span></div>
              <span className={`appointment-status status-${appointment.status}`}>{statusLabel[appointment.status]}</span>
            </div>
          ))}
        </div>
      )}

      {past.length > 0 && (
        <details className="appointment-history">
          <summary>Ver histórico ({past.length})</summary>
          <div className="appointment-list">
            {past.map((appointment) => (
              <div className="appointment-item" key={appointment.id}>
                <div className="appointment-date"><strong>{appointment.appointment_time.slice(0, 5)}</strong><span>{formatDate(appointment.appointment_date)}</span></div>
                <div className="appointment-client"><strong>{appointment.client_name}</strong><span>{appointment.barber_name} • {(appointment.services ?? []).join(", ") || "Serviço não informado"}</span></div>
                <span className={`appointment-status status-${appointment.status}`}>{statusLabel[appointment.status]}</span>
              </div>
            ))}
          </div>
        </details>
      )}
    </article>
  );
}
