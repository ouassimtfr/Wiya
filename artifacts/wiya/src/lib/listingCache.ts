// Petite mémoire : la carte cliquée donne son annonce à la page de détail,
// qui peut ainsi s'afficher tout de suite sans attendre le serveur.
const cache = new Map<string, any>();

export function rememberListing(listing: any) {
  if (listing && listing.id != null) cache.set(String(listing.id), listing);
}

export function getCachedListing(id?: string) {
  if (!id) return null;
  return cache.get(String(id)) ?? null;
}
