import { createClient } from "@/lib/supabase/server";
import type { AppSurface } from "./host";

export async function getAuthenticatedUser() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) return null;
  return data.user;
}

export async function getUserGlobalRoles(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("user_global_roles")
    .select("role")
    .eq("user_id", userId);

  return (data ?? []).map((item) => item.role as string);
}

export async function getTenantBySlug(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tenants")
    .select("id, name, slug, status")
    .eq("slug", slug)
    .maybeSingle();

  return data;
}

export async function getTenantMembership(userId: string, tenantId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tenant_members")
    .select("id, role, tenant_id")
    .eq("user_id", userId)
    .eq("tenant_id", tenantId)
    .maybeSingle();

  return data;
}

export async function getAccessContext(surface: AppSurface, tenantSlug: string | null) {
  const user = await getAuthenticatedUser();
  if (!user) return { user: null, allowed: false as const, tenant: null, role: null };

  const globalRoles = await getUserGlobalRoles(user.id);

  if (surface === "power") {
    const allowed = globalRoles.includes("super_admin");
    return { user, allowed, tenant: null, role: allowed ? "super_admin" : null };
  }

  if (surface === "barbershop" && tenantSlug) {
    const tenant = await getTenantBySlug(tenantSlug);
    if (!tenant || tenant.status !== "active") {
      return { user, allowed: false as const, tenant: null, role: null };
    }

    const membership = await getTenantMembership(user.id, tenant.id);
    return {
      user,
      allowed: Boolean(membership),
      tenant,
      role: membership?.role ?? null,
    };
  }

  if (surface === "barber" || surface === "customer") {
    const supabase = await createClient();
    const { data } = await supabase
      .from("tenant_members")
      .select("tenant_id, role")
      .eq("user_id", user.id)
      .in("role", surface === "barber" ? ["barber"] : ["customer"])
      .limit(1)
      .maybeSingle();

    return {
      user,
      allowed: Boolean(data),
      tenant: null,
      role: data?.role ?? null,
    };
  }

  return { user, allowed: true as const, tenant: null, role: null };
}
