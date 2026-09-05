import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { resolveAppSurface } from "@/lib/auth/host";
import { getAccessContext } from "@/lib/auth/server";

export default async function HomePage() {
  const host = headers().get("host") ?? "";
  const { surface, tenantSlug } = resolveAppSurface(host);

  if (surface === "power") {
    redirect("/power");
  }

  const access = await getAccessContext(surface, tenantSlug);

  if (!access.user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
        <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-950 p-8 shadow-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#D4AF37]">BARBA10</p>
          <h1 className="mt-5 text-3xl font-semibold">Acesso ao sistema</h1>
          <p className="mt-3 text-sm leading-6 text-zinc-500">
            Entre com sua conta para acessar o ambiente correspondente ao seu perfil.
          </p>
          <Link
            href="/login"
            className="mt-7 flex w-full justify-center rounded-2xl bg-[#D4AF37] px-5 py-3.5 font-semibold text-black hover:brightness-110"
          >
            Entrar
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
      <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-950 p-8 text-center shadow-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#D4AF37]">BARBA10</p>
        <h1 className="mt-4 text-3xl font-semibold">Sessão ativa</h1>
        <p className="mt-3 text-sm leading-6 text-zinc-500">
          A conta está autenticada, mas este endereço é apenas a entrada do sistema.
        </p>
        <Link
          href="/login"
          className="mt-7 inline-flex rounded-2xl border border-zinc-800 px-5 py-3 font-semibold text-zinc-200 hover:bg-zinc-900"
        >
          Continuar
        </Link>
        {!access.allowed ? <p className="mt-4 text-xs text-zinc-600">O perfil ainda não possui acesso autorizado neste ambiente.</p> : null}
      </div>
    </main>
  );
}
