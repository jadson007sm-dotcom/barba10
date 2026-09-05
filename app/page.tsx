import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { resolveAppSurface } from "@/lib/auth/host";
import { getAccessContext } from "@/lib/auth/server";

export default async function HomePage() {
  const host = headers().get("host") ?? "";
  const { surface } = resolveAppSurface(host);

  if (surface === "power") {
    redirect("/power");
  }

  const access = await getAccessContext();

  if (access.user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
        <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-950 p-8 text-center shadow-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#D4AF37]">BARBA10</p>
          <h1 className="mt-4 text-3xl font-semibold">Acesso ao sistema</h1>
          <p className="mt-3 text-sm leading-6 text-zinc-500">
            Sua sessão está ativa. O ambiente específico da sua conta estará disponível nesta mesma entrada.
          </p>
          {surface === "public" ? (
            <Link
              href="/login"
              className="mt-7 inline-flex w-full justify-center rounded-2xl border border-zinc-800 px-5 py-3 font-semibold text-zinc-200 hover:bg-zinc-900"
            >
              Continuar
            </Link>
          ) : null}
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
      <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-950 p-8 shadow-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#D4AF37]">BARBA10</p>
        <h1 className="mt-5 text-3xl font-semibold">Acesso ao sistema</h1>
        <p className="mt-3 text-sm leading-6 text-zinc-500">
          Entre na sua conta para acessar o ambiente correto do BARBA10.
        </p>
        <div className="mt-7 grid gap-3">
          <Link
            href="/login"
            className="flex w-full justify-center rounded-2xl bg-[#D4AF37] px-5 py-3.5 font-semibold text-black hover:brightness-110"
          >
            Entrar
          </Link>
          <Link
            href="/cadastro"
            className="flex w-full justify-center rounded-2xl border border-zinc-800 px-5 py-3.5 font-semibold text-zinc-200 hover:bg-zinc-900"
          >
            Cadastrar barbearia
          </Link>
        </div>
      </div>
    </main>
  );
}
