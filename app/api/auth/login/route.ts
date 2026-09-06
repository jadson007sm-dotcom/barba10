import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string; password?: string };
    const email = body.email?.trim() ?? "";
    const password = body.password ?? "";

    if (!email || !password) {
      return NextResponse.json({ error: "E-mail e senha são obrigatórios." }, { status: 400 });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!url || !key) {
      return NextResponse.json({ error: "Supabase não configurado." }, { status: 500 });
    }

    const response = NextResponse.json({ ok: true });
    const supabase = createServerClient(url, key, {
      cookies: {
        getAll() {
          return request.headers.get("cookie")
            ? request.headers.get("cookie")!.split("; ").map((part) => {
                const index = part.indexOf("=");
                return { name: part.slice(0, index), value: part.slice(index + 1) };
              })
            : [];
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    });

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error || !data.user) {
      return NextResponse.json({ error: "E-mail ou senha inválidos." }, { status: 401 });
    }

    const { data: isSuperAdmin, error: roleError } = await supabase.rpc("has_current_user_super_admin");

    if (roleError || isSuperAdmin !== true) {
      return NextResponse.json({ error: "Esta conta não possui acesso ao Power." }, { status: 403 });
    }

    return response;
  } catch {
    return NextResponse.json({ error: "Não foi possível concluir o login agora." }, { status: 500 });
  }
}
