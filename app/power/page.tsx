import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { resolveAppSurface } from "@/lib/auth/host";
import { getAccessContext } from "@/lib/auth/server";

export default async function PowerPage() {
  const host = headers().get("host") ?? "";
  const { surface } = resolveAppSurface(host);
  if (surface !== "power") redirect("/403");

  const access = await getAccessContext("power", null);
  if (!access.user) redirect("/login");
  if (!access.allowed) redirect("/403");

  const supabase = await createClient();
  const startIso = new Date(Date.now() - 29 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { count: pageViews },
    { count: ctaClicks },
    { count: signupStarted },
    { count: signupCompleted },
    { data: eventRows },
    { data: tenants },
  ] = await Promise.all([
    supabase.from("site_events").select("id", { count: "exact", head: true }).eq("event_type", "page_view").gte("created_at", startIso),
    supabase.from("site_events").select("id", { count: "exact", head: true }).eq("event_type", "cta_signup_click").gte("created_at", startIso),
    supabase.from("site_events").select("id", { count: "exact", head: true }).eq("event_type", "signup_started").gte("created_at", startIso),
    supabase.from("site_events").select("id", { count: "exact", head: true }).eq("event_type", "signup_completed").gte("created_at", startIso),
    supabase.from("site_events").select("session_id,device_type").eq("event_type", "page_view").gte("created_at", startIso),
    supabase.from("tenants").select("id,name,slug,status,created_at").order("created_at", { ascending:false }).limit(100),
  ]);

  const sessions = new Set((eventRows ?? []).map((row) => row.session_id)).size;
  const conversionToCta = pageViews ? ((ctaClicks ?? 0) / pageViews) * 100 : 0;
  const conversionToSignup = pageViews ? ((signupCompleted ?? 0) / pageViews) * 100 : 0;

  const devices = { mobile: 0, tablet: 0, desktop: 0, unknown: 0 };
  for (const row of eventRows ?? []) {
    const key = row.device_type as keyof typeof devices;
    if (key in devices) devices[key] += 1;
  }

  return (
    <main className="min-h-screen bg-[#080808] text-white">
      <header className="border-b border-zinc-900 bg-black/95">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#D4AF37]">BARBA10 POWER</p>
            <h1 className="mt-1 text-2xl font-bold">Centro de comando</h1>
          </div>
          <Link href="/" className="rounded-xl border border-zinc-800 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-900">Landing Page</Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
        <p className="text-sm text-zinc-500">Visão dos últimos 30 dias</p>

        <section className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["Visitas", pageViews ?? 0],
            ["Sessões", sessions],
            ["Cliques no cadastro", ctaClicks ?? 0],
            ["Cadastros concluídos", signupCompleted ?? 0],
          ].map(([label,value]) => (
            <div key={String(label)} className="rounded-2xl border border-zinc-900 bg-zinc-950 p-5">
              <p className="text-sm text-zinc-500">{label}</p>
              <p className="mt-2 text-3xl font-semibold">{value}</p>
            </div>
          ))}
        </section>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
          <section className="rounded-3xl border border-zinc-900 bg-zinc-950 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Barbearias</h2>
                <p className="mt-1 text-sm text-zinc-500">Cadastros reais no tenant core.</p>
              </div>
              <span className="rounded-full border border-zinc-800 px-3 py-1 text-xs text-zinc-500">{tenants?.length ?? 0}</span>
            </div>
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[650px] text-left text-sm">
                <thead className="border-b border-zinc-900 text-zinc-600"><tr><th className="px-2 py-3">Barbearia</th><th className="px-2 py-3">Subdomínio</th><th className="px-2 py-3">Status</th><th className="px-2 py-3">Cadastro</th></tr></thead>
                <tbody>
                  {(tenants ?? []).map((tenant) => (
                    <tr key={tenant.id} className="border-b border-zinc-900/70">
                      <td className="px-2 py-3 font-medium">{tenant.name}</td>
                      <td className="px-2 py-3 text-zinc-500">{tenant.slug}.barba10.com</td>
                      <td className="px-2 py-3 capitalize text-zinc-400">{tenant.status}</td>
                      <td className="px-2 py-3 text-zinc-500">{new Date(tenant.created_at).toLocaleDateString("pt-BR")}</td>
                    </tr>
                  ))}
                  {!tenants?.length ? <tr><td colSpan={4} className="px-2 py-10 text-center text-zinc-600">Nenhuma barbearia cadastrada.</td></tr> : null}
                </tbody>
              </table>
            </div>
          </section>

          <aside className="space-y-6">
            <section className="rounded-3xl border border-zinc-900 bg-zinc-950 p-6">
              <h2 className="text-lg font-semibold">Landing Page</h2>
              <p className="mt-1 text-sm text-zinc-500">Funil comercial.</p>
              <div className="mt-5 space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-zinc-500">Views</span><span>{pageViews ?? 0}</span></div>
                <div className="flex justify-between"><span className="text-zinc-500">Sessões</span><span>{sessions}</span></div>
                <div className="flex justify-between"><span className="text-zinc-500">CTAs</span><span>{ctaClicks ?? 0}</span></div>
                <div className="flex justify-between"><span className="text-zinc-500">Cadastros iniciados</span><span>{signupStarted ?? 0}</span></div>
                <div className="flex justify-between"><span className="text-zinc-500">Cadastros concluídos</span><span>{signupCompleted ?? 0}</span></div>
                <div className="flex justify-between pt-2 border-t border-zinc-900"><span className="text-zinc-500">Conversão → CTA</span><span>{conversionToCta.toFixed(1)}%</span></div>
                <div className="flex justify-between"><span className="text-zinc-500">Conversão → cadastro</span><span>{conversionToSignup.toFixed(1)}%</span></div>
              </div>
            </section>

            <section className="rounded-3xl border border-zinc-900 bg-zinc-950 p-6">
              <h2 className="text-lg font-semibold">Dispositivos</h2>
              <div className="mt-5 space-y-3 text-sm">
                <div className="flex justify-between"><span>Celular</span><span>{devices.mobile}</span></div>
                <div className="flex justify-between"><span>Tablet</span><span>{devices.tablet}</span></div>
                <div className="flex justify-between"><span>Desktop</span><span>{devices.desktop}</span></div>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
