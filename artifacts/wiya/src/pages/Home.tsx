import { useState, useEffect } from "react";
import { MapPin, Search, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { CATEGORIES, WILAYAS } from "@/lib/data";
import { supabase } from "@/lib/supabase";
import ListingCard from "@/components/ListingCard";

const HEADER_PATTERN = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'%3E%3Cg fill='none' stroke='%23FFFFFF' stroke-width='1.2'%3E%3Cpath d='M30 4 L52 30 L30 56 L8 30 Z'/%3E%3Ccircle cx='30' cy='30' r='2.5' fill='%23FFFFFF'/%3E%3C/g%3E%3C/svg%3E";

export default function Home() {
  const { t, lang, setLang } = useI18n();
  const { user } = useStore();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeWilaya, setActiveWilaya] = useState<string | null>(null);
  const [showWilayaPicker, setShowWilayaPicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [wilayaSearch, setWilayaSearch] = useState("");
  const [listings, setListings] = useState<any[]>([]);

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    const { data } = await supabase.from("listings").select("*").eq("is_active", true).order("created_at", { ascending: false });
    if (data) setListings(data);
  };

  const filteredWilayas = WILAYAS.filter((w: any) => w.name.toLowerCase().includes(wilayaSearch.toLowerCase()));
  const filteredListings = listings.filter((l) => (!activeCategory || l.category === activeCategory) && (!activeWilaya || l.wilaya === activeWilaya));
  const activeCategoryData = CATEGORIES.find((c) => c.id === activeCategory);

  return (
    // Structure fixe pour éviter le problème de page blanche sur mobile
    <div className="bg-[#F4F6F5] fixed inset-0 overflow-y-auto">
      <div className="pb-20 min-h-screen">
        <div className="relative bg-[#1B6B3A] pb-12 pt-12 px-6 overflow-hidden shadow-2xl rounded-b-[3rem]">
          <div className="absolute inset-0 opacity-[0.10] pointer-events-none" style={{ backgroundImage: `url("${HEADER_PATTERN}")` }} />
          <div className="relative z-10 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <button 
                onClick={() => setShowWilayaPicker(true)}
                className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 active:scale-95 transition-transform"
              >
                <MapPin className="w-3 h-3 text-white" />
                <span className="text-white text-[11px] font-semibold uppercase">{activeWilaya ?? user?.wilaya ?? "ALGER"}</span>
              </button>
              <button onClick={() => setLang(lang === "fr" ? "ar" : "fr")} className="bg-white/10 backdrop-blur-md text-white text-[10px] font-bold px-4 py-1.5 rounded-full border border-white/10">
                {lang === "fr" ? "العربية" : "FR"}
              </button>
            </div>
            <h1 className="text-white text-4xl font-black tracking-tighter"><span className="text-[#E8C84A]">W</span>iya</h1>
          </div>
        </div>

        <div className="px-4 -mt-6 relative z-20 space-y-5">
          <div className="bg-white p-5 rounded-3xl shadow-sm">
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
          </div>

          <div className="space-y-3">
            {filteredListings.map((listing) => <ListingCard key={listing.id} listing={listing} variant="list" />)}
          </div>
        </div>

        <AnimatePresence>
          {showWilayaPicker && (
            <div className="fixed inset-0 bg-black/40 z-[9999] flex items-end" onClick={() => setShowWilayaPicker(false)}>
              <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} onClick={(e) => e.stopPropagation()} className="bg-white w-full max-w-[430px] mx-auto rounded-t-3xl flex flex-col max-h-[85vh] overflow-hidden">
                <div className="p-4 flex-shrink-0">
                  <input autoFocus type="text" value={wilayaSearch} onChange={(e) => setWilayaSearch(e.target.value)} placeholder={t("searchWilaya")} className="w-full bg-gray-100 p-3 rounded-xl outline-none text-sm" />
                </div>
                <div className="overflow-y-auto min-h-0 px-4 pb-6 grid grid-cols-2 gap-2">
                  {filteredWilayas
                    .sort((a: any, b: any) => a.id - b.id)
                    .map((w: any) => (
                      <button key={w.id} onClick={() => { setActiveWilaya(w.name); setShowWilayaPicker(false); setWilayaSearch(""); }} className={`p-3 rounded-xl text-sm flex items-center gap-2 ${activeWilaya === w.name ? "bg-[#1B6B3A] text-white" : "bg-gray-50"}`}>
                        <span className="font-bold opacity-40 text-xs">{w.id}</span> {w.name}
                      </button>
                  ))}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
