import type { Metadata } from "next";
import { Oswald, Inter, JetBrains_Mono } from "next/font/google";
import NavBar from "@/components/NavBar";
import "./globals.css";

const display = Oswald({
  subsets: ["latin", "cyrillic"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
});

const body = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-body",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "NISHETA eSPORTS HUB",
  description: "Приватный игровой хаб команды NISHETA",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body>
        <NavBar />
        <main className="mx-auto max-w-6xl px-4 pb-24 pt-8 sm:px-6">
          {children}
        </main>
      </body>
    </html>
  );
}
