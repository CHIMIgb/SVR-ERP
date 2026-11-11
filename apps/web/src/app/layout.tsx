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
