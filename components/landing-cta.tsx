`use client`;

import Link from "next/link";
import { trackLandingEvent } from "./landing-analytics";

export function LandingCta({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/cadastro"
      onClick={() => void trackLandingEvent("cta_signup_click")}
      className={className}
    >
      Cadastrar minha barbearia
    </Link>
  );
}
