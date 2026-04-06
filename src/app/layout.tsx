import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";

import "@/app/globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
  title: "Food Optimizer",
  description: "Base da fase 1 do Food Optimizer: auth, onboarding e dashboard.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.JSX.Element {
  return (
    <html
      className={`${inter.variable} ${jetbrainsMono.variable}`}
      lang="pt-BR"
    >
      <body>{children}</body>
    </html>
  );
}
