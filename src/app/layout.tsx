import type { Metadata, Viewport } from "next";
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
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "VigilApp",
  },
  icons: {
    icon: "/download/icon-192.png",
    apple: "/download/icon-192.png",
  },
  openGraph: {
    title: "VigilApp - Seguridad Inteligente para tu Comunidad",
    description:
      "Conecta a tu comunidad con seguridad inteligente. Botón SOS, reportes vecinales y geolocalización.",
    siteName: "VigilApp",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#1e40af",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="theme-color" content="#1e40af" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
