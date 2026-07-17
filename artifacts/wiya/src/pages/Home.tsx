import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { MapPin, ChevronRight, X, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { CATEGORIES, WILAYAS } from "@/lib/data";
import { supabase } from "@/lib/supabase";
import ListingCard from "@/components/ListingCard";

export default function Home() {
  const [, navigate] = useLocation();
  const { t, lang, setLang, isRTL } = useI18n();
  const { user } = useStore();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeWilaya, setActiveWilaya] = useState<string | null>(null);
  const [showWilayaPicker, setShowWilayaPicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [wilayaSearch, setWilayaSearch] = useState("");
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    setLoading(true);
    const { data } = await supabase.from("listings").select("*").eq("is_active", true).order("created_at", { ascending: false });
    if (data) setListings(data);
    setLoading(false);
  };

  const filteredWilayas = WILAYAS.filter((w) => w.toLowerCase().includes(wilayaSearch.toLowerCase()));

  return (
    <div className="bg-[#F4F6F5] min-h-screen pb-20">
      {/* Header Premium Design */}
      <div className="bg-gradient-to-b from-[#1B6B3A] to-[#258a4d] pt-12 pb-8 px-6 rounded-b-[2.5rem] shadow-lg relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
        <div className="relative flex items-center justify-between">
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 bg-white/20 w-fit px-3 py-1 rounded-full mb-2">
              <MapPin className="w-3 h-3 text-white" />
              <span className="text-white/90 text-[10px] font-medium uppercase tracking-wider">{user?.wilaya ?? "Algérie"}</span>
            </div>
            <h1 className="text-white text-3xl font-extrabold tracking-tighter">
              <span className="text-[#E8C84A]">W</span>iya
            </h1>
          </div>
          <button onClick={() => setLang(lang === "fr" ? "ar" : "fr")} className="px-4 py-2 rounded-2xl bg-white/10 backdrop-blur-md text-white text-xs font-bold border border-white/20 transition-all hover:bg-white/20">
            {lang === "fr" ? "العربية" : "FR"}
          </button>
        </div>
      </div>

      <div className="px-4 space-y-5 mt-6">
        {/* Catégories compactes */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-gray-800">{t("categories")}</h2>
            <button onClick={() => setShowCategoryPicker(true)} className="text-xs text-[#1B6B3A] font-semibold flex items-center gap-0.5">
              {t("seeAll")} <ChevronRight className={`w-3.5 h-3.5 ${isRTL ? "rotate-180" : ""}`} />
            </button>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {CATEGORIES.slice(0, 4).map((cat) => (
              <button key={cat.id} onClick={() => setActiveCategory(cat.id)} className="flex flex-col items-center gap-1.5 p-2.5 bg-white rounded-2xl shadow-sm">
                <span className="text-xl">{cat.icon}</span>
                <span className="text-[10px] font-semibold text-gray-600">{t(cat.id as any)}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Bouton Filtre Wilaya */}
        <button onClick={() => setShowWilayaPicker(true)} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full text-xs font-semibold text-gray-600">
          <MapPin className="w-3.5 h-3.5" /> {activeWilaya ?? t("wilaya")}
        </button>

        {/* Modale Catégories (Contient toutes tes catégories) */}
        <AnimatePresence>
          {showCategoryPicker && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 z-50 flex items-end" onClick={() => setShowCategoryPicker(false)}>
              <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} onClick={(e) => e.stopPropagation()} className="bg-white w-full max-w-[430px] mx-auto rounded-t-3xl p-6 max-h-[80vh] flex flex-col">
                <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-6" />
                <h3 className="text-lg font-black text-gray-900 mb-4">{t("categories")}</h3>
                <div className="grid grid-cols-3 gap-4 overflow-y-auto">
                  {CATEGORIES.map((cat) => (
                    <button key={cat.id} onClick={() => { setActiveCategory(cat.id); setShowCategoryPicker(false); }} className="p-4 rounded-2xl flex flex-col items-center gap-2 border border-gray-100 bg-gray-50">
                      <span className="text-2xl">{cat.icon}</span>
                      <span className="text-xs font-bold text-gray-700 text-center">{t(cat.id as any)}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Modale Wilaya */}
          {showWilayaPicker && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 z-50 flex items-end" onClick={() => { setShowWilayaPicker(false); setWilayaSearch(""); }}>
              <motion.div initial={{ y: 300 }} animate={{ y: 0 }} exit={{ y: 300 }} onClick={(e) => e.stopPropagation()} className="bg-white w-full max-w-[430px] mx-auto rounded-t-3xl max-h-[70vh] flex flex-col">
                <div className="p-4"><div className="flex items-center gap-2 bg-gray-100 rounded-2xl px-3 py-2.5">
                  <Search className="w-4 h-4 text-gray-400" />
                  <input type="text" value={wilayaSearch} onChange={(e) => setWilayaSearch(e.target.value)} placeholder={t("searchWilaya")} className="flex-1 bg-transparent text-sm text-gray-800 outline-none" />
                </div></div>
                <div className="overflow-y-auto flex-1 px-4 pb-6 grid grid-cols-2 gap-1.5 content-start">
                  {filteredWilayas.map((w) => (
                    <button key={w} onClick={() => { setActiveWilaya(w); setShowWilayaPicker(false); }} className={`p-3 rounded-xl text-sm ${activeWilaya === w ? "bg-blue-500 text-white" : "bg-gray-50"}`}>{w}</button>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Annonces */}
        <div className="space-y-2.5">
          {listings.map((listing) => <ListingCard key={listing.id} listing={listing} variant="list" />)}
        </div>
      </div>
    </div>
  );
}
