import Link from "next/link";

export function LandingCta({ className = "" }: { className?: string }) {
  return (
    <Link href="/cadastro" className={className}>
      Cadastrar minha barbearia
    </Link>
  );
}
