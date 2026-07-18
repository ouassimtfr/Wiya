import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { MapPin, Search, ChevronRight, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { CATEGORIES, WILAYAS } from "@/lib/data";
import { supabase } from "@/lib/supabase";
import ListingCard from "@/components/ListingCard";

const HEADER_PATTERN =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'%3E%3Cg fill='none' stroke='%23FFFFFF' stroke-width='1.2'%3E%3Cpath d='M30 4 L52 30 L30 56 L8 30 Z'/%3E%3Ccircle cx='30' cy='30' r='2.5' fill='%23FFFFFF'/%3E%3C/g%3E%3C/svg%3E";

// FIX iOS Safari : mesure la vraie hauteur visible de l'écran (visualViewport),
// qui se met à jour en temps réel quand le clavier s'ouvre/se ferme.
// Contrairement à vh/dvh en CSS, ça ne "rate" jamais le recalcul pendant la saisie.
function useVisualViewportHeight() {
  const [height, setHeight] = useState<number>(() =>
    typeof window !== "undefined" ? (window.visualViewport?.height ?? window.innerHeight) : 800
  );

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => setHeight(vv.height);
    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, []);

  return height;
}

export default function Home() {
  const [, navigate] = useLocation();
  const { t, lang, setLang } = useI18n();
  const { user } = useStore();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeWilaya, setActiveWilaya] = useState<string | null>(null);
  const [showWilayaPicker, setShowWilayaPicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [wilayaSearch, setWilayaSearch] = useState("");
  const [listings, setListings] = useState<any[]>([]);
  const vvh = useVisualViewportHeight();

  useEffect(() => {
    fetchListings();
  }, []);

  // FIX iOS Safari : quand une modale est ouverte et qu'on tape dans un champ,
  // le body se met à scroller "derrière" la modale et pousse tout hors de l'écran.
  useEffect(() => {
    const modalOpen = showWilayaPicker || showCategoryPicker;
    if (modalOpen) {
      const scrollY = window.scrollY;
      const originalOverflow = document.body.style.overflow;
      const originalPosition = document.body.style.position;
      const originalTop = document.body.style.top;
      const originalWidth = document.body.style.width;

      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";

      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.position = originalPosition;
        document.body.style.top = originalTop;
        document.body.style.width = originalWidth;
        window.scrollTo(0, scrollY);
      };
    }
  }, [showWilayaPicker, showCategoryPicker]);

  const fetchListings = async () => {
    const { data } = await supabase.from("listings").select("*").eq("is_active", true).order("created_at", { ascending: false });
    if (data) setListings(data);
  };

  const filteredWilayas = WILAYAS.filter((w) => w.toLowerCase().includes(wilayaSearch.toLowerCase()));

  // FIX : le filtrage par catégorie / wilaya n'était jamais appliqué aux annonces affichées.
  const filteredListings = listings.filter((l) => {
    const matchCategory = !activeCategory || l.category === activeCategory;
    const matchWilaya = !activeWilaya || l.wilaya === activeWilaya;
    return matchCategory && matchWilaya;
  });

  const activeCategoryData = CATEGORIES.find((c) => c.id === activeCategory);

  return (
    <div className="bg-[#F4F6F5] min-h-screen pb-20">
      {/* HEADER DESIGN PREMIUM */}
      <div className="relative bg-[#1B6B3A] pb-12 pt-12 px-6 overflow-hidden shadow-2xl rounded-b-[3rem]">
        <div className="absolute top-0 right-0 w-64 h-64 bg-green-500 rounded-full blur-3xl opacity-20 -mr-16 -mt-16" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-yellow-500 rounded-full blur-3xl opacity-10 -ml-16 -mb-16" />
        {/* MOTIF DÉCORATIF TUILÉ */}
        <div
          className="absolute inset-0 opacity-[0.10] pointer-events-none"
          style={{ backgroundImage: `url("${HEADER_PATTERN}")`, backgroundSize: "60px 60px" }}
        />

        <div className="relative z-10 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
              <MapPin className="w-3 h-3 text-white" />
              <span className="text-white text-[11px] font-semibold tracking-wide uppercase">{user?.wilaya ?? "ALGER"}</span>
            </div>
            <button onClick={() => setLang(lang === "fr" ? "ar" : "fr")} className="bg-white/10 backdrop-blur-md text-white text-[10px] font-bold px-4 py-1.5 rounded-full border border-white/10">
              {lang === "fr" ? "العربية" : "FR"}
            </button>
          </div>
          <div>
            <h1 className="text-white text-4xl font-black tracking-tighter">
              <span className="text-[#E8C84A]">W</span>iya
            </h1>
          </div>
        </div>
      </div>

      {/* CONTENU AVEC MARGE NÉGATIVE POUR L'EFFET "POSÉ" */}
      <div className="px-4 -mt-6 relative z-20 space-y-5">
        
        {/* CARTE CATÉGORIES */}
        <div className="bg-white p-5 rounded-3xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-gray-800">{t("categories")}</h2>
            <button onClick={() => setShowCategoryPicker(true)} className="text-xs text-[#1B6B3A] font-semibold">{t("seeAll")}</button>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {CATEGORIES.slice(0, 5).map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
                className="flex flex-col items-center gap-1.5"
              >
                <div className={`w-10 h-10 flex items-center justify-center rounded-2xl text-lg transition-colors ${activeCategory === cat.id ? "bg-[#1B6B3A]/15 ring-2 ring-[#1B6B3A]" : "bg-gray-50"}`}>{cat.icon}</div>
                <span className="text-[9px] font-semibold text-gray-600 text-center leading-tight">{t(cat.id as any)}</span>
              </button>
            ))}
          </div>
        </div>

        {/* FILTRES ACTIFS */}
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => setShowWilayaPicker(true)} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full text-xs font-semibold text-gray-600 shadow-sm">
            <MapPin className="w-3.5 h-3.5" /> {activeWilaya ?? t("wilaya")}
          </button>
          {activeWilaya && (
            <button onClick={() => setActiveWilaya(null)} className="w-7 h-7 flex items-center justify-center bg-white border border-gray-200 rounded-full shadow-sm">
              <X className="w-3.5 h-3.5 text-gray-500" />
            </button>
          )}
          {activeCategoryData && (
            <button onClick={() => setActiveCategory(null)} className="flex items-center gap-1.5 pl-3 pr-2 py-2 bg-[#1B6B3A]/10 rounded-full text-xs font-semibold text-[#1B6B3A]">
              <span>{activeCategoryData.icon}</span>
              <span>{t(activeCategoryData.id as any)}</span>
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* LISTE DES ANNONCES */}
        <div className="space-y-3">
          {filteredListings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2 text-center">
              <div className="text-3xl">🔍</div>
              <p className="text-sm font-bold text-gray-600">{t("noResults")}</p>
            </div>
          ) : (
            filteredListings.map((listing) => <ListingCard key={listing.id} listing={listing} variant="list" />)
          )}
        </div>
      </div>

      {/* MODALES */}
      <AnimatePresence>
        {showCategoryPicker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed left-0 top-0 w-full bg-black/40 z-50 flex items-end"
            style={{ height: vvh }}
            onClick={() => setShowCategoryPicker(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full max-w-[430px] mx-auto rounded-t-3xl flex flex-col overflow-hidden"
              style={{ maxHeight: vvh * 0.85 }}
            >
              <div className="px-6 pt-6 flex-shrink-0">
                <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-6" />
                <h3 className="text-lg font-black text-gray-900 mb-4">{t("categories")}</h3>
              </div>
              <div className="px-6 pb-6 grid grid-cols-4 gap-3 overflow-y-auto flex-1 min-h-0">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => { setActiveCategory(cat.id); setShowCategoryPicker(false); }}
                    className={`p-3 rounded-2xl flex flex-col items-center gap-1.5 border ${activeCategory === cat.id ? "border-[#1B6B3A] bg-[#1B6B3A]/10" : "border-gray-100 bg-gray-50"}`}
                  >
                    <span className="text-xl">{cat.icon}</span>
                    <span className="text-[10px] font-bold text-gray-700 text-center leading-tight">{t(cat.id as any)}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}

        {showWilayaPicker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed left-0 top-0 w-full bg-black/40 z-50 flex items-end"
            style={{ height: vvh }}
            onClick={() => { setShowWilayaPicker(false); setWilayaSearch(""); }}
          >
            <motion.div
              initial={{ y: 300 }}
              animate={{ y: 0 }}
              exit={{ y: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full max-w-[430px] mx-auto rounded-t-3xl flex flex-col overflow-hidden"
              style={{ maxHeight: vvh * 0.9 }}
            >
              <div className="p-4 flex-shrink-0">
                <div className="flex items-center gap-2 bg-gray-100 rounded-2xl px-3 py-2.5">
                  <Search className="w-4 h-4 text-gray-400" />
                  <input 
                    type="text" 
                    value={wilayaSearch} 
                    onChange={(e) => setWilayaSearch(e.target.value)} 
                    placeholder={t("searchWilaya")} 
                    className="flex-1 bg-transparent text-sm text-gray-800 outline-none"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="none"
                    spellCheck="false"
                  />
                </div>
              </div>
              <div className="overflow-y-auto flex-1 min-h-0 px-4 pb-6 grid grid-cols-2 gap-1.5 content-start">
                {filteredWilayas.map((w) => (
                  <button key={w} onClick={() => { setActiveWilaya(w); setShowWilayaPicker(false); }} className={`p-3 rounded-xl text-sm ${activeWilaya === w ? "bg-blue-500 text-white" : "bg-gray-50"}`}>{w}</button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
