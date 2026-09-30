import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Search, X, SlidersHorizontal, MapPin, Clock, Zap } from "lucide-react";
import { supabase } from "@/lib/supabase";

// Si ta page détail d'annonce a une autre adresse, change seulement cette ligne
const listingPath = (id: string) => `/listing/${id}`;

type Sort = "relevance" | "recent" | "price_asc" | "price_desc";

const RECENT_KEY = "wiya_recent_searches";

function loadRecent(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveRecent(term: string) {
  try {
    const next = [term, ...loadRecent().filter((t) => t.toLowerCase() !== term.toLowerCase())].slice(0, 8);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {}
}

function clearRecent() {
  try {
    localStorage.removeItem(RECENT_KEY);
  } catch {}
}

function formatPrice(p: number) {
  if (!p && p !== 0) return "";
  return `${Number(p).toLocaleString("fr-FR")} DA`;
}

function prettyCategory(id: string) {
  const s = (id || "").replace(/[-_]/g, " ");
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function SearchPage() {
  const [, navigate] = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);

  const initialQ = new URLSearchParams(window.location.search).get("q") ?? "";
  const [query, setQuery] = useState(initialQ);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [recent, setRecent] = useState<string[]>(loadRecent());

  const [category, setCategory] = useState<string>("");
  const [wilaya, setWilaya] = useState<string>("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState<Sort>("relevance");
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    if (!initialQ) inputRef.current?.focus();
  }, []);

  // Recherche (avec un petit délai pendant la frappe)
  useEffect(() => {
    const q = query.trim();
    window.history.replaceState(null, "", q ? `?q=${encodeURIComponent(q)}` : window.location.pathname);

    if (!q) {
      setResults([]);
      setSearched(false);
      setError(null);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);

      const terms = q
        .split(/\s+/)
        .map((t) => t.replace(/[%,()*\\]/g, ""))
        .filter(Boolean);

      let req = supabase
        .from("listings")
        .select("id, title, price, category, wilaya, city, condition, images, is_boosted, is_urgent, is_negotiable, created_at")
        .eq("is_active", true);

      terms.forEach((t) => {
        req = req.or(`title.ilike.%${t}%,description.ilike.%${t}%`);
      });

      const { data, error: err } = await req
        .order("is_boosted", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false })
        .limit(200);

      if (err) {
        console.error("Erreur recherche:", err);
        setError("La recherche a échoué. Réessayez dans un instant.");
        setResults([]);
      } else {
        setResults(data || []);
        saveRecent(q);
        setRecent(loadRecent());
      }
      setCategory("");
      setSearched(true);
      setLoading(false);
    }, 350);

    return () => clearTimeout(timer);
  }, [query]);

  // Catégories et wilayas déduites des résultats
  const categories = useMemo(() => {
    const map = new Map<string, number>();
    results.forEach((r) => r.category && map.set(r.category, (map.get(r.category) || 0) + 1));
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [results]);

  const wilayas = useMemo(() => {
    const set = new Set<string>();
    results.forEach((r) => r.wilaya && set.add(r.wilaya));
    return Array.from(set).sort((a, b) => a.localeCompare(b, "fr"));
  }, [results]);

  const filtered = useMemo(() => {
    const min = minPrice ? Number(minPrice) : null;
    const max = maxPrice ? Number(maxPrice) : null;
    const out = results.filter((r) => {
      if (category && r.category !== category) return false;
      if (wilaya && r.wilaya !== wilaya) return false;
      if (min !== null && Number(r.price) < min) return false;
      if (max !== null && Number(r.price) > max) return false;
      return true;
    });
    if (sort === "price_asc") out.sort((a, b) => Number(a.price) - Number(b.price));
    else if (sort === "price_desc") out.sort((a, b) => Number(b.price) - Number(a.price));
    else if (sort === "recent") out.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return out;
  }, [results, category, wilaya, minPrice, maxPrice, sort]);

  const activeFilters = (wilaya ? 1 : 0) + (minPrice || maxPrice ? 1 : 0) + (sort !== "relevance" ? 1 : 0);

  const resetFilters = () => {
    setWilaya("");
    setMinPrice("");
    setMaxPrice("");
    setSort("relevance");
  };

  return (
    <div className="min-h-[100dvh] bg-[#F4F6F5] pb-28">
      {/* Barre de recherche */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-100 pt-[calc(env(safe-area-inset-top)+10px)]">
        <div className="px-3 pb-3 flex items-center gap-2">
          <button onClick={() => navigate("/")} className="p-2 -ml-1 rounded-full active:bg-gray-100">
            <ArrowLeft className="w-5 h-5 text-gray-800" />
          </button>
          <div className="flex-1 flex items-center gap-2 bg-gray-100 rounded-2xl px-3.5 py-2.5">
            <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              enterKeyHint="search"
              placeholder="Rechercher une annonce (ex : Clio 4, iPhone, emploi)"
              className="flex-1 bg-transparent text-base focus:outline-none placeholder:text-gray-400 min-w-0"
            />
            {query && (
              <button onClick={() => setQuery("")} className="p-0.5">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            )}
          </div>
          {searched && (
            <button
              onClick={() => setSheetOpen(true)}
              className="relative p-2.5 rounded-2xl bg-gray-100 active:bg-gray-200"
            >
              <SlidersHorizontal className="w-5 h-5 text-gray-700" />
              {activeFilters > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#1B6B3A] text-white text-[10px] font-bold flex items-center justify-center">
                  {activeFilters}
                </span>
              )}
            </button>
          )}
        </div>

        {/* Catégories */}
        {searched && categories.length > 0 && (
          <div className="flex gap-2 overflow-x-auto px-3 pb-3 no-scrollbar">
            <button
              onClick={() => setCategory("")}
              className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-[13px] font-semibold transition-colors ${
                category === "" ? "bg-[#1B6B3A] text-white" : "bg-gray-100 text-gray-600"
              }`}
            >
              Tout ({results.length})
            </button>
            {categories.map(([cat, count]) => (
              <button
                key={cat}
                onClick={() => setCategory(category === cat ? "" : cat)}
                className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-[13px] font-semibold transition-colors ${
                  category === cat ? "bg-[#1B6B3A] text-white" : "bg-gray-100 text-gray-600"
                }`}
              >
                {prettyCategory(cat)} ({count})
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Recherches récentes */}
      {!query.trim() && (
        <div className="px-4 pt-5">
          {recent.length > 0 ? (
            <>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-bold text-gray-800">Recherches récentes</p>
                <button
                  onClick={() => {
                    clearRecent();
                    setRecent([]);
                  }}
                  className="text-xs font-semibold text-[#1B6B3A]"
                >
                  Effacer
                </button>
              </div>
              <ul className="bg-white rounded-2xl shadow-sm overflow-hidden">
                {recent.map((t) => (
                  <li key={t}>
                    <button
                      onClick={() => setQuery(t)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left active:bg-gray-50 border-b border-gray-50 last:border-0"
                    >
                      <Clock className="w-4 h-4 text-gray-300" />
                      <span className="text-sm text-gray-700">{t}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <div className="flex flex-col items-center text-center pt-20 px-8">
              <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center mb-4">
                <Search className="w-7 h-7 text-[#1B6B3A]" />
              </div>
              <p className="text-sm font-bold text-gray-700">Que cherchez-vous ?</p>
              <p className="text-xs text-gray-400 mt-1">
                Tapez un nom, une marque ou un métier : toutes les annonces correspondantes s'affichent.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Résultats */}
      {query.trim() && (
        <div className="px-3 pt-3">
          {loading && <p className="text-center text-sm text-gray-400 py-10">Recherche en cours...</p>}

          {error && <p className="text-center text-sm text-red-500 py-10">{error}</p>}

          {!loading && !error && searched && (
            <>
              <p className="text-xs font-semibold text-gray-500 px-1 mb-2">
                {filtered.length} annonce{filtered.length > 1 ? "s" : ""}
              </p>

              {filtered.length === 0 ? (
                <div className="flex flex-col items-center text-center pt-16 px-8">
                  <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center mb-4">
                    <Search className="w-7 h-7 text-gray-300" />
                  </div>
                  <p className="text-sm font-bold text-gray-700">Aucune annonce trouvée</p>
                  <p className="text-xs text-gray-400 mt-1">Essayez un autre mot ou retirez des filtres.</p>
                  {activeFilters > 0 && (
                    <button onClick={resetFilters} className="mt-4 text-sm font-semibold text-[#1B6B3A]">
                      Réinitialiser les filtres
                    </button>
                  )}
                </div>
              ) : (
                <ul className="flex flex-col gap-2.5">
                  {filtered.map((l) => (
                    <li key={l.id}>
                      <button
                        onClick={() => navigate(listingPath(l.id))}
                        className="w-full flex gap-3 bg-white rounded-2xl shadow-sm p-2.5 text-left active:scale-[0.99] transition-transform"
                      >
                        <div className="relative w-28 h-28 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                          {l.images?.[0] && <img src={l.images[0]} alt="" className="w-full h-full object-cover" loading="lazy" />}
                          {l.is_boosted && (
                            <span className="absolute top-1.5 left-1.5 bg-[#C8972B] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                              À la une
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 py-0.5 flex flex-col">
                          <p className="text-[15px] font-bold text-gray-900 line-clamp-2 leading-snug">{l.title}</p>
                          <p className="text-base font-extrabold text-[#1B6B3A] mt-1">{formatPrice(l.price)}</p>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1">
                            {l.is_urgent && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded-md">
                                <Zap className="w-3 h-3" /> Urgent
                              </span>
                            )}
                            {l.is_negotiable && (
                              <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-md">
                                Négociable
                              </span>
                            )}
                            {l.condition && (
                              <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-md">
                                {l.condition === "new" ? "Neuf" : "Occasion"}
                              </span>
                            )}
                          </div>
                          <p className="mt-auto flex items-center gap-1 text-xs text-gray-400 truncate">
                            <MapPin className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{[l.city, l.wilaya].filter(Boolean).join(", ")}</span>
                          </p>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      )}

      {/* Filtres */}
      {sheetOpen && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSheetOpen(false)} />
          <div className="relative w-full bg-white rounded-t-3xl px-5 pt-5 pb-[max(env(safe-area-inset-bottom),20px)] max-h-[85dvh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-extrabold text-gray-900">Filtres</h2>
              <button onClick={() => setSheetOpen(false)} className="p-1.5 rounded-full bg-gray-100">
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <p className="text-sm font-bold text-gray-800 mb-2">Wilaya</p>
            <select
              value={wilaya}
              onChange={(e) => setWilaya(e.target.value)}
              className="w-full bg-gray-100 rounded-xl px-3.5 py-3 text-base mb-5 focus:outline-none"
            >
              <option value="">Toute l'Algérie</option>
              {wilayas.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>

            <p className="text-sm font-bold text-gray-800 mb-2">Prix (DA)</p>
            <div className="flex gap-3 mb-5">
              <input
                type="number"
                inputMode="numeric"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="Min"
                className="flex-1 min-w-0 bg-gray-100 rounded-xl px-3.5 py-3 text-base focus:outline-none"
              />
              <input
                type="number"
                inputMode="numeric"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="Max"
                className="flex-1 min-w-0 bg-gray-100 rounded-xl px-3.5 py-3 text-base focus:outline-none"
              />
            </div>

            <p className="text-sm font-bold text-gray-800 mb-2">Trier par</p>
            <div className="flex flex-wrap gap-2 mb-6">
              {[
                { id: "relevance" as const, label: "Pertinence" },
                { id: "recent" as const, label: "Plus récentes" },
                { id: "price_asc" as const, label: "Prix croissant" },
                { id: "price_desc" as const, label: "Prix décroissant" },
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSort(s.id)}
                  className={`px-3.5 py-2 rounded-full text-[13px] font-semibold ${
                    sort === s.id ? "bg-[#1B6B3A] text-white" : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button onClick={resetFilters} className="flex-1 py-3.5 rounded-2xl bg-gray-100 text-gray-700 font-semibold text-sm">
                Réinitialiser
              </button>
              <button
                onClick={() => setSheetOpen(false)}
                className="flex-1 py-3.5 rounded-2xl bg-[#1B6B3A] text-white font-semibold text-sm shadow-md"
              >
                Voir {filtered.length} résultat{filtered.length > 1 ? "s" : ""}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
