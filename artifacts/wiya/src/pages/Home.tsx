import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { MapPin, Search, X, ChevronDown } from "lucide-react";
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
    <div className="animate-pulse">
      <div className="aspect-square rounded-[18px] bg-muted" />
      <div className="h-4 bg-muted rounded w-1/2 mt-3" />
      <div className="h-3 bg-muted rounded w-5/6 mt-2" />
      <div className="h-3 bg-muted rounded w-1/3 mt-2" />
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
    const { data } = await supabase
      .from("listings")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });
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
  // Les annonces mises à la une passent en premier (le tri garde l'ordre par date)
  const sorted = [...filteredListings].sort(
    (a, b) => Number(!!b.is_boosted) - Number(!!a.is_boosted)
  );

  const searchPlaceholder = isRTL
    ? "سيارة، هاتف، شقة..."
    : "Une voiture, un téléphone, un appartement...";
  const wilayaPlaceholder = isRTL ? "ابحث عن ولاية..." : "Rechercher une wilaya...";

  const closeWilayaPicker = () => {
    setShowWilayaPicker(false);
    setWilayaSearch("");
  };

  const chipClass = (active: boolean) =>
    `flex-none px-4 py-2.5 rounded-full text-[14px] whitespace-nowrap transition-colors ${
      active
        ? "bg-foreground text-background font-bold"
        : "bg-card ring-1 ring-border text-foreground font-medium"
    }`;

  return (
    <div className="bg-card min-h-[100dvh] pb-[calc(7rem+env(safe-area-inset-bottom))]">
      {/* ─── En-tête : logo, wilaya, langue (couleurs du thème : clair ET sombre) ─── */}
      <div className="sticky top-0 z-30 bg-card pt-[env(safe-area-inset-top)]">
        <div className="flex items-center justify-between px-5 h-16">
          <span dir="ltr" className="font-display text-[30px] font-extrabold tracking-tight leading-none text-foreground">
            Wiya<span className="text-primary">.</span>
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowWilayaPicker(true)}
              className="flex items-center gap-1.5 bg-card ring-1 ring-border rounded-full px-3.5 py-2 text-[14px] font-bold text-foreground active:scale-95 transition-transform"
            >
              <MapPin className="w-4 h-4 text-primary" />
              {wilayaLabel(activeWilaya ?? user?.wilaya ?? "Alger")}
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
            <button
              onClick={() => setLang(lang === "fr" ? "ar" : "fr")}
              aria-label="Langue"
              className="w-10 h-10 rounded-full bg-card ring-1 ring-border text-[14px] font-bold text-foreground flex items-center justify-center active:scale-95 transition-transform"
            >
              {lang === "fr" ? "ع" : "FR"}
            </button>
          </div>
        </div>
      </div>

      {/* ─── Recherche ─── */}
      <div className="px-5 pt-1">
        <button
          onClick={() => navigate("/search")}
          className="w-full flex items-center gap-2.5 bg-muted rounded-2xl px-4 py-3.5 text-start active:scale-[0.99] transition-transform"
        >
          <Search className="w-5 h-5 text-foreground flex-shrink-0" />
          <span className="flex-1 text-[15px] text-muted-foreground truncate">{searchPlaceholder}</span>
        </button>
      </div>

      {/* ─── Catégories ─── */}
      <div className="flex gap-2 overflow-x-auto scrollbar-none px-5 pt-4 pb-1">
        <button onClick={() => setActiveCategory(null)} className={chipClass(activeCategory === null)}>
          {tr("Tout", "الكل")}
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
            className={chipClass(activeCategory === cat.id)}
          >
            {t(cat.id as any)}
          </button>
        ))}
      </div>

      {/* ─── Wilaya choisie ─── */}
      {activeWilaya && (
        <div className="px-5 pt-3">
          <button
            onClick={() => setActiveWilaya(null)}
            className="inline-flex items-center gap-1.5 ps-3 pe-2 py-1.5 bg-primary/10 rounded-full text-xs font-semibold text-primary"
          >
            <MapPin className="w-3.5 h-3.5" />
            {wilayaLabel(activeWilaya)}
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ─── Annonces ─── */}
      <div className="px-5 pt-6 pb-3 flex items-baseline justify-between">
        <h2 className="font-display text-[22px] font-extrabold text-foreground">
          {tr("Nouvelles annonces", "أحدث الإعلانات")}
        </h2>
        <button onClick={() => navigate("/search")} className="text-[14px] font-bold text-primary">
          {tr("Voir tout", "عرض الكل")}
        </button>
      </div>

      {!loading && sorted.length === 0 && (
        <div className="text-center py-12 px-8">
          <p className="text-sm font-semibold text-foreground">{t("noResults")}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {tr("Essayez une autre catégorie ou wilaya.", "جرّب فئة أو ولاية أخرى.")}
          </p>
        </div>
      )}

      <div className="px-5 grid grid-cols-2 gap-x-3 gap-y-5">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <ListingSkeleton key={i} />)
          : sorted.map((listing) => <ListingCard key={listing.id} listing={listing} variant="grid" />)}
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
