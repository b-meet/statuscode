import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Statuscode - Premium Status Pages for Modern Brands",
  description: "Transform your system status into a brand experience. Statuscode acts as a designer layer over your existing monitoring tools like UptimeRobot and Better Stack.",
  keywords: ["status page", "uptime monitor", "status page design", "uptimerobot theme", "better stack theme", "incident communication", "system status"],
  authors: [{ name: "Statuscode Team" }],
  openGraph: {
    title: "Statuscode - Status pages that people actually read",
    description: "Don't settle for boring status pages. Statuscode sits on top of your monitoring stack to provide stunning, animated, and branded status experiences.",
    url: "https://statuscode.in",
    siteName: "Statuscode",
    images: [
      {
        url: "https://statuscode.in/og-image.png", // We might need to generate this or use a placeholder
        width: 1200,
        height: 630,
        alt: "Statuscode Preview",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Statuscode - Elevated Status Pages",
    description: "Turn clinical uptime data into a premium brand asset. Works with UptimeRobot, Checkly, and more.",
    images: ["https://statuscode.in/og-image.png"],
  },
  metadataBase: new URL("https://statuscode.in"),
  alternates: {
    canonical: "/",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
