import type { Metadata } from "next";
import { Oswald, Inter, JetBrains_Mono } from "next/font/google";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import "./globals.css";

// Oswald остаётся подключённым — старые страницы (пока не мигрированы)
// используют font-display на нём. Уберём, когда доредизайним всё.
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
        <div className="flex min-h-screen">
          <Sidebar />
          <div className="flex flex-1 flex-col">
            <TopBar />
            <main className="mx-auto w-full max-w-6xl px-4 pb-24 pt-8 sm:px-6">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
