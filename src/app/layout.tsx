import type { Metadata } from "next";
import { Geist_Mono, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
	subsets: ["latin"],
	variable: "--font-inter",
});

const geistMono = Geist_Mono({
	subsets: ["latin"],
	variable: "--font-geist-mono",
});

const jetbrainsMono = JetBrains_Mono({
	subsets: ["latin"],
	variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
	title: "Food Optimizer",
	description: "Otimizador de dieta e nutrientes para devs fitness",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html
			lang="pt-BR"
			className={`${inter.variable} ${geistMono.variable} ${jetbrainsMono.variable} min-h-full antialiased`}
		>
			<body
				suppressHydrationWarning
				className="min-h-full bg-background text-foreground"
			>
				{children}
			</body>
		</html>
	);
}
