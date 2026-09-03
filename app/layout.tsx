import type { Metadata } from "next";
import "./globals.css";
import "./master/master.css";

export const metadata: Metadata = {
  title: "Barba10 | Painel Master",
  description: "Acesso ao Painel Master do Barba10",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
