import type { Metadata } from "next";
import { AppProviders } from "@/providers/app-providers";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://lumactraspots.com"),
  title: {
    default: "SGRTC · LUMAC Transportes & Logística",
    template: "%s · SGRTC",
  },
  description:
    "Gestão e rastreamento de cargas rodoviárias em tempo real — viagens, frota, fronteiras e entregas num só painel.",
  applicationName: "SGRTC",
  openGraph: {
    type: "website",
    siteName: "SGRTC · LUMAC Transportes & Logística",
    title: "SGRTC · Gestão e Rastreamento de Cargas",
    description:
      "Viagens, frota, fronteiras e entregas em tempo real — o painel logístico da LUMAC Transportes & Logística.",
    locale: "pt_PT",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt" suppressHydrationWarning>
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
