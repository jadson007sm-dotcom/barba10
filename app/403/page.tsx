import Link from "next/link";

export default function ForbiddenPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
      <section className="max-w-md text-center">
        <p className="text-5xl font-bold text-[#D4AF37]">403</p>
        <h1 className="mt-4 text-2xl font-bold">Acesso não autorizado</h1>
        <p className="mt-2 text-zinc-400">Sua conta não possui permissão para este ambiente.</p>
        <Link href="/login" className="mt-6 inline-block rounded-xl bg-[#D4AF37] px-5 py-3 font-semibold text-black">
          Voltar ao login
        </Link>
      </section>
    </main>
  );
}
