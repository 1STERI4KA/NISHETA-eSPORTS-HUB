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

const siteUrl = new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://nisheta-e-sports-hub.vercel.app");
const socialImage = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663910302802/qJJpiSCELOfbjefn.png";

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: {
    default: "NISHETA eSPORTS HUB — игровой хаб команды",
    template: "%s | NISHETA eSPORTS HUB",
  },
  description:
    "NISHETA eSPORTS HUB — игровой хаб команды: Dota 2 Draft Lab, мета, билды, статистика игроков, игровые сборы и командная галерея.",
  applicationName: "NISHETA eSPORTS HUB",
  keywords: [
    "NISHETA eSPORTS HUB",
    "NISHETA",
    "Dota 2",
    "Dota 2 Draft Lab",
    "мета Dota 2",
    "статистика игроков",
    "киберспорт",
  ],
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: siteUrl,
    siteName: "NISHETA eSPORTS HUB",
    title: "NISHETA eSPORTS HUB — игровой хаб команды",
    description:
      "Dota 2 Draft Lab, мета, билды, статистика игроков и командная галерея NISHETA.",
    images: [
      {
        url: socialImage,
        alt: "Командная фотография NISHETA eSPORTS HUB",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "NISHETA eSPORTS HUB — игровой хаб команды",
    description:
      "Dota 2 Draft Lab, мета, билды, статистика игроков и командная галерея NISHETA.",
    images: [socialImage],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
