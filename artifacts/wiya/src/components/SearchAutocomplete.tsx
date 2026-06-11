import { useRef, useEffect, useState, useMemo } from "react";
import { useLocation } from "wouter";
import { Search, Clock, X, MapPin, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { LISTINGS, WILAYAS } from "@/lib/data";
import { useI18n } from "@/lib/i18n";

const STORAGE_KEY = "wiya_recent_searches";
const MAX_RECENT = 5;

function getRecent(): string[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]"); } catch { return []; }
}
function addRecent(term: string) {
  try {
    const prev = getRecent().filter((s) => s !== term);
    localStorage.setItem(STORAGE_KEY, JSON.stringify([term, ...prev].slice(0, MAX_RECENT)));
  } catch { /* noop */ }
}
function deleteRecent(term: string) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(getRecent().filter((s) => s !== term)));
  } catch { /* noop */ }
}

interface Props {
  placeholder: string;
}

export default function SearchAutocomplete({ placeholder }: Props) {
  const [, navigate] = useLocation();
  const { lang, isRTL } = useI18n();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [recent, setRecent] = useState<string[]>(getRecent);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  const suggestions = useMemo(() => {
    if (!query.trim()) return { listings: [], wilayas: [] };
    const q = query.toLowerCase();
    const listings = LISTINGS.filter(
      (l) =>
        l.title.toLowerCase().includes(q) ||
        l.titleAr.includes(q) ||
        l.wilaya.toLowerCase().includes(q) ||
        l.city.toLowerCase().includes(q)
    ).slice(0, 5);
    const wilayas = WILAYAS.filter((w) => w.toLowerCase().includes(q)).slice(0, 4);
    return { listings, wilayas };
  }, [query]);

  const goSearch = (term: string) => {
    if (!term.trim()) return;
    addRecent(term.trim());
    setRecent(getRecent());
    setOpen(false);
    setQuery("");
    inputRef.current?.blur();
    navigate(`/search?q=${encodeURIComponent(term.trim())}`);
  };

  const goWilaya = (wilaya: string) => {
    setOpen(false);
    setQuery("");
    inputRef.current?.blur();
    navigate(`/search?wilaya=${encodeURIComponent(wilaya)}`);
  };

  const goListing = (id: string) => {
    setOpen(false);
    setQuery("");
    inputRef.current?.blur();
    navigate(`/listing/${id}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") goSearch(query);
    if (e.key === "Escape") { setOpen(false); inputRef.current?.blur(); }
  };

  const hasResults = suggestions.listings.length > 0 || suggestions.wilayas.length > 0;
  const showDropdown = open && (recent.length > 0 || query.trim().length > 0);

  return (
    <div ref={containerRef} className="relative">
      <div
        className={`bg-white rounded-2xl flex items-center gap-3 px-4 py-3 shadow-lg transition-all duration-200
          ${open ? "ring-2 ring-[#1B6B3A]/40 shadow-xl" : ""}`}
      >
        <Search className="w-4.5 h-4.5 text-[#1B6B3A] flex-shrink-0" />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none [&::-webkit-search-cancel-button]:hidden"
          dir="auto"
          autoComplete="off"
        />
        <AnimatePresence>
          {query && (
            <motion.button
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              transition={{ duration: 0.12 }}
              onClick={() => { setQuery(""); inputRef.current?.focus(); }}
              className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0"
            >
              <X className="w-3 h-3 text-gray-500" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full mt-2 start-0 end-0 bg-white rounded-2xl shadow-2xl z-50 overflow-hidden max-h-[68vh] overflow-y-auto"
          >
            {/* Recent searches — shown when query is empty */}
            {!query.trim() && recent.length > 0 && (
              <div>
                <div className="flex items-center justify-between px-4 pt-3.5 pb-1.5">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    {isRTL ? "بحث سابق" : "Récents"}
                  </span>
                  <button
                    onClick={() => { localStorage.removeItem(STORAGE_KEY); setRecent([]); }}
                    className="text-[10px] text-[#1B6B3A] font-semibold"
                  >
                    {isRTL ? "مسح الكل" : "Tout effacer"}
                  </button>
                </div>
                {recent.map((term) => (
                  <div
                    key={term}
                    className="flex items-center gap-3 px-4 py-2.5 active:bg-gray-50"
                  >
                    <Clock className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                    <button
                      onClick={() => goSearch(term)}
                      className="flex-1 text-sm text-gray-700 text-start truncate"
                    >
                      {term}
                    </button>
                    <button
                      onClick={() => { deleteRecent(term); setRecent(getRecent()); }}
                      className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0"
                    >
                      <X className="w-2.5 h-2.5 text-gray-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* No results message */}
            {query.trim() && !hasResults && (
              <div className="px-4 py-7 text-center">
                <div className="text-2xl mb-2">🔍</div>
                <p className="text-sm font-semibold text-gray-500">
                  {isRTL ? "لا توجد نتائج" : "Aucun résultat"}
                </p>
                <p className="text-xs text-gray-300 mt-1">
                  {isRTL ? `لم نجد شيئاً لـ "${query}"` : `Rien pour "${query}"`}
                </p>
              </div>
            )}

            {/* Listing suggestions */}
            {suggestions.listings.length > 0 && (
              <div>
                <div className="px-4 pt-3.5 pb-1.5">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    {isRTL ? "إعلانات" : "Annonces"}
                  </span>
                </div>
                {suggestions.listings.map((l) => {
                  const title = lang === "ar" ? l.titleAr : l.title;
                  return (
                    <button
                      key={l.id}
                      onClick={() => goListing(l.id)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 active:bg-gray-50 text-start"
                    >
                      <img
                        src={l.images[0]}
                        alt=""
                        className="w-10 h-10 rounded-xl object-cover flex-shrink-0 bg-gray-100"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800 font-medium truncate leading-tight">
                          {title}
                        </p>
                        <p className="text-xs text-[#1B6B3A] font-semibold mt-0.5">
                          {l.price.toLocaleString()} {isRTL ? "دج" : "DA"}
                          <span className="text-gray-400 font-normal"> · {l.wilaya}</span>
                        </p>
                      </div>
                      <ChevronRight
                        className={`w-3.5 h-3.5 text-gray-300 flex-shrink-0 ${isRTL ? "rotate-180" : ""}`}
                      />
                    </button>
                  );
                })}
              </div>
            )}

            {/* Wilaya suggestions */}
            {suggestions.wilayas.length > 0 && (
              <div>
                <div className="px-4 pt-3.5 pb-1.5">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    {isRTL ? "ولايات" : "Wilayas"}
                  </span>
                </div>
                {suggestions.wilayas.map((w) => (
                  <button
                    key={w}
                    onClick={() => goWilaya(w)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 active:bg-gray-50 text-start"
                  >
                    <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-4 h-4 text-[#1B6B3A]" />
                    </div>
                    <span className="flex-1 text-sm text-gray-800 font-medium">{w}</span>
                    <ChevronRight
                      className={`w-3.5 h-3.5 text-gray-300 flex-shrink-0 ${isRTL ? "rotate-180" : ""}`}
                    />
                  </button>
                ))}
              </div>
            )}

            {/* See all results footer */}
            {query.trim() && hasResults && (
              <button
                onClick={() => goSearch(query)}
                className="w-full px-4 py-3.5 bg-[#1B6B3A]/5 border-t border-gray-100 flex items-center justify-center gap-2"
              >
                <Search className="w-3.5 h-3.5 text-[#1B6B3A]" />
                <span className="text-sm font-semibold text-[#1B6B3A]">
                  {isRTL
                    ? `عرض كل النتائج لـ "${query}"`
                    : `Voir tous les résultats pour "${query}"`}
                </span>
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
