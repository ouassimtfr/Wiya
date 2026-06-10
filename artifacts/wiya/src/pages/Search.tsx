import { useState, useMemo } from "react";
import { Search as SearchIcon, SlidersHorizontal, X, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { LISTINGS, CATEGORIES, WILAYAS } from "@/lib/data";
import ListingCard from "@/components/ListingCard";
import AppHeader from "@/components/AppHeader";

type SortOption = "newest" | "priceAsc" | "priceDesc";

export default function SearchPage() {
  const { t, lang } = useI18n();
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedWilaya, setSelectedWilaya] = useState<string | null>(null);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState<SortOption>("newest");
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode] = useState<"grid" | "list">("list");

  const results = useMemo(() => {
    let list = [...LISTINGS];
    if (query) {
      const q = query.toLowerCase();
      list = list.filter(
        (l) => l.title.toLowerCase().includes(q) || l.titleAr.includes(q) || l.wilaya.toLowerCase().includes(q)
      );
    }
    if (selectedCategory) list = list.filter((l) => l.category === selectedCategory);
    if (selectedWilaya) list = list.filter((l) => l.wilaya === selectedWilaya);
    if (minPrice) list = list.filter((l) => l.price >= Number(minPrice));
    if (maxPrice) list = list.filter((l) => l.price <= Number(maxPrice));
    if (sort === "priceAsc") list.sort((a, b) => a.price - b.price);
    else if (sort === "priceDesc") list.sort((a, b) => b.price - a.price);
    return list;
  }, [query, selectedCategory, selectedWilaya, minPrice, maxPrice, sort]);

  const activeFilters = [selectedCategory, selectedWilaya, minPrice, maxPrice].filter(Boolean).length;

  return (
    <div className="bg-[#F4F6F5] min-h-screen pb-20">
      {/* Search header */}
      <div className="bg-white px-4 pt-12 pb-3 shadow-sm sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 bg-gray-100 rounded-2xl px-3 py-2.5">
            <SearchIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("search")}
              className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none"
              autoFocus
            />
            {query && (
              <button onClick={() => setQuery("")}>
                <X className="w-4 h-4 text-gray-400" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`relative w-10 h-10 flex items-center justify-center rounded-2xl transition-colors
              ${showFilters ? "bg-[#1B6B3A]" : "bg-gray-100"}`}
          >
            <SlidersHorizontal className={`w-4.5 h-4.5 ${showFilters ? "text-white" : "text-gray-600"}`} />
            {activeFilters > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#C8972B] rounded-full text-white text-[9px] font-bold flex items-center justify-center">
                {activeFilters}
              </span>
            )}
          </button>
        </div>

        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto mt-3 pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors
              ${!selectedCategory ? "bg-[#1B6B3A] text-white" : "bg-gray-100 text-gray-600"}`}
          >
            {t("allCategories")}
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
              className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors
                ${selectedCategory === cat.id ? "bg-[#1B6B3A] text-white" : "bg-gray-100 text-gray-600"}`}
            >
              <span>{cat.icon}</span>
              {t(cat.id as any)}
            </button>
          ))}
        </div>
      </div>

      {/* Filter panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-white border-b border-gray-100 overflow-hidden"
          >
            <div className="px-4 py-4 space-y-4">
              {/* Wilaya */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">
                  {t("wilaya")}
                </label>
                <div className="relative">
                  <select
                    value={selectedWilaya ?? ""}
                    onChange={(e) => setSelectedWilaya(e.target.value || null)}
                    className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 outline-none"
                  >
                    <option value="">{t("selectWilaya")}</option>
                    {WILAYAS.map((w) => (
                      <option key={w} value={w}>{w}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
              {/* Price */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">
                  {t("priceRange")}
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder={t("minPrice")}
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none"
                  />
                  <input
                    type="number"
                    placeholder={t("maxPrice")}
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none"
                  />
                </div>
              </div>
              {/* Sort */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">
                  {t("sort")}
                </label>
                <div className="flex gap-2">
                  {(["newest", "priceAsc", "priceDesc"] as SortOption[]).map((s) => (
                    <button
                      key={s}
                      onClick={() => setSort(s)}
                      className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-colors
                        ${sort === s ? "bg-[#1B6B3A] text-white" : "bg-gray-100 text-gray-600"}`}
                    >
                      {t(s)}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={() => { setSelectedCategory(null); setSelectedWilaya(null); setMinPrice(""); setMaxPrice(""); setSort("newest"); }}
                className="w-full py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-500"
              >
                {t("reset")}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      <div className="px-4 pt-4">
        <p className="text-xs text-gray-500 mb-3 font-medium">
          {results.length} {results.length === 1 ? "résultat" : "résultats"}
        </p>
        {results.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-3">🔍</div>
            <p className="text-gray-500 font-medium">{t("noResults")}</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {results.map((listing, i) => (
              <motion.div
                key={listing.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <ListingCard listing={listing} variant={viewMode} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
