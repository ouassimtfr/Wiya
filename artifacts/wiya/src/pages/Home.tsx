import { useState, useEffect } from "react";
import { MapPin, Search, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { CATEGORIES } from "@/lib/data";
import { WILAYAS_DATA } from "@/lib/wilayas";
import { supabase } from "@/lib/supabase";
import ListingCard from "@/components/ListingCard";

// Noms des wilayas triés par leur code officiel (1 à 69)
const WILAYA_NAMES = WILAYAS_DATA.slice()
  .sort((a, b) => a.code - b.code)
  .map((w) => w.name);

// Suit la hauteur réelle visible de l'écran (moins le clavier) sur mobile
function useVisualViewportHeight() {
  const [height, setHeight] = useState(
    () => window.visualViewport?.height ?? window.innerHeight
  );

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => setHeight(vv.height);
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    update();
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, []);

  return height;
}

// Enlève les accents et met en minuscule, pour que "megane" matche "Mégane"
function normalize(str: string) {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

// Chiffres écrits en toutes lettres -> chiffre, pour que "Clio cinq" retrouve
// une annonce écrite "Clio 5" (les vendeurs écrivent presque toujours en chiffre)
const FRENCH_NUMBER_WORDS: Record<string, string> = {
  zero: "0", un: "1", une: "1", deux: "2", trois: "3", quatre: "4",
  cinq: "5", six: "6", sept: "7", huit: "8", neuf: "9", dix: "10",
};

// Vérifie que CHAQUE mot tapé se retrouve dans le texte de l'annonce
// (titre + description + catégorie + marque/modèle/année véhicule) — peu importe l'ordre.
function matchesSearch(haystackText: string, query: string) {
  if (!query.trim()) return true;
  const words = normalize(query)
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => FRENCH_NUMBER_WORDS[w] ?? w);
  return words.every((word) => haystackText.includes(word));
}

export default function Home() {
  const { t, lang, setLang } = useI18n();
  const { user } = useStore();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeWilaya, setActiveWilaya] = useState<string | null>(null);
  const [showWilayaPicker, setShowWilayaPicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [wilayaSearch, setWilayaSearch] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [listings, setListings] = useState<any[]>([]);
  const viewportHeight = useVisualViewportHeight();

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    const { data } = await supabase.from("listings").select("*").eq("is_active", true).order("created_at", { ascending: false });
    if (data) setListings(data);
  };

  // Texte de recherche complet d'une annonce : titre + description + catégorie traduite
  // + marque/modèle/année du véhicule (si l'annonce en a)
  const getSearchHaystack = (listing: any) => {
    const categoryLabel = CATEGORIES.some((c) => c.id === listing.category) ? t(listing.category as any) : "";
    const vehicleInfo = `${listing.vehicle_brand ?? ""} ${listing.vehicle_model ?? ""} ${listing.vehicle_year ?? ""}`;
    return normalize(`${listing.title ?? ""} ${listing.description ?? ""} ${categoryLabel} ${vehicleInfo}`);
  };

  const filteredWilayas = WILAYA_NAMES.filter((w) => w.toLowerCase().includes(wilayaSearch.toLowerCase()));
  const filteredListings = listings.filter(
    (l) =>
      (!activeCategory || l.category === activeCategory) &&
      (!activeWilaya || l.wilaya === activeWilaya) &&
      matchesSearch(getSearchHaystack(l), searchQuery)
  );
  const activeCategoryData = CATEGORIES.find((c) => c.id === activeCategory);

  return (
    <div className="bg-[#F4F6F5] min-h-screen pb-20">
      <div className="relative bg-gradient-to-b from-[#0B1F16] to-[#132C20] pb-10 pt-12 px-6 overflow-hidden border-b border-[#C7A44A]/25">
        {/* Signature : motif étoilé à 8 branches, en filigrane dans le coin */}
        <svg
          className="absolute -top-12 -right-12 w-64 h-64 text-[#C7A44A]/[0.14] pointer-events-none"
          viewBox="0 0 100 100"
          fill="none"
        >
          <rect x="20" y="20" width="60" height="60" stroke="currentColor" strokeWidth="0.5" />
          <rect x="20" y="20" width="60" height="60" stroke="currentColor" strokeWidth="0.5" transform="rotate(45 50 50)" />
        </svg>

        <div className="relative z-10 flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowWilayaPicker(true)}
              className="flex items-center gap-2 bg-[#C7A44A]/10 backdrop-blur-md px-3 py-1 rounded-full border border-[#C7A44A]/25 active:scale-95 transition-transform"
            >
              <MapPin className="w-3 h-3 text-[#C7A44A]" />
              <span className="text-[#F3EEE2] text-[11px] font-semibold uppercase tracking-wide">{activeWilaya ?? user?.wilaya ?? "ALGER"}</span>
            </button>
            <button onClick={() => setLang(lang === "fr" ? "ar" : "fr")} className="bg-[#C7A44A]/10 backdrop-blur-md text-[#F3EEE2] text-[10px] font-bold px-4 py-1.5 rounded-full border border-[#C7A44A]/25">
              {lang === "fr" ? "العربية" : "FR"}
            </button>
          </div>
          <div className="flex items-baseline gap-2">
            <h1 className="text-[#F3EEE2] text-3xl font-bold tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
              <span className="text-[#C7A44A]">W</span>iya
            </h1>
            <span className="h-[3px] w-[3px] rounded-full bg-[#C7A44A]/70 self-center" />
            <span className="text-[#F3EEE2]/50 text-[10px] uppercase tracking-[0.2em]">Marketplace</span>
          </div>

          {/* Barre de recherche : marche pour tout (voitures, motos, immo...) par mot-clé + catégorie + marque/modèle/année */}
          <div className="flex items-center gap-2 bg-white/95 rounded-2xl px-4 py-3 shadow-md">
            <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("searchPlaceholder") ?? "Rechercher (ex: Clio 5 2020)"}
              className="flex-1 outline-none text-sm text-gray-800 bg-transparent placeholder:text-gray-400"
              style={{ colorScheme: "light" }}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")}>
                <X className="w-4 h-4 text-gray-400" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 -mt-8 relative z-20 space-y-5">
        <div className="bg-white p-5 rounded-3xl shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-gray-800">{t("categories")}</h2>
            <button onClick={() => setShowCategoryPicker(true)} className="text-xs text-[#1B6B3A] font-semibold">{t("seeAll")}</button>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {CATEGORIES.slice(0, 5).map((cat) => (
              <button key={cat.id} onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)} className="flex flex-col items-center gap-1.5">
                <div className={`w-10 h-10 flex items-center justify-center rounded-2xl text-lg transition-colors ${activeCategory === cat.id ? "bg-[#1B6B3A]/15 ring-2 ring-[#1B6B3A]" : "bg-gray-50"}`}>{cat.icon}</div>
                <span className="text-[9px] font-semibold text-gray-600 text-center leading-tight">{t(cat.id as any)}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
           <div className="flex items-center bg-white border border-gray-200 rounded-full shadow-sm">
            <button onClick={() => setShowWilayaPicker(true)} className="flex items-center gap-2 pl-4 pr-2 py-2 text-xs font-semibold text-gray-600">
              <MapPin className="w-3.5 h-3.5" /> {activeWilaya ?? t("wilaya")}
            </button>
            {activeWilaya && <button onClick={() => setActiveWilaya(null)} className="pr-3 py-2"><X className="w-3.5 h-3.5 text-gray-500" /></button>}
          </div>
          {activeCategoryData && (
            <button onClick={() => setActiveCategory(null)} className="flex items-center gap-1.5 pl-3 pr-2 py-2 bg-[#1B6B3A]/10 rounded-full text-xs font-semibold text-[#1B6B3A]">
              <span>{activeCategoryData.icon}</span>
              <span>{t(activeCategoryData.id as any)}</span>
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {searchQuery && filteredListings.length === 0 && (
          <div className="text-center py-10">
            <p className="text-sm text-gray-500">{t("noResults") ?? "Aucune annonce trouvée"}</p>
          </div>
        )}

        <div className="space-y-3">
          {filteredListings.map((listing) => <ListingCard key={listing.id} listing={listing} variant="list" />)}
        </div>
      </div>

      <AnimatePresence>
        {/* MODALE CATEGORIES */}
        {showCategoryPicker && (
          <div className="fixed inset-0 bg-black/40 z-[9999] flex items-end" onClick={() => setShowCategoryPicker(false)}>
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} onClick={(e) => e.stopPropagation()} className="bg-white w-full max-w-[430px] mx-auto rounded-t-3xl flex flex-col max-h-[85vh] overflow-hidden">
              <div className="px-6 pt-6"><div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-6" /></div>
              <div className="overflow-y-auto px-6 pb-20 grid grid-cols-4 gap-3">
                {CATEGORIES.map((cat) => (
                  <button key={cat.id} onClick={() => { setActiveCategory(cat.id); setShowCategoryPicker(false); }} className="p-3 rounded-2xl flex flex-col items-center gap-1.5 bg-gray-50">
                    <span className="text-xl">{cat.icon}</span>
                    <span className="text-[10px] font-bold text-gray-700 text-center">{t(cat.id as any)}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}

        {/* MODALE WILAYA */}
        {showWilayaPicker && (
          <div className="fixed inset-0 bg-black/40 z-[9999] flex items-end" onClick={() => setShowWilayaPicker(false)}>
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full max-w-[430px] mx-auto rounded-t-3xl flex flex-col overflow-hidden"
              style={{ maxHeight: viewportHeight * 0.85 }}
            >
              <div className="p-4 flex-shrink-0">
                <input
                  autoFocus
                  type="text"
                  value={wilayaSearch}
                  onChange={(e) => setWilayaSearch(e.target.value)}
                  placeholder={t("searchWilaya")}
                  className="w-full bg-gray-100 p-3 rounded-xl outline-none text-sm"
                  style={{ colorScheme: "light" }}
                />
              </div>
              <div className="overflow-y-auto min-h-0 px-4 pb-6 grid grid-cols-2 gap-2">
                {filteredWilayas.map((w) => (
                  <button key={w} onClick={() => { setActiveWilaya(w); setShowWilayaPicker(false); setWilayaSearch(""); }} className={`p-3 rounded-xl text-sm ${activeWilaya === w ? "bg-[#1B6B3A] text-white" : "bg-gray-50"}`}>{w}</button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
