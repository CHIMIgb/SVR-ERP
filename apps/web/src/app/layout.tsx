import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/providers/AuthProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { SCRIPT_TEMA_INICIAL } from "@/lib/tema";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

export const metadata: Metadata = {
  title: "SVR ERP — Sistema de Gestión Constructora",
  description: "Plataforma integral de gestión para SVR Constructora",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#f97316",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // suppressHydrationWarning: el script de tema pone `.dark` y color-scheme en
    // <html> antes de hidratar, así que su className difiere del HTML del servidor.
    <html lang="es" suppressHydrationWarning>
      <head>
        {/* Script normal (no next/script): next/script con beforeInteractive inline
            se encola y corre después del primer pintado, lo que daba un destello claro. */}
        <script id="tema-inicial" dangerouslySetInnerHTML={{ __html: SCRIPT_TEMA_INICIAL }} />
        {/* Captura global del evento de instalación de la PWA: el evento se
            dispara UNA vez por carga de página y el usuario puede aterrizar
            primero en el login — por eso se captura en CUALQUIER página.
            Listener PASIVO (solo guarda el evento; no cambia nada visible del
            escritorio). El registro del SW vive en el shell (pwa), solo en
            producción. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();window.__svrPrompt=e;});",
          }}
        />
      </head>
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} antialiased`}
      >
        <ThemeProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
