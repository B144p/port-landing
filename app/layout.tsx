import type { Metadata, Viewport } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { BackgroundLayer } from "@/components/background-layer";
import { Scanlines } from "@/components/scanlines";
import { Providers } from "@/app/providers";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
});

const description =
  "Pick a frontend version to view, or wait — the first one loads automatically.";

export const metadata: Metadata = {
  title: "PORT // VERSION SELECT",
  description,
  openGraph: {
    title: "PORT // VERSION SELECT",
    description,
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#020604",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("h-full antialiased font-mono", jetbrainsMono.variable)}
    >
      <body className="min-h-full">
        <BackgroundLayer />
        <Scanlines />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
