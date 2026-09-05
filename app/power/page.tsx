import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { resolveAppSurface } from "@/lib/auth/host";
import { getAccessContext } from "@/lib/auth/server";
import { PowerAdmin, type PowerAudit, type PowerMember, type PowerTenant } from "@/components/power-admin";

export default async function PowerPage() {
  const host = headers().get("host") ?? "";
  const { surface } = resolveAppSurface(host);
  if (surface !== "power") redirect("/403");
  const access = await getAccessContext("power", null);
  if (!access.user) redirect("/login");
  if (!access.allowed) redirect("/403");

  const supabase = await createClient();
  const startIso = new Date(Date.now() - 29 * 24 * 60 * 60 * 1000).toISOString();
  const [{ data: tenantRows }, { data: memberRows }, { data: auditRows }] = await Promise.all([
    supabase.from("tenants").select("id,name,slug,status,created_at,owner_user_id,profiles!tenants_owner_user_id_fkey(full_name,phone),tenant_members(id)").order("created_at", { ascending: false }).limit(200),
    supabase.from("tenant_members").select("id,tenant_id,user_id,role,tenants(name),profiles(full_name)").order("created_at", { ascending: false }).limit(500),
    supabase.from("admin_audit_logs").select("id,action,target_type,target_id,created_at,metadata").gte("created_at", startIso).order("created_at", { ascending: false }).limit(100),
  ]);

  const tenants: PowerTenant[] = (tenantRows ?? []).map((t: any) => ({
    id: t.id, name: t.name, slug: t.slug, status: t.status, created_at: t.created_at, owner_user_id: t.owner_user_id,
    owner_name: t.profiles?.full_name ?? null, owner_phone: t.profiles?.phone ?? null, member_count: Array.isArray(t.tenant_members) ? t.tenant_members.length : 0,
  }));
  const members: PowerMember[] = (memberRows ?? []).map((m: any) => ({ id: m.id, tenant_id: m.tenant_id, user_id: m.user_id, role: m.role, tenant_name: m.tenants?.name ?? "—", user_name: m.profiles?.full_name ?? null }));
  const audits: PowerAudit[] = (auditRows ?? []).map((a: any) => ({ id: a.id, action: a.action, target_type: a.target_type, target_id: a.target_id, created_at: a.created_at, metadata: a.metadata ?? {} }));

  const [{ count: pageViews }, { count: ctaClicks }, { count: signupStarted }, { count: signupCompleted }, { data: eventRows }] = await Promise.all([
    supabase.from("site_events").select("id", { count: "exact", head: true }).eq("event_type", "page_view").gte("created_at", startIso),
    supabase.from("site_events").select("id", { count: "exact", head: true }).eq("event_type", "cta_signup_click").gte("created_at", startIso),
    supabase.from("site_events").select("id", { count: "exact", head: true }).eq("event_type", "signup_started").gte("created_at", startIso),
    supabase.from("site_events").select("id", { count: "exact", head: true }).eq("event_type", "signup_completed").gte("created_at", startIso),
    supabase.from("site_events").select("session_id,device_type").eq("event_type", "page_view").gte("created_at", startIso),
  ]);
  const sessions = new Set((eventRows ?? []).map((r) => r.session_id)).size;
  const devices = { mobile: 0, tablet: 0, desktop: 0, unknown: 0 };
  for (const row of eventRows ?? []) { const key = row.device_type as keyof typeof devices; if (key in devices) devices[key] += 1; }
  return <PowerAdmin tenants={tenants} members={members} audits={audits} metrics={{ pageViews: pageViews ?? 0, ctaClicks: ctaClicks ?? 0, signupStarted: signupStarted ?? 0, signupCompleted: signupCompleted ?? 0, sessions, devices }} />;
}
