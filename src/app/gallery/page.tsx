import GalleryClient from "@/components/GalleryClient";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function GalleryPage() {
  const albums = await prisma.galleryAlbum.findMany({
    where: { isPublished: true },
    include: { photos: { where: { status: "published" }, include: { tags: true }, orderBy: { createdAt: "desc" } } },
    orderBy: { createdAt: "desc" },
  });
  const playerIds = [...new Set(albums.flatMap((album) => album.photos.flatMap((photo) => photo.tags.map((tag) => tag.playerId))))];
  const players = playerIds.length ? await prisma.player.findMany({ where: { id: { in: playerIds } }, select: { id: true, nickname: true } }) : [];
  const names = new Map(players.map((player) => [player.id, player.nickname]));
  return <GalleryClient albums={albums.map((album) => ({ id: album.id, title: album.title, description: album.description, photos: album.photos.map((photo) => ({ id: photo.id, imageUrl: photo.imageUrl, caption: photo.caption, tags: photo.tags.map((tag) => names.get(tag.playerId) ?? "Игрок NISHETA") })) }))} />;
}
