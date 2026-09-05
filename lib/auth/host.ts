export type AppSurface = "power" | "barbershop" | "barber" | "customer" | "public";

const RESERVED_SUBDOMAINS = new Set(["www", "admin", "cliente", "barbeiro", "api"]);

export function resolveAppSurface(hostname: string, rootDomain = "barba10.com"): {
  surface: AppSurface;
  tenantSlug: string | null;
} {
  const host = hostname.toLowerCase().split(":")[0];
  const root = rootDomain.toLowerCase();

  if (host === root || host === `www.${root}`) {
    return { surface: "public", tenantSlug: null };
  }

  if (host === `admin.${root}`) {
    return { surface: "power", tenantSlug: null };
  }

  if (host === `cliente.${root}`) {
    return { surface: "customer", tenantSlug: null };
  }

  if (host === `barbeiro.${root}`) {
    return { surface: "barber", tenantSlug: null };
  }

  if (host.endsWith(`.${root}`)) {
    const subdomain = host.slice(0, -(`.${root}`).length).split(".")[0];
    if (subdomain && !RESERVED_SUBDOMAINS.has(subdomain)) {
      return { surface: "barbershop", tenantSlug: subdomain };
    }
  }

  return { surface: "public", tenantSlug: null };
}
