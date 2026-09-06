import { createClient } from "@/lib/supabase/server";
import type { AppSurface } from "./host";

export async function getAuthenticatedUser() {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
      return null;
    }
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) return null;
    return data.user;
  } catch {
    return null;
  }
}

export async function getUserGlobalRoles(userId: string) {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
      return [];
    }
    const supabase = await createClient();
    const { data } = await supabase
      .from("user_global_roles")
      .select("role")
      .eq("user_id", userId);

    const roles = (data ?? []).map((item) => item.role as string);
    if (roles.includes("super_admin")) {
      return roles;
    }

    try {
      const { data: isSuperAdmin } = await (supabase.rpc as any)("has_current_user_super_admin");
      if (isSuperAdmin === true) {
        return Array.from(new Set([...roles, "super_admin"]));
      }
    } catch {
      // ignora
    }

    return roles;
  } catch {
    return [];
  }
}

export async function getTenantBySlug(slug: string) {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
      return null;
    }
    const supabase = await createClient();
    const { data } = await supabase
      .from("tenants")
      .select("id, name, slug, status")
      .eq("slug", slug)
      .maybeSingle();

    return data;
  } catch {
    return null;
  }
}

export async function getTenantMembership(userId: string, tenantId: string) {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
      return null;
    }
    const supabase = await createClient();
    const { data } = await supabase
      .from("tenant_members")
      .select("id, role, tenant_id")
      .eq("user_id", userId)
      .eq("tenant_id", tenantId)
      .maybeSingle();

    return data;
  } catch {
    return null;
  }
}

export async function getAccessContext(surface: AppSurface, tenantSlug: string | null) {
  const user = await getAuthenticatedUser();
  if (!user) return { user: null, allowed: false as const, tenant: null, role: null };

  const globalRoles = await getUserGlobalRoles(user.id);

  if (surface === "power") {
    let allowed = globalRoles.includes("super_admin");

    if (!allowed) {
      try {
        const supabase = await createClient();
        const { data: claimed } = await (supabase.rpc as any)("claim_first_super_admin");
        if (claimed === true) {
          const updatedRoles = await getUserGlobalRoles(user.id);
          allowed = updatedRoles.includes("super_admin");
        }
      } catch {
        // segue com validação padrão
      }
    }

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
