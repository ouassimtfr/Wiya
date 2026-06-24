import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Search, X, MapPin, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { WILAYAS_DATA, toSVG, type Wilaya } from "@/lib/wilayas";
import { supabase } from "@/lib/supabase";
import ListingCard from "@/components/ListingCard";

const SVG_W = 400;
const SVG_H = 510;

// Forme Algeria SVG améliorée — tracé plus fidèle
const ALGERIA_PATH = `
  M 178,18 L 192,16 L 210,18 L 228,22 L 242,20 L 255,24 L 265,20 L 278,22
  L 285,28 L 292,26 L 300,30 L 308,28 L 318,32 L 325,38 L 330,46 L 335,52
  L 338,60 L 342,68 L 345,76 L 348,84 L 350,92 L 352,100 L 354,110 L 356,120
  L 358,130 L 360,142 L 362,155 L 363,168 L 364,182 L 365,196 L 366,210
  L 367,224 L 368,238 L 369,252 L 370,266 L 371,280 L 372,294 L 373,308
  L 374,322 L 375,336 L 376,348 L 377,360 L 378,370 L 379,380 L 380,390
  L 381,400 L 382,410 L 383,418 L 384,425 L 384,432 L 383,438 L 380,442
  L 375,445 L 368,447 L 360,448 L 350,448 L 338,447 L 325,446 L 310,445
  L 295,444 L 278,443 L 260,442 L 242,441 L 224,440 L 206,439 L 188,438
  L 170,437 L 152,436 L 136,434 L 122,431 L 110,427 L 100,422 L 92,416
  L 86,409 L 82,401 L 80,392 L 79,382 L 79,371 L 80,359 L 81,346 L 82,332
  L 82,318 L 82,304 L 81,290 L 80,276 L 78,262 L 76,248 L 73,235 L 70,222
  L 67,210 L 64,199 L 61,189 L 58,180 L 55,171 L 52,162 L 49,152 L 46,141
  L 43,129 L 41,117 L 40,105 L 40,94 L 41,84 L 44,75 L 48,67 L 54,60
  L 61,54 L 70,49 L 80,44 L 91,40 L 103,36 L 116,32 L 130,28 L 144,24
  L 158,20 L 170,18 L 178,18 Z
`;

export default function MapPage() {
  const [, navigate] = useLocation();
  const { t, lang } = useI18n();
  const [selected, setSelected] = useState<Wilaya | null>(null);
  const [query, setQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [listings, setListings] = useState<any[]>([]);
  const [loadingListings, setLoadingListings] = useState(false);

  // Charge toutes les annonces actives au démarrage
  useEffect(() => {
    fetchAllListings();
  }, []);

  const fetchAllListings = async () => {
    const { data } = await supabase
      .from("listings")
      .select("id, title, price, wilaya, images, category, condition, is_active, created_at, user_id, is_boosted, is_urgent, is_negotiable")
      .eq("is_active", true);
    if (data) setListings(data);
  };

  // Charge les annonces d'une wilaya sélectionnée
  const listingsForWilaya = selected
    ? listings.filter((l) => l.wilaya === selected.name)
    : [];

  const filteredWilayas = query
    ? WILAYAS_DATA.filter(
        (w) =>
          w.name.toLowerCase().includes(query.toLowerCase()) ||
          w.nameAr.includes(query)
      )
    : [];

  const countForWilaya = (name: string) =>
    listings.filter((l) => l.wilaya === name).length;

  return (
    <div className="bg-[#0f3d22] min-h-screen pb-20 flex flex-col">
      {/* Header */}
      <div className="px-4 pt-12 pb-3 flex items-center gap-3 flex-shrink-0">
        <button
          onClick={() => navigate("/")}
          className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center"
        >
          <ArrowLeft className="w-4 h-4 text-white" />
        </button>
        <div className="flex-1">
          <h1 className="text-white font-black text-base">Carte des Wilayas</h1>
          <p className="text-green-300 text-xs">{WILAYAS_DATA.length} wilayas · Algérie</p>
        </div>
        <button
          onClick={() => setShowSearch(!showSearch)}
          className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center"
        >
          <Search className="w-4 h-4 text-white" />
        </button>
      </div>

      {/* Search dropdown */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mx-4 mb-2"
          >
            <div className="bg-white/15 rounded-2xl p-2 backdrop-blur-sm">
              <div className="flex items-center gap-2 px-3 py-2 bg-white/10 rounded-xl">
                <Search className="w-3.5 h-3.5 text-green-200" />
                <input
                  autoFocus
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Rechercher une wilaya..."
                  className="flex-1 bg-transparent text-white text-sm placeholder-green-300 outline-none"
                />
                {query && (
                  <button onClick={() => setQuery("")}>
                    <X className="w-3.5 h-3.5 text-green-300" />
                  </button>
                )}
              </div>
              {filteredWilayas.length > 0 && (
                <div className="mt-2 max-h-40 overflow-y-auto space-y-1">
                  {filteredWilayas.map((w) => (
                    <button
                      key={w.code}
                      onClick={() => {
                        setSelected(w);
                        setQuery("");
                        setShowSearch(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/10 text-left"
                    >
                      <span className="text-xs font-bold text-green-300 w-6">{w.code}</span>
                      <span className="text-sm text-white font-medium">{w.name}</span>
                      <span className="text-xs text-green-300 ml-auto">{w.nameAr}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legend */}
      <div className="flex items-center gap-4 px-4 mb-2 flex-shrink-0">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#E8C84A] border-2 border-white/30" />
          <span className="text-[10px] text-green-200 font-medium">Avec annonces</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-white/40 border-2 border-white/20" />
          <span className="text-[10px] text-green-200 font-medium">Sans annonces</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#ff6b35] border-2 border-white/30" />
          <span className="text-[10px] text-green-200 font-medium">Sélectionnée</span>
        </div>
      </div>

      {/* SVG Map */}
      <div className="flex-1 flex flex-col items-center px-2">
        <div className="w-full bg-[#1a5c36]/40 rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
          <svg
            viewBox={`0 0 ${SVG_W} ${SVG_H}`}
            className="w-full"
            style={{ background: "transparent" }}
          >
            <rect width={SVG_W} height={SVG_H} fill="#0d3320" rx="16" />

            {/* Forme Algérie */}
            <path
              d={ALGERIA_PATH}
              fill="#1e7a44"
              stroke="#2a9955"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />

            {/* Dégradé Sahara */}
            <path
              d={ALGERIA_PATH}
              fill="url(#sahara)"
              opacity="0.4"
            />

            <defs>
              <radialGradient id="sahara" cx="50%" cy="70%" r="60%">
                <stop offset="0%" stopColor="#c8972b" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#1e7a44" stopOpacity="0" />
              </radialGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Marqueurs wilayas */}
            {WILAYAS_DATA.map((wilaya) => {
              const { x, y } = toSVG(wilaya.lon, wilaya.lat, SVG_W, SVG_H);
              const count = countForWilaya(wilaya.name);
              const isSelected = selected?.code === wilaya.code;
              const hasListings = count > 0;

              const r = isSelected ? 8 : hasListings ? 6 : 4;
              const fill = isSelected ? "#ff6b35" : hasListings ? "#E8C84A" : "rgba(255,255,255,0.35)";
              const stroke = isSelected ? "#fff" : hasListings ? "#fff8" : "rgba(255,255,255,0.2)";

              return (
                <g key={wilaya.code} onClick={() => setSelected(isSelected ? null : wilaya)}>
                  {isSelected && (
                    <circle cx={x} cy={y} r={14} fill="none" stroke="#ff6b35" strokeWidth="1.5" opacity="0.5" />
                  )}
                  <circle
                    cx={x} cy={y} r={r}
                    fill={fill} stroke={stroke}
                    strokeWidth={isSelected ? 2 : hasListings ? 1 : 0.8}
                    style={{ cursor: "pointer" }}
                    filter={isSelected || hasListings ? "url(#glow)" : undefined}
                  />
                  {hasListings && !isSelected && (
                    <>
                      <circle cx={x + 7} cy={y - 7} r={6} fill="#1B6B3A" stroke="#E8C84A" strokeWidth="1" />
                      <text x={x + 7} y={y - 7} textAnchor="middle" dominantBaseline="central" fontSize="6" fontWeight="bold" fill="white">
                        {count}
                      </text>
                    </>
                  )}
                  {(hasListings || isSelected) && (
                    <text
                      x={x} y={y + r + 7}
                      textAnchor="middle"
                      fontSize={isSelected ? "7" : "6"}
                      fontWeight="bold"
                      fill={isSelected ? "#ff6b35" : "#E8C84A"}
                      opacity={isSelected ? 1 : 0.85}
                    >
                      {wilaya.code}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Label wilaya sélectionnée */}
            {selected && (() => {
              const { x, y } = toSVG(selected.lon, selected.lat, SVG_W, SVG_H);
              const labelX = Math.min(Math.max(x, 50), SVG_W - 50);
              const labelY = y > SVG_H - 60 ? y - 30 : y + 22;
              return (
                <g>
                  <rect x={labelX - 35} y={labelY - 10} width={70} height={16} rx={8} fill="#ff6b35" opacity="0.95" />
                  <text x={labelX} y={labelY - 10 + 8} textAnchor="middle" dominantBaseline="central" fontSize="7" fontWeight="bold" fill="white">
                    {selected.name}
                  </text>
                </g>
              );
            })()}
          </svg>
        </div>

        {/* Liste wilayas */}
        {!selected && (
          <div className="w-full mt-4">
            <p className="text-green-300 text-xs font-semibold px-1 mb-2">
              Toutes les wilayas ({WILAYAS_DATA.length})
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              {WILAYAS_DATA.map((w) => {
                const count = countForWilaya(w.name);
                return (
                  <button
                    key={w.code}
                    onClick={() => setSelected(w)}
                    className={`rounded-xl px-2 py-2 text-left flex items-center gap-1.5 transition-colors
                      ${count > 0 ? "bg-[#E8C84A]/15 border border-[#E8C84A]/30" : "bg-white/5 border border-white/10"}`}
                  >
                    <span className="text-[10px] font-black text-green-400 w-5 flex-shrink-0">{w.code}</span>
                    <span className="text-[10px] font-semibold text-white truncate flex-1">
                      {lang === "ar" ? w.nameAr : w.name}
                    </span>
                    {count > 0 && (
                      <span className="text-[9px] font-bold text-[#E8C84A] bg-[#E8C84A]/20 rounded-full w-4 h-4 flex items-center justify-center flex-shrink-0">
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Bottom sheet wilaya sélectionnée */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed bottom-16 left-0 right-0 max-w-[430px] mx-auto z-50"
          >
            <div className="bg-white rounded-t-3xl shadow-2xl max-h-[55vh] flex flex-col">
              <div className="flex-shrink-0 pt-3 pb-2 px-5">
                <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-3" />
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-400">{selected.code}</span>
                      <h2 className="text-base font-black text-gray-900">{selected.name}</h2>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{selected.nameAr}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {listingsForWilaya.length > 0 && (
                      <span className="text-xs font-bold text-[#1B6B3A] bg-green-50 px-2.5 py-1 rounded-full">
                        {listingsForWilaya.length} annonce{listingsForWilaya.length > 1 ? "s" : ""}
                      </span>
                    )}
                    <button
                      onClick={() => setSelected(null)}
                      className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center"
                    >
                      <X className="w-3.5 h-3.5 text-gray-500" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2.5">
                {listingsForWilaya.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
                    <MapPin className="w-8 h-8 text-gray-200" />
                    <p className="text-sm text-gray-500 font-medium">
                      Aucune annonce à {selected.name}
                    </p>
                    <button
                      onClick={() => { setSelected(null); navigate("/post"); }}
                      className="text-xs text-[#1B6B3A] font-semibold mt-1"
                    >
                      Soyez le premier à publier ici →
                    </button>
                  </div>
                ) : (
                  listingsForWilaya.map((listing) => (
                    <ListingCard key={listing.id} listing={listing} variant="list" />
                  ))
                )}
              </div>

              {listingsForWilaya.length > 0 && (
                <div className="px-4 pb-4 flex-shrink-0">
                  <button
                    onClick={() => navigate(`/search?wilaya=${selected.name}`)}
                    className="w-full py-3 bg-[#1B6B3A] text-white rounded-2xl font-semibold text-sm"
                  >
                    Voir toutes les annonces à {selected.name}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
