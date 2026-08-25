import GalleryClient from "@/components/GalleryClient";
import { NISHETA_GALLERY } from "@/lib/gallery";

export const dynamic = "force-static";

export default function GalleryPage() {
  return (
    <GalleryClient
      albums={[
        {
          id: "nisheta-collection",
          title: "NISHETA / архив",
          description: "Пять кадров из личной коллекции команды.",
          photos: NISHETA_GALLERY,
        },
      ]}
    />
  );
}
