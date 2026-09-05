"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type PowerTenant = {
  id: string;
  name: string;
  slug: string;
  status: string;
  created_at: string;
  owner_user_id: string;
  owner_name: string | null;
  owner_phone: string | null;
  member_count: number;
};

export type PowerMember = {
  id: string;
  tenant_id: string;
  user_id: string;
  role: string;
  tenant_name: string;
  user_name: string | null;
};

export type PowerAudit = {
  id: string;
  action: string;
  target_type: string;
  target_id: string | null;
  created_at: string;
  metadata: Record<string, unknown>;
};

const statusLabel: Record<string, string> = { active: "Ativa", trial: "Teste", suspended: "Bloqueada", cancelled: "Cancelada" };

export function PowerAdmin({ tenants, members, audits }: { tenants: PowerTenant[]; members: PowerMember[]; audits: PowerAudit[] }) {
  const [tab, setTab] = useState<"overview" | "tenants" | "owners" | "permissions" | "audit">("overview");
  const [filter, setFilter] = useState("");
  const [status, setStatus] = useState("all");
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const supabase = useMemo(() => createClient(), []);

  const filtered = tenants.filter((t) => {
    const q = filter.toLowerCase().trim();
    const matches = !q || t.name.toLowerCase().includes(q) || t.slug.toLowerCase().includes(q) || (t.owner_name ?? "").toLowerCase().includes(q);
    return matches && (status === "all" || t.status === status);
  });

  async function changeStatus(id: string, next: "active" | "suspended") {
    const verb = next === "suspended" ? "bloquear" : "ativar";
    if (!window.confirm(`Confirma ${verb} esta barbearia?`)) return;
    setBusy(id); setMessage("");
    const { error } = await supabase.rpc("power_set_tenant_status", { p_tenant_id: id, p_status: next });
    if (error) setMessage(error.message);
    else window.location.reload();
    setBusy(null);
  }

  async function changeRole(id: string, role: "barbershop_owner" | "barbershop_manager" | "barber" | "customer") {
    setBusy(id); setMessage("");
    const { error } = await supabase.rpc("power_set_member_role", { p_membership_id: id, p_role: role });
    if (error) setMessage(error.message);
    else window.location.reload();
    setBusy(null);
  }

  const active = tenants.filter((t) => t.status === "active").length;
  const trial = tenants.filter((t) => t.status === "trial").length;
  const blocked = tenants.filter((t) => t.status === "suspended" || t.status === "cancelled").length;

  return (
    <div className="min-h-screen bg-[#070707] text-white">
      <header className="sticky top-0 z-30 border-b border-zinc-900 bg-black/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between px-4 py-4 sm:px-7">
          <div><p className="text-[10px] font-bold uppercase tracking-[0.35em] text-[#D4AF37]">BARBA10</p><h1 className="text-xl font-semibold">Power</h1></div>
          <a href="/" className="rounded-xl border border-zinc-800 px-3 py-2 text-xs text-zinc-400 hover:bg-zinc-900">Landing</a>
        </div>
      </header>
      <div className="mx-auto flex max-w-[1500px]">
        <aside className="hidden min-h-[calc(100vh-73px)] w-60 shrink-0 border-r border-zinc-900 bg-black px-3 py-5 lg:block">
          <nav className="space-y-1">
            {[["overview","Visão geral"],["tenants","Barbearias"],["owners","Proprietários"],["permissions","Permissões"],["audit","Auditoria"]].map(([id,label]) => (
              <button key={id} onClick={() => setTab(id as typeof tab)} className={`w-full rounded-xl px-4 py-3 text-left text-sm ${tab === id ? "bg-[#D4AF37]/10 text-[#D4AF37]" : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-200"}`}>{label}</button>
            ))}
          </nav>
        </aside>
        <main className="min-w-0 flex-1 px-4 py-5 pb-12 sm:px-7 lg:px-10">
          <div className="mb-5 flex gap-2 overflow-x-auto lg:hidden">
            {[["overview","Visão geral"],["tenants","Barbearias"],["owners","Proprietários"],["permissions","Permissões"],["audit","Auditoria"]].map(([id,label]) => <button key={id} onClick={() => setTab(id as typeof tab)} className={`whitespace-nowrap rounded-xl border px-3 py-2 text-xs ${tab === id ? "border-[#D4AF37]/40 text-[#D4AF37]" : "border-zinc-800 text-zinc-500"}`}>{label}</button>)}
          </div>
          {message && <div className="mb-5 rounded-xl border border-red-900/60 bg-red-950/30 px-4 py-3 text-sm text-red-300">{message}</div>}

          {tab === "overview" && <>
            <div className="mb-7"><p className="text-xs uppercase tracking-[0.25em] text-zinc-600">Operação SaaS</p><h2 className="mt-1 text-3xl font-semibold">Visão geral</h2><p className="mt-2 text-sm text-zinc-500">Dados reais da plataforma, sem registros fictícios.</p></div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[['Barbearias', tenants.length], ['Ativas', active], ['Em teste', trial], ['Bloqueadas', blocked]].map(([label,value]) => <div key={String(label)} className="rounded-2xl border border-zinc-900 bg-zinc-950 p-5"><p className="text-xs text-zinc-500">{label}</p><p className="mt-2 text-3xl font-semibold">{value}</p></div>)}
            </div>
            <div className="mt-6 grid gap-5 xl:grid-cols-2">
              <section className="rounded-2xl border border-zinc-900 bg-zinc-950 p-5"><h3 className="font-semibold">Cadastros recentes</h3><div className="mt-4 space-y-3">{tenants.slice(0,5).map(t => <div key={t.id} className="flex items-center justify-between border-b border-zinc-900 pb-3"><div><p className="text-sm font-medium">{t.name}</p><p className="text-xs text-zinc-600">{t.slug}.barba10.com</p></div><span className="text-xs text-zinc-500">{new Date(t.created_at).toLocaleDateString('pt-BR')}</span></div>)}{!tenants.length && <p className="py-6 text-sm text-zinc-600">Nenhuma barbearia cadastrada.</p>}</div></section>
              <section className="rounded-2xl border border-zinc-900 bg-zinc-950 p-5"><h3 className="font-semibold">Acesso comercial</h3><p className="mt-2 text-sm text-zinc-500">O funil da Landing Page permanece disponível no painel de aquisição.</p><a href="/?from=power" className="mt-5 inline-flex rounded-xl border border-zinc-800 px-4 py-2 text-sm text-zinc-300">Abrir Landing Page</a></section>
            </div>
          </>}

          {tab === "tenants" && <section><div className="mb-5"><h2 className="text-3xl font-semibold">Barbearias</h2><p className="mt-2 text-sm text-zinc-500">Gerencie somente tenants reais.</p></div><div className="mb-4 grid gap-2 sm:grid-cols-[1fr_180px]"><input className="input" placeholder="Buscar por nome, subdomínio ou proprietário" value={filter} onChange={e=>setFilter(e.target.value)} /><select className="input" value={status} onChange={e=>setStatus(e.target.value)}><option value="all">Todos os status</option><option value="trial">Teste</option><option value="active">Ativas</option><option value="suspended">Bloqueadas</option><option value="cancelled">Canceladas</option></select></div><div className="overflow-x-auto rounded-2xl border border-zinc-900"><table className="w-full min-w-[850px] text-left text-sm"><thead className="bg-zinc-950 text-zinc-600"><tr><th className="p-4">Barbearia</th><th className="p-4">Proprietário</th><th className="p-4">Equipe</th><th className="p-4">Status</th><th className="p-4">Ação</th></tr></thead><tbody>{filtered.map(t=><tr key={t.id} className="border-t border-zinc-900"><td className="p-4"><p className="font-medium">{t.name}</p><p className="text-xs text-zinc-600">{t.slug}.barba10.com</p></td><td className="p-4">{t.owner_name || '—'}<p className="text-xs text-zinc-600">{t.owner_phone || 'Sem telefone'}</p></td><td className="p-4 text-zinc-400">{t.member_count}</td><td className="p-4"><span className="rounded-full border border-zinc-800 px-2.5 py-1 text-xs text-zinc-400">{statusLabel[t.status] || t.status}</span></td><td className="p-4">{t.status === 'suspended' ? <button disabled={busy===t.id} onClick={()=>changeStatus(t.id,'active')} className="text-xs text-emerald-400 disabled:opacity-40">Ativar</button> : t.status === 'active' || t.status === 'trial' ? <button disabled={busy===t.id} onClick={()=>changeStatus(t.id,'suspended')} className="text-xs text-red-400 disabled:opacity-40">Bloquear</button> : <span className="text-xs text-zinc-600">Sem ação</span>}</td></tr>)}{!filtered.length&&<tr><td colSpan={5} className="p-10 text-center text-zinc-600">Nenhum resultado.</td></tr>}</tbody></table></div></section>}

          {tab === "owners" && <section><h2 className="text-3xl font-semibold">Proprietários</h2><p className="mt-2 text-sm text-zinc-500">Responsáveis vinculados às barbearias.</p><div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{tenants.map(t=><article key={t.id} className="rounded-2xl border border-zinc-900 bg-zinc-950 p-5"><p className="text-xs uppercase tracking-wider text-[#D4AF37]">Proprietário</p><h3 className="mt-2 font-semibold">{t.owner_name || 'Sem nome'}</h3><p className="mt-1 text-sm text-zinc-500">{t.name}</p><p className="mt-3 text-xs text-zinc-600">{t.owner_phone || 'Telefone não informado'}</p><p className="mt-1 text-xs text-zinc-600">{t.owner_user_id}</p></article>)}{!tenants.length&&<p className="text-sm text-zinc-600">Nenhum proprietário cadastrado.</p>}</div></section>}

          {tab === "permissions" && <section><h2 className="text-3xl font-semibold">Permissões</h2><p className="mt-2 text-sm text-zinc-500">Controle de funções por vínculo. Super Admin não pode ser atribuído como função de tenant.</p><div className="mt-5 overflow-x-auto rounded-2xl border border-zinc-900"><table className="w-full min-w-[780px] text-left text-sm"><thead className="bg-zinc-950 text-zinc-600"><tr><th className="p-4">Usuário</th><th className="p-4">Barbearia</th><th className="p-4">Função</th><th className="p-4">Alterar</th></tr></thead><tbody>{members.map(m=><tr key={m.id} className="border-t border-zinc-900"><td className="p-4">{m.user_name || m.user_id}</td><td className="p-4">{m.tenant_name}</td><td className="p-4 text-zinc-400">{m.role}</td><td className="p-4"><select disabled={busy===m.id} value={m.role} onChange={e=>changeRole(m.id,e.target.value as never)} className="rounded-lg border border-zinc-800 bg-black px-3 py-2 text-xs"><option value="barbershop_owner">Proprietário</option><option value="barbershop_manager">Gerente</option><option value="barber">Barbeiro</option><option value="customer">Cliente</option></select></td></tr>)}{!members.length&&<tr><td colSpan={4} className="p-10 text-center text-zinc-600">Nenhum vínculo cadastrado.</td></tr>}</tbody></table></div></section>}

          {tab === "audit" && <section><h2 className="text-3xl font-semibold">Auditoria</h2><p className="mt-2 text-sm text-zinc-500">Registro das ações administrativas críticas.</p><div className="mt-5 space-y-2">{audits.map(a=><div key={a.id} className="rounded-xl border border-zinc-900 bg-zinc-950 p-4"><div className="flex flex-wrap justify-between gap-2"><span className="text-sm font-medium">{a.action}</span><span className="text-xs text-zinc-600">{new Date(a.created_at).toLocaleString('pt-BR')}</span></div><p className="mt-1 text-xs text-zinc-600">{a.target_type}{a.target_id ? ` · ${a.target_id}` : ''}</p></div>)}{!audits.length&&<p className="rounded-xl border border-zinc-900 p-8 text-center text-sm text-zinc-600">Nenhuma ação administrativa registrada.</p>}</div></section>}
        </main>
      </div>
    </div>
  );
}
