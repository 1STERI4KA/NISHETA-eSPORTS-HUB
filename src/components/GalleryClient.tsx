"use client";

import { useState } from "react";
import { Camera, Expand, X } from "lucide-react";

type Album = {
  id: string;
  title: string;
  description: string | null;
  photos: readonly { id: string; imageUrl: string; caption: string | null; tags: readonly string[] }[];
};

export default function GalleryClient({ albums }: { albums: readonly Album[] }) {
  const [selected, setSelected] = useState<Album["photos"][number] | null>(null);
  return (
    <div className="space-y-7">
      <section className="page-heading">
        <div>
          <p className="data-label">NISHETA / фотогалерея</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.06em] text-graphite sm:text-4xl">Не мемы. Наши моменты.</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-graphite-muted">Пять кадров из архива команды. Галерея доступна для просмотра без форм загрузки и лишних редакторских элементов.</p>
        </div>
      </section>
      {albums.map((album) => (
        <section key={album.id} className="surface overflow-hidden">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-hairline px-5 py-5 sm:px-6">
            <div>
              <p className="data-label">Альбом</p>
              <h2 className="mt-1 text-2xl font-semibold tracking-[-0.06em] text-graphite">{album.title}</h2>
              {album.description && <p className="mt-2 text-sm text-graphite-muted">{album.description}</p>}
            </div>
            <p className="text-xs font-semibold text-graphite-muted">{album.photos.length} фото</p>
          </div>
          <div className="grid grid-cols-2 gap-px bg-hairline sm:grid-cols-3 lg:grid-cols-4">
            {album.photos.map((photo) => (
              <button key={photo.id} onClick={() => setSelected(photo)} className="group relative aspect-square overflow-hidden bg-paper-muted text-left" aria-label={`Открыть фото: ${photo.caption ?? "без подписи"}`}>
                <img src={photo.imageUrl} alt={photo.caption ?? `Фото из альбома ${album.title}`} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                <span className="absolute inset-0 flex items-center justify-center bg-graphite/25 opacity-0 transition group-hover:opacity-100"><Expand className="text-paper" size={20} /></span>
              </button>
            ))}
          </div>
        </section>
      ))}
      {selected && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-graphite/90 p-4" role="dialog" aria-modal="true" aria-label="Просмотр фотографии">
          <button onClick={() => setSelected(null)} className="absolute right-5 top-5 rounded-xl bg-paper/10 p-2 text-paper" aria-label="Закрыть"><X size={20} /></button>
          <div className="max-h-full max-w-5xl overflow-auto rounded-2xl bg-graphite">
            <img src={selected.imageUrl} alt={selected.caption ?? "Фотография NISHETA"} className="max-h-[75vh] w-full object-contain" />
            <div className="flex flex-wrap items-center justify-between gap-3 p-5 text-paper"><p className="text-sm text-paper/85">{selected.caption ?? "Без подписи"}</p>{selected.tags.length > 0 && <div className="flex flex-wrap gap-1.5">{selected.tags.map((tag) => <span key={tag} className="rounded-md bg-paper/10 px-2 py-1 text-[10px] font-semibold">{tag}</span>)}</div>}</div>
          </div>
        </div>
      )}
      {!albums.length && <section className="surface grid min-h-[340px] place-items-center p-8 text-center"><div><Camera className="mx-auto text-[#8d7552]" size={28} /><p className="mt-4 text-sm text-graphite-muted">В архиве пока нет фотографий.</p></div></section>}
    </div>
  );
}
