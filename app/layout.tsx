import type { Metadata, Viewport } from "next";
import { PWARegistration } from "./pwa-registration";
import "./globals.css";

export const metadata: Metadata = {
  title: "Barba10",
  description: "Agendamento e gestão para barbearia",
  applicationName: "Barba10",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "Barba10",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#D4AF37",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>
        <PWARegistration />
        {children}
      </body>
    </html>
  );
}
