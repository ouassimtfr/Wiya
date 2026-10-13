import { supabase } from "./supabase";

const BUCKET = "listings";

// https://xxx.supabase.co/storage/v1/object/public/listings/<user>/<fichier>  →  "<user>/<fichier>"
export function storagePathFromUrl(url: string): string | null {
  const marker = `/object/public/${BUCKET}/`;
  const i = url.indexOf(marker);
  if (i === -1) return null;
  try {
    return decodeURIComponent(url.slice(i + marker.length).split("?")[0]);
  } catch {
    return null;
  }
}

/**
 * Supprime du stockage toutes les photos et la vidéo d'une annonce.
 * Renvoie le nombre de fichiers réellement supprimés.
 */
export async function deleteListingMedia(listing: {
  images?: string[] | null;
  video_url?: string | null;
}): Promise<number> {
  const urls = [...(listing.images ?? []), ...(listing.video_url ? [listing.video_url] : [])];
  const paths = urls.map(storagePathFromUrl).filter((p): p is string => !!p);
  if (paths.length === 0) return 0;

  const { data, error } = await supabase.storage.from(BUCKET).remove(paths);
  if (error) {
    console.error("Erreur suppression des fichiers de l'annonce:", error);
    return 0;
  }
  return data?.length ?? 0;
}
