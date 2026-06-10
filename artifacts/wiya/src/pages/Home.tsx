import { useState } from "react";
import { useLocation } from "wouter";
import { Search, Bell, MapPin, ChevronRight, Zap, Map } from "lucide-react";
import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { LISTINGS, CATEGORIES } from "@/lib/data";
import ListingCard from "@/components/ListingCard";

export default function Home() {
  const [, navigate] = useLocation();
  const { t, lang, setLang, isRTL } = useI18n();
  const { user } = useStore();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const featured = LISTINGS.filter((l) => l.isBoosted);
  const recent = activeCategory
    ? LISTINGS.filter((l) => l.category === activeCategory)
    : LISTINGS;

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
              <button className="relative w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                <Bell className="w-4.5 h-4.5 text-white" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#C8972B] rounded-full border border-[#1B6B3A]" />
              </button>
            </div>
          </div>

          {/* Search bar */}
          <button
            onClick={() => navigate("/search")}
            className="w-full bg-white rounded-2xl flex items-center gap-3 px-4 py-3 shadow-lg"
          >
            <Search className="w-4.5 h-4.5 text-[#1B6B3A]" />
            <span className="text-gray-400 text-sm flex-1 text-left">{t("search")}</span>
          </button>
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
      </div>
    </div>
  );
}
