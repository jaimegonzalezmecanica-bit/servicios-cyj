import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VigilApp - Seguridad Inteligente para tu Comunidad",
  description:
    "VigilApp es la aplicación de seguridad comunitaria que conecta vecinos con tecnología inteligente: botón SOS, reportes vecinales y geolocalización.",
  keywords: [
    "VigilApp",
    "seguridad comunitaria",
    "condominios",
    "Chile",
    "botón SOS",
    "reportes vecinales",
  ],
  authors: [{ name: "VigilApp" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "VigilApp - Seguridad Inteligente para tu Comunidad",
    description:
      "Conecta a tu comunidad con seguridad inteligente. Botón SOS, reportes vecinales y geolocalización.",
    siteName: "VigilApp",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
