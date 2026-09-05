export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
      <section className="w-full max-w-xl text-center">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-[#D4AF37]">
          Plataforma SaaS
        </p>
        <h1 className="text-5xl font-bold tracking-tight">Barba10</h1>
        <p className="mt-4 text-base text-zinc-400">
          Agendamento e gestão para barbearia.
        </p>
        <div className="mx-auto mt-8 h-px w-24 bg-[#D4AF37]" />
        <p className="mt-6 text-sm text-zinc-500">
          Foundation inicial pronta para a construção dos ambientes Power,
          Barbearia, Barbeiro e Cliente.
        </p>
      </section>
    </main>
  );
}
