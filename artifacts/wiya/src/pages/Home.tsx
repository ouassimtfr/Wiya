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

export default function Home() {
  const { t, lang, setLang, isRTL } = useI18n();
  const { user } = useStore();
  const [, navigate] = useLocation();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeWilaya, setActiveWilaya] = useState<string | null>(null);
  const [showWilayaPicker, setShowWilayaPicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [wilayaSearch, setWilayaSearch] = useState("");
  const [listings, setListings] = useState<any[]>([]);
  const viewport = useVisualViewport();

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    const { data } = await supabase.from("listings").select("*").eq("is_active", true).order("created_at", { ascending: false });
    if (data) setListings(data);
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
  const activeCategoryData = CATEGORIES.find((c) => c.id === activeCategory);

  const searchPlaceholder = isRTL ? "ابحث عن إعلان (مثال: كليو 5 2020)" : "Rechercher (ex: Clio 5 2020)";
  const wilayaPlaceholder = isRTL ? "ابحث عن ولاية..." : "Rechercher une wilaya...";

  const closeWilayaPicker = () => {
    setShowWilayaPicker(false);
    setWilayaSearch("");
  };

  return (
    <div className="bg-[#F4F6F5] min-h-screen pb-20">
      <div className="relative bg-gradient-to-b from-[#0B1F16] to-[#132C20] pb-10 pt-12 px-6 overflow-hidden border-b border-[#C7A44A]/25">
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
              <span className="text-[#F3EEE2] text-[11px] font-semibold uppercase tracking-wide">
                {wilayaLabel(activeWilaya ?? user?.wilaya ?? "Alger")}
              </span>
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

          <button
            onClick={() => navigate("/search")}
            className="w-full flex items-center gap-2 bg-white/95 rounded-2xl px-4 py-3 shadow-md text-left active:scale-[0.99] transition-transform"
          >
            <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="flex-1 text-sm text-gray-400 truncate">{searchPlaceholder}</span>
          </button>
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
              <MapPin className="w-3.5 h-3.5" /> {activeWilaya ? wilayaLabel(activeWilaya) : t("wilaya")}
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

        {(activeCategory || activeWilaya) && filteredListings.length === 0 && (
          <div className="text-center py-10">
            <p className="text-sm text-gray-500">{t("noResults")}</p>
          </div>
        )}

        <div className="space-y-3">
          {filteredListings.map((listing) => <ListingCard key={listing.id} listing={listing} variant="list" />)}
        </div>
      </div>

      <AnimatePresence>
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
              className="bg-white w-full max-w-[430px] mx-auto rounded-t-3xl flex flex-col overflow-hidden"
              style={{ maxHeight: viewport.height * 0.9 }}
            >
              <div className="p-4 flex-shrink-0">
                <input
                  type="text"
                  value={wilayaSearch}
                  onChange={(e) => setWilayaSearch(e.target.value)}
                  placeholder={wilayaPlaceholder}
                  className="w-full bg-gray-100 p-3 rounded-xl outline-none text-base text-gray-800"
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
                    className={`p-3 rounded-xl text-sm text-start ${activeWilaya === w.name ? "bg-[#1B6B3A] text-white" : "bg-gray-50 text-gray-800"}`}
                  >
                    <span className="opacity-50 text-xs">{String(w.code).padStart(2, "0")}</span>{" "}
                    {isRTL ? w.nameAr : w.name}
                  </button>
                ))}
                {filteredWilayas.length === 0 && (
                  <p className="col-span-2 text-center text-sm text-gray-400 py-6">{t("noResults")}</p>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
