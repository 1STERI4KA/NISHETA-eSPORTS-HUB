import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Oswald } from "next/font/google";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import FriendCursor from "@/components/FriendCursor";
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
        <FriendCursor />
        <div className="min-h-screen md:flex">
          <Sidebar />
          <div className="flex min-w-0 flex-1 flex-col">
            <TopBar />
            <main className="mx-auto w-full max-w-[1600px] px-4 pb-16 pt-6 sm:px-6 md:px-8 md:pb-10 md:pt-8 lg:px-10">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
