import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Search, MapPin, ChevronRight, Zap, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { CATEGORIES, WILAYAS } from "@/lib/data";
import { supabase } from "@/lib/supabase";
import ListingCard from "@/components/ListingCard";

type Condition = "all" | "new" | "used";

export default function Home() {
  const [, navigate] = useLocation();
  const { t, lang, setLang, isRTL } = useI18n();
  const { user } = useStore();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [condition, setCondition] = useState<Condition>("all");
  const [activeWilaya, setActiveWilaya] = useState<string | null>(null);
  const [showWilayaPicker, setShowWilayaPicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [wilayaSearch, setWilayaSearch] = useState("");
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchListings();
    const channel = supabase
      .channel("listings-updates-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "listings" }, () => {
        fetchListings();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchListings = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("listings").select("*").eq("is_active", true).order("created_at", { ascending: false });
    if (!error && data) setListings(data);
    setLoading(false);
  };

  const hasFilters = condition !== "all" || activeWilaya !== null;
  const clearFilters = () => { setCondition("all"); setActiveWilaya(null); };
  const featured = listings.filter((l) => l.is_boosted);
  const recent = listings.filter((l) => {
    if (activeCategory && l.category !== activeCategory) return false;
    if (condition !== "all" && l.condition !== condition) return false;
    if (activeWilaya && l.wilaya !== activeWilaya) return false;
    return true;
  });
  const filteredWilayas = WILAYAS.filter((w) => w.toLowerCase().includes(wilayaSearch.toLowerCase()));

  return (
    <div className="bg-[#F4F6F5] min-h-screen pb-20">
      {/* Header épuré sans barre de recherche */}
      <div className="bg-[#1B6B3A] pt-12 pb-6 px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white" />
        </div>
        <div className="relative">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <MapPin className="w-3.5 h-3.5 text-green-200" />
                <span className="text-green-200 text-xs font-medium">{user?.wilaya ?? "Algérie"}</span>
              </div>
              <h1 className="text-white text-2xl font-black tracking-tight"><span className="text-[#E8C84A]">W</span>iya</h1>
            </div>
            <button onClick={() => setLang(lang === "fr" ? "ar" : "fr")} className="px-3 py-1.5 rounded-full bg-white/20 text-white text-xs font-bold border border-white/30">
              {lang === "fr" ? t("arabicLang") : t("frenchLang")}
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 space-y-5 mt-4">
        {/* Catégories */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-gray-800">{t("categories")}</h2>
            <button onClick={() => setShowCategoryPicker(true)} className="text-xs text-[#1B6B3A] font-semibold flex items-center gap-0.5">
              {t("seeAll")} <ChevronRight className={`w-3.5 h-3.5 ${isRTL ? "rotate-180" : ""}`} />
            </button>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {CATEGORIES.slice(0, 4).map((cat) => (
              <button key={cat.id} onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)} className={`flex flex-col items-center gap-1.5 p-2.5 rounded-2xl transition-all ${activeCategory === cat.id ? "bg-[#1B6B3A] shadow-md" : "bg-white shadow-sm"}`}>
                <span className="text-xl">{cat.icon}</span>
                <span className={`text-[10px] font-semibold ${activeCategory === cat.id ? "text-white" : "text-gray-600"}`}>{t(cat.id as any)}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Filtres */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none -mx-4 px-4">
          <button onClick={() => setShowWilayaPicker(true)} className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${activeWilaya ? "bg-blue-500 text-white" : "bg-white text-gray-600 border border-gray-200"}`}>
            <MapPin className="w-3 h-3" /> {activeWilaya ?? t("wilaya")}
          </button>
        </div>

        {/* Modales */}
        <AnimatePresence>
          {showCategoryPicker && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 z-50 flex items-end" onClick={() => setShowCategoryPicker(false)}>
              <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} onClick={(e) => e.stopPropagation()} className="bg-white w-full max-w-[430px] mx-auto rounded-t-3xl p-6 max-h-[80vh] flex flex-col">
                <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-6" />
                <h3 className="text-lg font-black text-gray-900 mb-4">{t("categories")}</h3>
                <div className="grid grid-cols-3 gap-4 overflow-y-auto">
                  {CATEGORIES.map((cat) => (
                    <button key={cat.id} onClick={() => { setActiveCategory(cat.id); setShowCategoryPicker(false); }} className={`p-4 rounded-2xl flex flex-col items-center gap-2 border ${activeCategory === cat.id ? "border-[#1B6B3A] bg-green-50" : "border-gray-100 bg-gray-50"}`}>
                      <span className="text-2xl">{cat.icon}</span>
                      <span className="text-xs font-bold text-gray-700">{t(cat.id as any)}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}

          {showWilayaPicker && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 z-50 flex items-end" onClick={() => { setShowWilayaPicker(false); setWilayaSearch(""); }}>
              <motion.div initial={{ y: 300 }} animate={{ y: 0 }} exit={{ y: 300 }} onClick={(e) => e.stopPropagation()} className="bg-white w-full max-w-[430px] mx-auto rounded-t-3xl max-h-[70vh] flex flex-col">
                <div className="p-4 flex-shrink-0">
                  <div className="flex items-center gap-2 bg-gray-100 rounded-2xl px-3 py-2.5">
                    <Search className="w-4 h-4 text-gray-400" />
                    <input type="text" value={wilayaSearch} onChange={(e) => setWilayaSearch(e.target.value)} placeholder={t("searchWilaya")} className="flex-1 bg-transparent text-sm text-gray-800 outline-none" />
                  </div>
                </div>
                <div className="overflow-y-auto flex-1 px-4 pb-6 grid grid-cols-2 gap-1.5 content-start">
                  {filteredWilayas.map((w) => (
                    <button key={w} onClick={() => { setActiveWilaya(w); setShowWilayaPicker(false); }} className={`p-3 rounded-xl text-sm ${activeWilaya === w ? "bg-blue-500 text-white" : "bg-gray-50"}`}>
                      {w}
                    </button>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Liste des annonces */}
        {listings.length > 0 && (
          <div className="space-y-2.5">
            {recent.map((listing) => (
              <ListingCard key={listing.id} listing={listing} variant="list" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
