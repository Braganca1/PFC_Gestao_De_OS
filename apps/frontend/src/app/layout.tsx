import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
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
  title: "Gestão de OS - IME",
  description: "Sistema de Gestão de Ordens de Serviço do IME",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="border-b border-black/10 dark:border-white/10">
          <nav className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-6">
            <Link href="/" className="font-semibold">
              Gestão de OS — IME
            </Link>
            <Link
              href="/ordens-servico"
              className="text-sm hover:underline"
            >
              Ordens de Serviço
            </Link>
            <Link
              href="/ordens-servico/nova"
              className="text-sm hover:underline"
            >
              Nova OS
            </Link>
          </nav>
        </header>
        <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
