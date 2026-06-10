import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { Search, X, MapPin, ChevronDown, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { WILAYAS_DATA, toSVG, ALGERIA_PATH, type Wilaya } from "@/lib/wilayas";
import { LISTINGS } from "@/lib/data";
import ListingCard from "@/components/ListingCard";

const SVG_W = 400;
const SVG_H = 510;

export default function MapPage() {
  const [, navigate] = useLocation();
  const { t, lang } = useI18n();
  const [selected, setSelected] = useState<Wilaya | null>(null);
  const [query, setQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  const listingsForWilaya = selected
    ? LISTINGS.filter((l) => l.wilaya === selected.name)
    : [];

  const filteredWilayas = query
    ? WILAYAS_DATA.filter(
        (w) =>
          w.name.toLowerCase().includes(query.toLowerCase()) ||
          w.nameAr.includes(query)
      )
    : [];

  const countForWilaya = (name: string) =>
    LISTINGS.filter((l) => l.wilaya === name).length;

  return (
    <div className="bg-[#0f3d22] min-h-screen pb-20 flex flex-col">
      {/* Header */}
      <div className="px-4 pt-12 pb-3 flex items-center gap-3 flex-shrink-0">
        <button
          onClick={() => navigate("/")}
          className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center"
        >
          <ArrowLeft className="w-4.5 h-4.5 text-white" />
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
            {/* Ocean / background */}
            <rect width={SVG_W} height={SVG_H} fill="#0d3320" rx="16" />

            {/* Algeria land shape */}
            <path
              d={ALGERIA_PATH}
              fill="#1e7a44"
              stroke="#2a9955"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />

            {/* Sahara shading */}
            <path
              d={ALGERIA_PATH}
              fill="url(#sahara)"
              opacity="0.4"
            />

            {/* Gradient definitions */}
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

            {/* Wilaya markers */}
            {WILAYAS_DATA.map((wilaya) => {
              const { x, y } = toSVG(wilaya.lon, wilaya.lat, SVG_W, SVG_H);
              const count = countForWilaya(wilaya.name);
              const isSelected = selected?.code === wilaya.code;
              const hasListings = count > 0;

              const r = isSelected ? 8 : hasListings ? 6 : 4;
              const fill = isSelected
                ? "#ff6b35"
                : hasListings
                ? "#E8C84A"
                : "rgba(255,255,255,0.35)";
              const stroke = isSelected ? "#fff" : hasListings ? "#fff8" : "rgba(255,255,255,0.2)";

              return (
                <g key={wilaya.code} onClick={() => setSelected(isSelected ? null : wilaya)}>
                  {/* Pulse ring for selected */}
                  {isSelected && (
                    <circle cx={x} cy={y} r={14} fill="none" stroke="#ff6b35" strokeWidth="1.5" opacity="0.5" />
                  )}

                  {/* Main dot */}
                  <circle
                    cx={x}
                    cy={y}
                    r={r}
                    fill={fill}
                    stroke={stroke}
                    strokeWidth={isSelected ? 2 : hasListings ? 1 : 0.8}
                    style={{ cursor: "pointer" }}
                    filter={isSelected || hasListings ? "url(#glow)" : undefined}
                  />

                  {/* Count badge */}
                  {hasListings && !isSelected && count > 0 && (
                    <>
                      <circle cx={x + 7} cy={y - 7} r={6} fill="#1B6B3A" stroke="#E8C84A" strokeWidth="1" />
                      <text
                        x={x + 7}
                        y={y - 7}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize="6"
                        fontWeight="bold"
                        fill="white"
                      >
                        {count}
                      </text>
                    </>
                  )}

                  {/* Wilaya code label */}
                  {(hasListings || isSelected) && (
                    <text
                      x={x}
                      y={y + r + 7}
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

            {/* Selected wilaya name label */}
            {selected && (() => {
              const { x, y } = toSVG(selected.lon, selected.lat, SVG_W, SVG_H);
              const labelX = Math.min(Math.max(x, 50), SVG_W - 50);
              const labelY = y > SVG_H - 60 ? y - 30 : y + 22;
              return (
                <g>
                  <rect
                    x={labelX - 35}
                    y={labelY - 10}
                    width={70}
                    height={16}
                    rx={8}
                    fill="#ff6b35"
                    opacity="0.95"
                  />
                  <text
                    x={labelX}
                    y={labelY - 10 + 8}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize="7"
                    fontWeight="bold"
                    fill="white"
                  >
                    {selected.name}
                  </text>
                </g>
              );
            })()}
          </svg>
        </div>

        {/* Wilaya grid list (mini) */}
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

      {/* Bottom sheet for selected wilaya */}
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
              {/* Handle */}
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

              {/* Listings */}
              <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2.5">
                {listingsForWilaya.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
                    <MapPin className="w-8 h-8 text-gray-200" />
                    <p className="text-sm text-gray-500 font-medium">
                      Aucune annonce à {selected.name}
                    </p>
                    <button
                      onClick={() => {
                        setSelected(null);
                        navigate("/post");
                      }}
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

              {/* Browse all in wilaya */}
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
