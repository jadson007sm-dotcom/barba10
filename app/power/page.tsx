import { redirect } from "next/navigation";
import { getAccessContext } from "@/lib/auth/server";

export default async function PowerPage() {
  const access = await getAccessContext("power", null);

  if (!access.user) redirect("/login");
  if (!access.allowed) redirect("/403");

  return (
    <main className="min-h-screen bg-black px-6 py-10 text-white">
      <div className="mx-auto max-w-5xl">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#D4AF37]">BARBA10</p>
        <h1 className="mt-2 text-3xl font-bold">Painel Power</h1>
        <p className="mt-2 text-zinc-400">Fundação de identidade e autorização ativa.</p>
      </div>
    </main>
  );
}
