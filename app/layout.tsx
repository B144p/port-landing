import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { BackgroundLayer } from "@/components/background-layer";
import { Scanlines } from "@/components/scanlines";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "PORT",
  description: "Frontend version select.",
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
        {children}
      </body>
    </html>
  );
}
