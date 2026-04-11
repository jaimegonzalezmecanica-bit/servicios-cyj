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
  title: "Servicios Integrales CyJ - Seguridad Comunitaria",
  description:
    "Plataforma de seguridad comunitaria para gestión de residentes, alertas y vigilancia",
  keywords: [
    "Servicios Integrales CyJ",
    "seguridad comunitaria",
    "condominios",
    "722 residentes",
    "roles",
    "guardias",
  ],
  authors: [{ name: "Servicios Integrales CyJ" }],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "CyJ Seguridad",
  },
  icons: {
    icon: "/download/icon-192.png",
    apple: "/download/icon-192.png",
  },
  openGraph: {
    title: "Servicios Integrales CyJ - Seguridad Comunitaria",
    description:
      "Plataforma de seguridad comunitaria para gestión de 722+ residentes, alertas y vigilancia.",
    siteName: "Servicios Integrales CyJ",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#0f4c81",
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
        <meta name="apple-mobile-web-app-title" content="CyJ Seguridad" />
        <meta name="theme-color" content="#0f4c81" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="CyJ Seguridad" />
        <meta name="msapplication-TileColor" content="#0f4c81" />
        <meta name="msapplication-navbutton-color" content="#0f4c81" />
        <meta name="format-detection" content="telephone=no" />
        <link rel="apple-touch-icon" href="/download/icon-192.png" />
        <link rel="apple-touch-startup-image" href="/download/icon-512.png" />
        <meta name="description" content="Servicios Integrales CyJ - Plataforma de seguridad comunitaria para 722+ residentes. Instala la app en tu celular." />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // SERVER URL for native apps (APK/iOS)
              // This is replaced during build with the actual server URL
              window.__CYJ_SERVER_URL__ = "${process.env.NEXT_PUBLIC_SERVER_URL || ''}";
              console.log('[CyJ] Server URL:', window.__CYJ_SERVER_URL__ || '(same-origin)');

              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(function(reg) {
                    console.log('CyJ SW registered:', reg.scope);
                    reg.addEventListener('updatefound', function() {
                      const newWorker = reg.installing;
                      newWorker.addEventListener('statechange', function() {
                        if (newWorker.state === 'activated') {
                          console.log('CyJ App updated!');
                        }
                      });
                    });
                  }).catch(function(err) { console.log('SW err:', err); });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
