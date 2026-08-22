import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { ThemedToaster } from "@/components/theme/themed-toaster";
import { AuthProvider } from "@/components/auth/session-provider";
import { ServiceWorkerRegister } from "@/components/pwa/service-worker-register";
import { OfflineBanner } from "@/components/pwa/offline-banner";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { ThemeProvider } from "@/components/theme/theme-provider";
import type { Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F5B400" },
    { media: "(prefers-color-scheme: dark)", color: "#121110" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains", display: "swap" });

// Prevent FOUC — runs before hydration, respects saved preference or system
const themeScript = `(function(){try{var k="sitaram-theme";var s=localStorage.getItem(k);var d=false;if(s==="dark")d=true;else if(s==="light")d=false;else d=window.matchMedia("(prefers-color-scheme: dark)").matches;var c=document.documentElement.classList;d?c.add("dark"):c.remove("dark");document.documentElement.style.colorScheme=d?"dark":"light";}catch(e){}})();`;

export const metadata: Metadata = {
  title: { default: "Sitaram Earthmovers — Machinery Management", template: "%s — Sitaram Earthmovers" },
  description: "Monitor machinery usage, operators, fuel, maintenance and job sites. Powering Every Move.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icons/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Sitaram EM",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${jetbrains.variable} h-full antialiased`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
          <ThemedToaster />
        </ThemeProvider>
        <ServiceWorkerRegister />
        <OfflineBanner />
        <InstallPrompt />
      </body>
    </html>
  );
}