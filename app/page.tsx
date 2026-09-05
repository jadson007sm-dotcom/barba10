import Link from "next/link";
import { headers } from "next/headers";
import { resolveAppSurface } from "@/lib/auth/host";
import { LandingAnalytics } from "@/components/landing-analytics";
import { LandingCta } from "@/components/landing-cta";

export default function HomePage() {
  const host = headers().get("host") ?? "";
  const { surface } = resolveAppSurface(host);

  if (surface === "power") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
        <div className="max-w-xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#D4AF37]">BARBA10 POWER</p>
          <h1 className="mt-4 text-4xl font-bold">Centro de comando.</h1>
          <Link href="/power" className="mt-8 inline-flex rounded-2xl bg-[#D4AF37] px-6 py-3 font-semibold text-black">Abrir Power</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#070707] text-white">
      <LandingAnalytics />
      <section className="relative isolate">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_72%_8%,rgba(212,175,55,0.18),transparent_30%),radial-gradient(circle_at_12%_88%,rgba(255,255,255,0.05),transparent_28%)]" />
        <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-6 sm:px-8">
          <Link href="/" className="text-xl font-bold tracking-[0.18em]">BARBA<span className="text-[#D4AF37]">10</span></Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="rounded-xl border border-zinc-800 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-900">Entrar</Link>
            <LandingCta className="rounded-xl bg-[#D4AF37] px-4 py-2 text-sm font-semibold text-black hover:brightness-110" />
          </div>
        </header>

        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 pb-20 pt-14 sm:px-8 lg:grid-cols-[1.08fr_.92fr] lg:pb-28 lg:pt-20">
          <div>
            <p className="inline-flex rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-[#D4AF37]">
              Gestão premium para barbearias
            </p>
            <h1 className="mt-7 max-w-4xl text-5xl font-semibold leading-[1.02] sm:text-6xl lg:text-7xl">
              Sua barbearia.
              <span className="block text-[#D4AF37]">Elevada a outro nível.</span>
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-zinc-400 sm:text-xl">
              Gestão, equipe e experiência do cliente em uma plataforma rápida, elegante e preparada para crescer.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <LandingCta className="rounded-2xl bg-[#D4AF37] px-6 py-4 text-center font-semibold text-black shadow-[0_12px_40px_rgba(212,175,55,0.18)] hover:brightness-110" />
              <Link href="#recursos" className="rounded-2xl border border-zinc-800 px-6 py-4 text-center font-semibold text-zinc-200 hover:bg-zinc-900">Conhecer a plataforma</Link>
            </div>
            <p className="mt-5 text-xs uppercase tracking-[0.18em] text-zinc-600">Multi-tenant · PWA · Segurança por camadas</p>
          </div>

          <div className="relative">
            <div className="rounded-[2rem] border border-zinc-800 bg-zinc-950/80 p-5 shadow-2xl backdrop-blur">
              <div className="rounded-[1.5rem] border border-zinc-900 bg-black p-6">
                <div className="flex items-center justify-between">
                  <div><p className="text-xs uppercase tracking-[0.22em] text-zinc-600">BARBA10</p><p className="mt-2 text-2xl font-semibold">Centro de operação</p></div>
                  <div className="h-10 w-10 rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/10" />
                </div>
                <div className="mt-8 grid grid-cols-2 gap-4">
                  {[["Agenda","Organizada"],["Equipe","Conectada"],["Clientes","Mais próximos"],["Gestão","Centralizada"]].map(([a,b])=>(
                    <div key={a} className="rounded-2xl border border-zinc-900 bg-zinc-950 p-4"><p className="text-xs text-zinc-600">{a}</p><p className="mt-2 font-semibold">{b}</p></div>
                  ))}
                </div>
                <div className="mt-4 rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/5 p-5">
                  <p className="text-sm leading-6 text-zinc-400">Quatro experiências, uma plataforma: Power, Barbearia, Barbeiro e Cliente.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="recursos" className="border-y border-zinc-900 bg-black/50">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:py-20">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#D4AF37]">Ecossistema BARBA10</p>
          <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">Cada público no seu ambiente.</h2>
          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              ["Power","Visão global do SaaS, indicadores e operação da plataforma."],
              ["Barbearia","Gestão completa da unidade, equipe e rotina."],
              ["Barbeiro","Agenda pessoal, atendimentos e produtividade."],
              ["Cliente","Agendamento, relacionamento e experiência digital."],
            ].map(([title,text])=>(
              <article key={title} className="rounded-3xl border border-zinc-900 bg-zinc-950 p-6">
                <div className="h-10 w-10 rounded-2xl border border-[#D4AF37]/30 bg-[#D4AF37]/5" />
                <h3 className="mt-5 text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-zinc-500">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:py-20">
        <div className="rounded-[2rem] border border-[#D4AF37]/20 bg-gradient-to-br from-[#D4AF37]/10 via-zinc-950 to-black p-8 sm:p-12 lg:flex lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#D4AF37]">Pronto para começar?</p>
            <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">Reserve o endereço da sua barbearia.</h2>
            <p className="mt-4 text-zinc-400">Crie sua conta e entre no ecossistema BARBA10.</p>
          </div>
          <LandingCta className="mt-8 inline-flex rounded-2xl bg-[#D4AF37] px-6 py-4 font-semibold text-black hover:brightness-110 lg:mt-0" />
        </div>
      </section>

      <footer className="border-t border-zinc-900 px-5 py-8 text-center text-xs text-zinc-600">
        BARBA10 · Agendamento e gestão para barbearia
      </footer>
    </main>
  );
}
