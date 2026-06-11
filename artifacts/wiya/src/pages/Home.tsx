import { useState } from "react";
import { useLocation } from "wouter";
import { Search, Bell, MapPin, ChevronRight, Zap, Map, SlidersHorizontal, X, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { useNotifications } from "@/lib/notifications";
import { LISTINGS, CATEGORIES, WILAYAS } from "@/lib/data";
import ListingCard from "@/components/ListingCard";
import SearchAutocomplete from "@/components/SearchAutocomplete";

type PriceRange = "all" | "u10" | "10_50" | "50_200" | "o200";
type Condition = "all" | "new" | "used";

const PRICE_RANGES: { id: PriceRange; label: string }[] = [
  { id: "all", label: "Tous" },
  { id: "u10", label: "< 10k" },
  { id: "10_50", label: "10k–50k" },
  { id: "50_200", label: "50k–200k" },
  { id: "o200", label: "> 200k" },
];

function matchesPrice(price: number, range: PriceRange) {
  if (range === "all") return true;
  if (range === "u10") return price < 10000;
  if (range === "10_50") return price >= 10000 && price < 50000;
  if (range === "50_200") return price >= 50000 && price < 200000;
  if (range === "o200") return price >= 200000;
  return true;
}

export default function Home() {
  const [, navigate] = useLocation();
  const { t, lang, setLang, isRTL } = useI18n();
  const { user } = useStore();
  const { unreadCount } = useNotifications();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState<PriceRange>("all");
  const [condition, setCondition] = useState<Condition>("all");
  const [activeWilaya, setActiveWilaya] = useState<string | null>(null);
  const [showWilayaPicker, setShowWilayaPicker] = useState(false);
  const [wilayaSearch, setWilayaSearch] = useState("");

  const hasFilters = priceRange !== "all" || condition !== "all" || activeWilaya !== null;

  const clearFilters = () => {
    setPriceRange("all");
    setCondition("all");
    setActiveWilaya(null);
  };

  const featured = LISTINGS.filter((l) => l.isBoosted);
  const recent = LISTINGS.filter((l) => {
    if (activeCategory && l.category !== activeCategory) return false;
    if (!matchesPrice(l.price, priceRange)) return false;
    if (condition !== "all" && l.condition !== condition) return false;
    if (activeWilaya && l.wilaya !== activeWilaya) return false;
    return true;
  });

  const filteredWilayas = WILAYAS.filter((w) =>
    w.toLowerCase().includes(wilayaSearch.toLowerCase())
  );

  return (
    <div className="bg-[#F4F6F5] min-h-screen pb-20">
      {/* Header */}
      <div className="bg-[#1B6B3A] pt-12 pb-6 px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white" />
          <div className="absolute top-4 -right-4 w-20 h-20 rounded-full bg-white" />
          <div className="absolute bottom-0 left-1/3 w-24 h-24 rounded-full bg-[#C8972B]" />
        </div>
        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <MapPin className="w-3.5 h-3.5 text-green-200" />
                <span className="text-green-200 text-xs font-medium">{user?.wilaya ?? "Algérie"}</span>
              </div>
              <h1 className="text-white text-2xl font-black tracking-tight">
                <span className="text-[#E8C84A]">W</span>iya
              </h1>
            </div>
            <div className="flex items-center gap-2">
              {/* Language switcher */}
              <button
                onClick={() => setLang(lang === "fr" ? "ar" : "fr")}
                className="px-3 py-1.5 rounded-full bg-white/20 text-white text-xs font-bold border border-white/30"
              >
                {lang === "fr" ? "العربية" : "Français"}
              </button>
              <button
                onClick={() => navigate("/map")}
                className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center"
              >
                <Map className="w-4.5 h-4.5 text-white" />
              </button>
              <button
                onClick={() => navigate("/notifications")}
                className="relative w-9 h-9 rounded-full bg-white/20 flex items-center justify-center"
              >
                <Bell className="w-4.5 h-4.5 text-white" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[14px] h-[14px] bg-[#C8972B] rounded-full border border-[#1B6B3A] text-white text-[8px] font-bold flex items-center justify-center px-0.5">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Search bar */}
          <SearchAutocomplete placeholder={t("search")} />
        </div>
      </div>

      <div className="px-4 space-y-5 mt-4">
        {/* Categories */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-gray-800">{t("categories")}</h2>
            <button
              onClick={() => navigate("/search")}
              className="text-xs text-[#1B6B3A] font-semibold flex items-center gap-0.5"
            >
              {t("seeAll")} <ChevronRight className={`w-3.5 h-3.5 ${isRTL ? "rotate-180" : ""}`} />
            </button>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {CATEGORIES.map((cat, i) => (
              <motion.button
                key={cat.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => {
                  setActiveCategory(activeCategory === cat.id ? null : cat.id);
                }}
                className={`flex flex-col items-center gap-1.5 p-2.5 rounded-2xl transition-all
                  ${activeCategory === cat.id
                    ? "bg-[#1B6B3A] shadow-md shadow-green-200"
                    : "bg-white shadow-sm"
                  }`}
              >
                <span className="text-xl">{cat.icon}</span>
                <span className={`text-[10px] font-semibold leading-tight text-center
                  ${activeCategory === cat.id ? "text-white" : "text-gray-600"}`}>
                  {t(cat.id as any)}
                </span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Quick Filters */}
        <div className="space-y-2">
          {/* Row 1: Price chips + clear */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none -mx-4 px-4">
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <SlidersHorizontal className="w-3.5 h-3.5 text-gray-400" />
            </div>
            {PRICE_RANGES.map((r) => (
              <button
                key={r.id}
                onClick={() => setPriceRange(priceRange === r.id && r.id !== "all" ? "all" : r.id)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all
                  ${priceRange === r.id
                    ? "bg-[#1B6B3A] text-white shadow-sm shadow-green-200"
                    : "bg-white text-gray-600 border border-gray-200"}`}
              >
                {r.label} DA
              </button>
            ))}
          </div>

          {/* Row 2: Condition + Wilaya + clear */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none -mx-4 px-4">
            {/* Condition */}
            {(["all", "new", "used"] as Condition[]).map((c) => (
              <button
                key={c}
                onClick={() => setCondition(c)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all
                  ${condition === c
                    ? "bg-[#C8972B] text-white shadow-sm shadow-yellow-200"
                    : "bg-white text-gray-600 border border-gray-200"}`}
              >
                {c === "all" ? "État: Tous" : c === "new" ? "✨ Neuf" : "🔄 Occasion"}
              </button>
            ))}

            {/* Wilaya picker chip */}
            <button
              onClick={() => setShowWilayaPicker(true)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all
                ${activeWilaya
                  ? "bg-blue-500 text-white shadow-sm"
                  : "bg-white text-gray-600 border border-gray-200"}`}
            >
              <MapPin className="w-3 h-3" />
              {activeWilaya ?? "Wilaya"}
              {activeWilaya ? (
                <span
                  onClick={(e) => { e.stopPropagation(); setActiveWilaya(null); }}
                  className="ml-0.5"
                >
                  <X className="w-3 h-3" />
                </span>
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
            </button>

            {/* Clear all */}
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-red-50 text-red-500 border border-red-100"
              >
                <X className="w-3 h-3" /> Effacer
              </button>
            )}
          </div>

          {/* Filter result count */}
          {hasFilters && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs text-gray-500 px-0.5"
            >
              <span className="font-bold text-[#1B6B3A]">{recent.length}</span> annonce{recent.length !== 1 ? "s" : ""} trouvée{recent.length !== 1 ? "s" : ""}
            </motion.p>
          )}
        </div>

        {/* Featured / Boosted */}
        {!activeCategory && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-[#C8972B] fill-[#C8972B]" />
                <h2 className="text-sm font-bold text-gray-800">{t("featured")}</h2>
              </div>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none">
              {featured.map((listing, i) => (
                <motion.div
                  key={listing.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="flex-shrink-0 w-[200px]"
                >
                  <ListingCard listing={listing} />
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Recent listings */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-gray-800">
              {activeCategory
                ? t(activeCategory as any)
                : t("recentListings")}
            </h2>
            <button
              onClick={() => navigate("/search")}
              className="text-xs text-[#1B6B3A] font-semibold flex items-center gap-0.5"
            >
              {t("seeAll")} <ChevronRight className={`w-3.5 h-3.5 ${isRTL ? "rotate-180" : ""}`} />
            </button>
          </div>
          <div className="space-y-2.5">
            {recent.map((listing, i) => (
              <motion.div
                key={listing.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <ListingCard listing={listing} variant="list" />
              </motion.div>
            ))}
          </div>
        </div>

        {/* Empty state for filtered results */}
        {hasFilters && recent.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-12 gap-3"
          >
            <div className="text-4xl">🔍</div>
            <p className="text-sm font-bold text-gray-600">Aucune annonce trouvée</p>
            <p className="text-xs text-gray-400">Essayez d'élargir vos filtres</p>
            <button onClick={clearFilters} className="px-4 py-2 bg-[#1B6B3A] text-white rounded-2xl text-sm font-semibold">
              Effacer les filtres
            </button>
          </motion.div>
        )}
      </div>

      {/* Wilaya picker bottom sheet */}
      <AnimatePresence>
        {showWilayaPicker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-end"
            onClick={() => { setShowWilayaPicker(false); setWilayaSearch(""); }}
          >
            <motion.div
              initial={{ y: 300 }}
              animate={{ y: 0 }}
              exit={{ y: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full max-w-[430px] mx-auto rounded-t-3xl max-h-[70vh] flex flex-col"
            >
              <div className="p-4 flex-shrink-0">
                <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-3" />
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-black text-gray-900">Choisir une wilaya</h3>
                  <button onClick={() => { setShowWilayaPicker(false); setWilayaSearch(""); }}>
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
                <div className="flex items-center gap-2 bg-gray-100 rounded-2xl px-3 py-2.5">
                  <Search className="w-4 h-4 text-gray-400" />
                  <input
                    autoFocus
                    type="text"
                    value={wilayaSearch}
                    onChange={(e) => setWilayaSearch(e.target.value)}
                    placeholder="Rechercher une wilaya..."
                    className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none"
                  />
                  {wilayaSearch && (
                    <button onClick={() => setWilayaSearch("")}>
                      <X className="w-3.5 h-3.5 text-gray-400" />
                    </button>
                  )}
                </div>
              </div>
              <div className="overflow-y-auto flex-1 px-4 pb-6 grid grid-cols-2 gap-1.5 content-start">
                {filteredWilayas.map((w) => (
                  <button
                    key={w}
                    onClick={() => {
                      setActiveWilaya(w === activeWilaya ? null : w);
                      setShowWilayaPicker(false);
                      setWilayaSearch("");
                    }}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-left text-sm font-medium transition-colors
                      ${activeWilaya === w
                        ? "bg-blue-500 text-white"
                        : "bg-gray-50 text-gray-700 hover:bg-gray-100"}`}
                  >
                    <MapPin className={`w-3.5 h-3.5 flex-shrink-0 ${activeWilaya === w ? "text-white" : "text-gray-400"}`} />
                    <span className="truncate">{w}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
