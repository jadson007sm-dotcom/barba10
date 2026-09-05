"use client";

import Link from "next/link";
import { trackLandingCta } from "./landing-analytics";

export function LandingCta({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/cadastro"
      onClick={() => void trackLandingCta()}
      className={className}
    >
      Cadastrar minha barbearia
    </Link>
  );
}
