"use client";

import { FormEvent, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";

type Barber = {
  id: string;
  name: string;
  active: boolean;
};

type Props = {
  barbershopId: string;
};

export default function EquipePanel({ barbershopId }: Props) {
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function loadBarbers() {
    const supabase = createClient();
    setError("");
    const { data, error: queryError } = await supabase
      .from("barbers")
      .select("id,name,active")
      .eq("barbershop_id", barbershopId)
      .order("created_at", { ascending: true });

    if (queryError) {
      setError("Não foi possível carregar a equipe.");
      return;
    }

    setBarbers((data ?? []) as Barber[]);
  }

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      await loadBarbers();
      if (mounted) setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [barbershopId]);

  function resetForm() {
    setEditingId(null);
    setName("");
  }

  async function saveBarber(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) {
      setError("Informe o nome do barbeiro.");
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");
    const supabase = createClient();
    const result = editingId
      ? await supabase.from("barbers").update({ name: cleanName }).eq("id", editingId).eq("barbershop_id", barbershopId)
      : await supabase.from("barbers").insert({ barbershop_id: barbershopId, name: cleanName, active: true });

    if (result.error) {
      setError("Não foi possível salvar o barbeiro.");
      setSaving(false);
      return;
    }

    resetForm();
    setNotice(editingId ? "Barbeiro atualizado." : "Barbeiro cadastrado.");
    await loadBarbers();
    setSaving(false);
  }

  async function toggleBarber(barber: Barber) {
    setError("");
    setNotice("");
    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("barbers")
      .update({ active: !barber.active })
      .eq("id", barber.id)
      .eq("barbershop_id", barbershopId);

    if (updateError) {
      setError("Não foi possível alterar o status do barbeiro.");
      return;
    }

    setNotice(barber.active ? "Barbeiro desativado." : "Barbeiro ativado.");
    await loadBarbers();
  }

  async function deleteBarber(barber: Barber) {
    if (!window.confirm(`Excluir o barbeiro ${barber.name}? Essa ação não pode ser desfeita.`)) return;

    setError("");
    setNotice("");
    const supabase = createClient();
    const { error: deleteError } = await supabase
      .from("barbers")
      .delete()
      .eq("id", barber.id)
      .eq("barbershop_id", barbershopId);

    if (deleteError) {
      setError("Não foi possível excluir o barbeiro.");
      return;
    }

    if (editingId === barber.id) resetForm();
    setNotice("Barbeiro excluído.");
    await loadBarbers();
  }

  function startEdit(barber: Barber) {
    setEditingId(barber.id);
    setName(barber.name);
    setError("");
    setNotice("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (loading) {
    return <article className="feature-panel team-panel"><div className="feature-icon" aria-hidden="true">E</div><h2>Equipe</h2><p>Carregando os barbeiros cadastrados...</p></article>;
  }

  return (
    <article className="feature-panel team-panel">
      <div className="team-heading">
        <div>
          <div className="feature-icon" aria-hidden="true">E</div>
          <h2>Equipe</h2>
          <p>Cadastre e gerencie os barbeiros reais da sua barbearia.</p>
        </div>
        <span className="team-count">{barbers.length} {barbers.length === 1 ? "barbeiro" : "barbeiros"}</span>
      </div>

      <form className="team-form" onSubmit={saveBarber}>
        <label htmlFor="barber-name">Nome do barbeiro</label>
        <div className="team-form-row">
          <input id="barber-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Digite o nome completo" autoComplete="name" disabled={saving} />
          <button className="primary" type="submit" disabled={saving}>{saving ? "Salvando..." : editingId ? "Salvar alteração" : "Cadastrar barbeiro"}</button>
          {editingId && <button type="button" onClick={resetForm} disabled={saving}>Cancelar</button>}
        </div>
      </form>

      {error && <div className="team-message error" role="alert">{error}</div>}
      {notice && <div className="team-message success" role="status">{notice}</div>}

      {barbers.length === 0 ? (
        <div className="team-empty">
          <span>✂</span>
          <h3>Nenhum barbeiro cadastrado</h3>
          <p>Cadastre o primeiro barbeiro da sua equipe acima.</p>
        </div>
      ) : (
        <div className="team-list">
          {barbers.map((barber) => (
            <div className="team-item" key={barber.id}>
              <div className="team-avatar" aria-hidden="true">{barber.name.slice(0, 1).toUpperCase()}</div>
              <div className="team-person"><strong>{barber.name}</strong><span className={barber.active ? "team-active" : "team-inactive"}>{barber.active ? "Ativo" : "Inativo"}</span></div>
              <div className="team-actions">
                <button type="button" onClick={() => startEdit(barber)}>Editar</button>
                <button type="button" onClick={() => toggleBarber(barber)}>{barber.active ? "Desativar" : "Ativar"}</button>
                <button type="button" className="danger" onClick={() => deleteBarber(barber)}>Excluir</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}
