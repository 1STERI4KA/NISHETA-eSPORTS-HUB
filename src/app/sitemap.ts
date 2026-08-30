import type { MetadataRoute } from "next";

const siteUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "https://nisheta-e-sports-hub.vercel.app").replace(/\/$/, "");
const lastModified = new Date("2026-08-25T00:00:00.000Z");

const publicRoutes = [
  { path: "/", priority: 1, changeFrequency: "weekly" as const },
  { path: "/dota2", priority: 0.9, changeFrequency: "weekly" as const },
  { path: "/dota2/stats", priority: 0.8, changeFrequency: "daily" as const },
  { path: "/draft", priority: 0.9, changeFrequency: "daily" as const },
  { path: "/gallery", priority: 0.6, changeFrequency: "monthly" as const },
  { path: "/satire", priority: 0.6, changeFrequency: "daily" as const },
  { path: "/confessions", priority: 0.7, changeFrequency: "daily" as const },
  { path: "/players", priority: 0.8, changeFrequency: "weekly" as const },
  { path: "/nisheta", priority: 0.7, changeFrequency: "weekly" as const },
  { path: "/nisheta/achievements", priority: 0.5, changeFrequency: "weekly" as const },
  { path: "/nisheta/challenges", priority: 0.5, changeFrequency: "weekly" as const },
  { path: "/nisheta/hall-of-fame", priority: 0.5, changeFrequency: "monthly" as const },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return publicRoutes.map(({ path, priority, changeFrequency }) => ({
    url: `${siteUrl}${path}`,
    lastModified,
    changeFrequency,
    priority,
  }));
}
