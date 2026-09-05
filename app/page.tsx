import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { resolveAppSurface } from "@/lib/auth/host";
import { getAccessContext } from "@/lib/auth/server";

function Surface({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <main className="min-h-screen bg-black px-6 py-12 text-white">
      <div className="mx-auto flex min-h-[80vh] max-w-5xl items-center justify-center">
        <section className="w-full rounded-3xl border border-zinc-800 bg-zinc-950 p-8 text-center shadow-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#D4AF37]">BARBA10</p>
          <h1 className="mt-3 text-4xl font-bold">{title}</h1>
          <p className="mx-auto mt-4 max-w-xl text-zinc-400">{subtitle}</p>
          <div className="mx-auto mt-8 h-px w-24 bg-[#D4AF37]" />
          <p className="mt-6 text-xs uppercase tracking-[0.18em] text-zinc-600">
            Fase 2 · Identity & Access
          </p>
        </section>
      </div>
    </main>
  );
}

export default async function HomePage() {
  const requestHeaders = headers();
  const host = requestHeaders.get("host") ?? "";
  const { surface, tenantSlug } = resolveAppSurface(host);
  const access = await getAccessContext(surface, tenantSlug);

  if (surface !== "public" && !access.user) redirect("/login");
  if (surface !== "public" && !access.allowed) redirect("/403");

  if (surface === "power") {
    redirect("/power");
  }

  if (surface === "barbershop") {
    return (
      <Surface
        title={access.tenant?.name ?? tenantSlug ?? "Barbearia"}
        subtitle="Ambiente protegido da barbearia. A identidade do tenant já está resolvida pelo subdomínio."
      />
    );
  }

  if (surface === "barber") {
    return <Surface title="App do Barbeiro" subtitle="Ambiente reservado para profissionais vinculados a uma barbearia." />;
  }

  if (surface === "customer") {
    return <Surface title="App do Cliente" subtitle="Ambiente reservado para clientes autenticados do ecossistema BARBA10." />;
  }

  return (
    <Surface
      title="Fundação BARBA10"
      subtitle="Plataforma SaaS preparada para os ambientes Power, Barbearia, Barbeiro e Cliente."
    />
  );
}
