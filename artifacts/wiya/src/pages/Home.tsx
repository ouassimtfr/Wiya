import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { MapPin, Search, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { CATEGORIES } from "@/lib/data";
import { WILAYAS_DATA } from "@/lib/wilayas";
import { supabase } from "@/lib/supabase";
import ListingCard from "@/components/ListingCard";

const WILAYA_LIST = WILAYAS_DATA.slice().sort((a, b) => a.code - b.code);

function normalize(str: string) {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function useVisualViewport() {
  const read = () => ({
    height: window.visualViewport?.height ?? window.innerHeight,
    offsetTop: window.visualViewport?.offsetTop ?? 0,
  });
  const [vp, setVp] = useState(read);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => setVp(read());
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    update();
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, []);

  return vp;
}

// Carte "fantôme" affichée pendant le chargement des annonces
function ListingSkeleton() {
  return (
    <div className="bg-card border border-border rounded-3xl flex gap-3 p-3 shadow-sm animate-pulse">
      <div className="w-24 h-24 rounded-2xl bg-muted flex-shrink-0" />
      <div className="flex-1 py-1 space-y-2.5">
        <div className="h-3.5 bg-muted rounded w-3/4" />
        <div className="h-4 bg-muted rounded w-1/2" />
        <div className="h-3 bg-muted rounded w-1/3" />
      </div>
    </div>
  );
}

export default function Home() {
  const { t, lang, setLang, isRTL } = useI18n();
  const tr = (fr: string, ar: string) => (isRTL ? ar : fr);
  const { user } = useStore();
  const [, navigate] = useLocation();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeWilaya, setActiveWilaya] = useState<string | null>(null);
  const [showWilayaPicker, setShowWilayaPicker] = useState(false);
  const [wilayaSearch, setWilayaSearch] = useState("");
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const viewport = useVisualViewport();

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    const { data } = await supabase.from("listings").select("*").eq("is_active", true).order("created_at", { ascending: false });
    if (data) setListings(data);
    setLoading(false);
  };

  const wilayaLabel = (name: string) => {
    const w = WILAYA_LIST.find((x) => x.name === name);
    return w && isRTL ? w.nameAr : name;
  };

  const q = normalize(wilayaSearch);
  const filteredWilayas = WILAYA_LIST.filter(
    (w) =>
      !q ||
      normalize(w.name).includes(q) ||
      w.nameAr.includes(wilayaSearch.trim()) ||
      String(w.code).padStart(2, "0").startsWith(q) ||
      String(w.code) === q
  );

  const filteredListings = listings.filter(
    (l) =>
      (!activeCategory || l.category === activeCategory) &&
      (!activeWilaya || l.wilaya === activeWilaya)
  );
  const featured = filteredListings.filter((l) => l.is_boosted);
  const others = filteredListings.filter((l) => !l.is_boosted);
  const activeCategoryData = CATEGORIES.find((c) => c.id === activeCategory);

  const searchPlaceholder = isRTL ? "ابحث عن إعلان (مثال: كليو 5 2020)" : "Rechercher (ex: Clio 5 2020)";
  const wilayaPlaceholder = isRTL ? "ابحث عن ولاية..." : "Rechercher une wilaya...";

  const closeWilayaPicker = () => {
    setShowWilayaPicker(false);
    setWilayaSearch("");
  };

  return (
    <div className="bg-background min-h-screen pb-6">
      {/* ─── En-tête émeraude ─── */}
      <div className="relative bg-[#0A7C59] dark:bg-[#0E3B2D] text-white px-5 pt-[calc(2.5rem+env(safe-area-inset-top))] pb-16 rounded-b-[32px] overflow-hidden">
        <div className="absolute -top-16 -end-16 w-56 h-56 rounded-full border-[34px] border-white/[0.08] pointer-events-none" />

        <div className="relative z-10 flex items-center justify-between">
          <button
            onClick={() => setShowWilayaPicker(true)}
            className="flex items-center gap-1.5 bg-white/15 px-3 py-2 rounded-full text-sm font-semibold active:scale-95 transition-transform"
          >
            <MapPin className="w-4 h-4" />
            {wilayaLabel(activeWilaya ?? user?.wilaya ?? "Alger")}
          </button>
          <span className="font-display text-3xl font-extrabold tracking-tight">Wiya</span>
          <button
            onClick={() => setLang(lang === "fr" ? "ar" : "fr")}
            className="bg-white/15 text-sm font-bold px-3.5 py-2 rounded-full active:scale-95 transition-transform"
          >
            {lang === "fr" ? "العربية" : "FR"}
          </button>
        </div>

        <h1 className="relative z-10 mt-5 text-2xl font-bold leading-tight max-w-[16ch]">
          {tr("Achetez et vendez près de chez vous", "اشترِ وبع بالقرب منك")}
        </h1>
      </div>

      {/* ─── Barre de recherche (chevauche l'en-tête) ─── */}
      <button
        onClick={() => navigate("/search")}
        className="relative z-20 -mt-7 mx-4 w-[calc(100%-2rem)] flex items-center gap-3 bg-card border border-border rounded-2xl px-4 py-3.5 shadow-lg text-start active:scale-[0.99] transition-transform"
      >
        <Search className="w-5 h-5 text-muted-foreground flex-shrink-0" />
        <span className="flex-1 text-[15px] text-muted-foreground truncate">{searchPlaceholder}</span>
      </button>

      {/* ─── Catégories (défilement horizontal) ─── */}
      <div className="flex gap-3 overflow-x-auto scrollbar-none px-4 pt-5 pb-1">
        {CATEGORIES.map((cat) => {
          const active = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(active ? null : cat.id)}
              className="flex-none flex flex-col items-center gap-1.5 w-[70px]"
            >
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl border transition-colors ${
                  active ? "bg-primary border-primary" : "bg-card border-border"
                }`}
              >
                {cat.icon}
              </div>
              <span
                className={`text-[11px] font-semibold text-center leading-tight ${
                  active ? "text-primary" : "text-foreground"
                }`}
              >
                {t(cat.id as any)}
              </span>
            </button>
          );
        })}
      </div>

      {/* ─── Filtres actifs ─── */}
      {(activeWilaya || activeCategoryData) && (
        <div className="flex items-center gap-2 flex-wrap px-4 pt-3">
          {activeWilaya && (
            <button
              onClick={() => setActiveWilaya(null)}
              className="flex items-center gap-1.5 ps-3 pe-2 py-1.5 bg-primary/10 rounded-full text-xs font-semibold text-primary"
            >
              <MapPin className="w-3.5 h-3.5" />
              {wilayaLabel(activeWilaya)}
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          {activeCategoryData && (
            <button
              onClick={() => setActiveCategory(null)}
              className="flex items-center gap-1.5 ps-3 pe-2 py-1.5 bg-primary/10 rounded-full text-xs font-semibold text-primary"
            >
              <span>{activeCategoryData.icon}</span>
              {t(activeCategoryData.id as any)}
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* ─── À la une (annonces boostées) ─── */}
      {!loading && featured.length > 0 && (
        <>
          <div className="px-5 pt-6 pb-3">
            <h2 className="text-xl font-bold text-foreground">{tr("À la une", "مميّز")}</h2>
          </div>
          <div className="flex gap-3 overflow-x-auto scrollbar-none snap-x snap-mandatory px-4 pb-2">
            {featured.map((listing) => (
              <ListingCard key={listing.id} listing={listing} variant="featured" />
            ))}
          </div>
        </>
      )}

      {/* ─── Nouvelles annonces ─── */}
      <div className="px-5 pt-6 pb-3">
        <h2 className="text-xl font-bold text-foreground">{tr("Nouvelles annonces", "أحدث الإعلانات")}</h2>
      </div>

      <div className="px-4 space-y-3">
        {!loading && filteredListings.length === 0 && (
          <div className="text-center py-10">
            <p className="text-sm text-muted-foreground">{t("noResults")}</p>
          </div>
        )}
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <ListingSkeleton key={i} />)
          : others.map((listing) => <ListingCard key={listing.id} listing={listing} variant="list" />)}
      </div>

      {/* ─── Choix de la wilaya ─── */}
      <AnimatePresence>
        {showWilayaPicker && (
          <div
            className="fixed left-0 right-0 bg-black/40 z-[9999] flex items-end"
            style={{ top: viewport.offsetTop, height: viewport.height }}
            onClick={closeWilayaPicker}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card w-full max-w-[430px] mx-auto rounded-t-3xl flex flex-col overflow-hidden"
              style={{ maxHeight: viewport.height * 0.9 }}
            >
              <div className="p-4 flex-shrink-0">
                <input
                  type="text"
                  value={wilayaSearch}
                  onChange={(e) => setWilayaSearch(e.target.value)}
                  placeholder={wilayaPlaceholder}
                  className="w-full bg-muted p-3 rounded-xl outline-none text-base text-foreground"
                />
              </div>
              <div className="overflow-y-auto min-h-0 px-4 pb-6 grid grid-cols-2 gap-2">
                {filteredWilayas.map((w) => (
                  <button
                    key={w.code}
                    onClick={() => {
                      setActiveWilaya(w.name);
                      closeWilayaPicker();
                    }}
                    className={`p-3 rounded-xl text-sm text-start ${
                      activeWilaya === w.name ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                    }`}
                  >
                    <span className="opacity-50 text-xs">{String(w.code).padStart(2, "0")}</span>{" "}
                    {isRTL ? w.nameAr : w.name}
                  </button>
                ))}
                {filteredWilayas.length === 0 && (
                  <p className="col-span-2 text-center text-sm text-muted-foreground py-6">{t("noResults")}</p>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
