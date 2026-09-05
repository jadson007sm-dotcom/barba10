import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { resolveAppSurface } from "@/lib/auth/host";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const hostname = request.headers.get("host") ?? "";
  const resolved = resolveAppSurface(hostname);

  response.headers.set("x-barba10-surface", resolved.surface);
  if (resolved.tenantSlug) {
    response.headers.set("x-barba10-tenant", resolved.tenantSlug);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
        });
        response = NextResponse.next({ request });
        response.headers.set("x-barba10-surface", resolved.surface);
        if (resolved.tenantSlug) {
          response.headers.set("x-barba10-tenant", resolved.tenantSlug);
        }
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  await supabase.auth.getUser();
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|icons/).*)",
  ],
};
