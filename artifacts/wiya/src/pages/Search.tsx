import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Search, X, SlidersHorizontal, Clock, Briefcase, ChevronRight } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { CATEGORIES } from "@/lib/data";
import { WILAYAS_DATA } from "@/lib/wilayas";
import { supabase } from "@/lib/supabase";
import ListingCard from "@/components/ListingCard";

type Sort = "relevance" | "recent" | "price_asc" | "price_desc";

// Seules les demandes d'emploi existent sur Wiya
const JOB_KIND = "seeking";

const RECENT_KEY = "wiya_recent_searches";

const WILAYA_OPTIONS = WILAYAS_DATA.slice().sort((a, b) => a.code - b.code);

const JOB_SECTORS = [
  "Informatique",
  "Commerce et vente",
  "Restauration et hôtellerie",
  "Bâtiment et travaux",
  "Santé",
  "Éducation et formation",
  "Transport et logistique",
  "Administration et comptabilité",
  "Industrie",
  "Marketing et communication",
  "Autre",
];

const JOB_SECTOR_AR: Record<string, string> = {
  Informatique: "إعلام آلي",
  "Commerce et vente": "تجارة وبيع",
  "Restauration et hôtellerie": "مطاعم وفندقة",
  "Bâtiment et travaux": "بناء وأشغال",
  Santé: "صحة",
  "Éducation et formation": "تعليم وتكوين",
  "Transport et logistique": "نقل ولوجستيك",
  "Administration et comptabilité": "إدارة ومحاسبة",
  Industrie: "صناعة",
  "Marketing et communication": "تسويق واتصال",
  Autre: "أخرى",
};

const FRENCH_NUMBER_WORDS: Record<string, string> = {
  zero: "0", un: "1", une: "1", deux: "2", trois: "3", quatre: "4",
  cinq: "5", six: "6", sept: "7", huit: "8", neuf: "9", dix: "10",
};

function normalize(str: string) {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function loadRecent(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveRecent(term: string) {
  const clean = term.trim();
  if (clean.length < 2) return;
  try {
    const next = [clean, ...loadRecent().filter((t) => t.toLowerCase() !== clean.toLowerCase())].slice(0, 8);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {}
}

function clearRecent() {
  try {
    localStorage.removeItem(RECENT_KEY);
  } catch {}
}

export default function SearchPage() {
  const [, navigate] = useLocation();
  const { t, isRTL } = useI18n();
  const tr = (fr: string, ar: string) => (isRTL ? ar : fr);
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState("");
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recent, setRecent] = useState<string[]>(loadRecent());

  const [category, setCategory] = useState<string>("");
  const [wilaya, setWilaya] = useState<string>("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState<Sort>("relevance");
  const [sheetOpen, setSheetOpen] = useState(false);

  const [jobSector, setJobSector] = useState<string>("");

  const isJobs = category === "jobs";

  const sectorLabel = (s: string) => (isRTL ? JOB_SECTOR_AR[s] ?? s : s);

  useEffect(() => {
    // Wilaya passée dans l'adresse (ex: depuis la carte) : /search?wilaya=Blida
    try {
      const w = new URLSearchParams(window.location.search).get("wilaya");
      if (w && WILAYAS_DATA.some((x) => x.name === w)) setWilaya(w);
    } catch {}
  }, []);

  useEffect(() => {
    inputRef.current?.focus();
    (async () => {
      const { data, error: err } = await supabase
        .from("listings")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (err) {
        console.error("Erreur chargement annonces:", err);
        setError(tr("Impossible de charger les annonces. Réessayez dans un instant.", "تعذر تحميل الإعلانات. حاول مجددا بعد قليل."));
      } else {
        setListings(data || []);
      }
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!isJobs) {
      setJobSector("");
    }
  }, [isJobs]);

  const categoryLabel = (id: string) => (CATEGORIES.some((c) => c.id === id) ? t(id as any) : "");

  const indexed = useMemo(
    () =>
      listings.map((l) => {
        const vehicle = `${l.vehicle_brand ?? ""} ${l.vehicle_model ?? ""} ${l.vehicle_year ?? ""}`;
        const job = `${l.job_sector ?? ""}`;
        return {
          l,
          title: normalize(l.title ?? ""),
          text: normalize(`${l.title ?? ""} ${l.description ?? ""} ${categoryLabel(l.category)} ${vehicle} ${job}`),
        };
      }),
    [listings, t]
  );

  const words = useMemo(
    () =>
      normalize(query)
        .split(/\s+/)
        .filter(Boolean)
        .map((w) => FRENCH_NUMBER_WORDS[w] ?? w),
    [query]
  );

  const matching = useMemo(
    () => (words.length ? indexed.filter((x) => words.every((w) => x.text.includes(w))) : indexed),
    [indexed, words]
  );

  const categoryCounts = useMemo(() => {
    const map = new Map<string, number>();
    matching.forEach((x) => x.l.category && map.set(x.l.category, (map.get(x.l.category) || 0) + 1));
    return map;
  }, [matching]);

  const jobCount = useMemo(
    () =>
      matching.filter(
        (x) => x.l.category === "jobs" && (x.l.job_kind ?? JOB_KIND) === JOB_KIND
      ).length,
    [matching]
  );

  const filtered = useMemo(() => {
    const min = minPrice ? Number(minPrice) : null;
    const max = maxPrice ? Number(maxPrice) : null;

    const out = matching.filter((x) => {
      if (category && x.l.category !== category) return false;
      if (wilaya && x.l.wilaya !== wilaya) return false;
      if (min !== null && Number(x.l.price) < min) return false;
      if (max !== null && Number(x.l.price) > max) return false;
      if (isJobs) {
        if ((x.l.job_kind ?? JOB_KIND) !== JOB_KIND) return false;
        if (jobSector && x.l.job_sector !== jobSector) return false;
      }
      return true;
    });

    const time = (x: any) => new Date(x.l.created_at).getTime();
    const hits = (x: any) => words.reduce((n, w) => n + (x.title.includes(w) ? 1 : 0), 0);

    if (sort === "price_asc") out.sort((a, b) => Number(a.l.price) - Number(b.l.price));
    else if (sort === "price_desc") out.sort((a, b) => Number(b.l.price) - Number(a.l.price));
    else if (sort === "recent") out.sort((a, b) => time(b) - time(a));
    else {
      out.sort(
        (a, b) =>
          Number(!!b.l.is_boosted) - Number(!!a.l.is_boosted) || hits(b) - hits(a) || time(b) - time(a)
      );
    }
    return out;
  }, [matching, category, wilaya, minPrice, maxPrice, sort, words, isJobs, jobSector]);

  const hasSearch = words.length > 0 || !!category || !!wilaya || !!minPrice || !!maxPrice;
  const activeFilters =
    (wilaya ? 1 : 0) + (minPrice || maxPrice ? 1 : 0) + (sort !== "relevance" ? 1 : 0) + (jobSector ? 1 : 0);

  const resetFilters = () => {
    setWilaya("");
    setMinPrice("");
    setMaxPrice("");
    setSort("relevance");
    setJobSector("");
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    saveRecent(query);
    setRecent(loadRecent());
    inputRef.current?.blur();
  };

  const visibleCategories = CATEGORIES.filter((c) => (categoryCounts.get(c.id) || 0) > 0 || c.id === category);

  const priceLabel = isJobs
    ? tr("Salaire souhaité (DA)", "الراتب المطلوب (دج)")
    : tr("Prix (DA)", "السعر (دج)");
  const sortAsc = isJobs ? tr("Salaire croissant", "الراتب تصاعدي") : tr("Prix croissant", "السعر تصاعدي");
  const sortDesc = isJobs ? tr("Salaire décroissant", "الراتب تنازلي") : tr("Prix décroissant", "السعر تنازلي");

  const countWord = isJobs
    ? tr(filtered.length > 1 ? "demandes" : "demande", "طلب")
    : tr(filtered.length > 1 ? "annonces" : "annonce", "إعلان");

  return (
    <div className="bg-[#F4F6F5] min-h-full pb-6">
      {/* Barre de recherche */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-100 pt-[calc(env(safe-area-inset-top)+10px)]">
        <form onSubmit={submit} className="px-3 pb-3 flex items-center gap-2">
          <button type="button" onClick={() => navigate("/")} className="p-2 -ms-1 rounded-full active:bg-gray-100">
            <ArrowLeft className={`w-5 h-5 text-gray-800 ${isRTL ? "rotate-180" : ""}`} />
          </button>
          <div className="flex-1 flex items-center gap-2 bg-gray-100 rounded-2xl px-3.5 py-2.5 min-w-0">
            <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              enterKeyHint="search"
              autoComplete="off"
              placeholder={
                isJobs
                  ? tr("Métier, compétence...", "مهنة، مهارة...")
                  : tr("Rechercher (ex: Clio 5 2020)", "ابحث (مثال: كليو 5 2020)")
              }
              className="flex-1 bg-transparent text-base text-gray-800 focus:outline-none placeholder:text-gray-400 min-w-0"
            />
            {query && (
              <button type="button" onClick={() => setQuery("")} className="p-0.5">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="relative p-2.5 rounded-2xl bg-gray-100 active:bg-gray-200 flex-shrink-0"
          >
            <SlidersHorizontal className="w-5 h-5 text-gray-700" />
            {activeFilters > 0 && (
              <span className="absolute -top-1 -end-1 w-4 h-4 rounded-full bg-[#1B6B3A] text-white text-[10px] font-bold flex items-center justify-center">
                {activeFilters}
              </span>
            )}
          </button>
        </form>

        {/* Catégories des résultats */}
        {hasSearch && visibleCategories.length > 0 && (
          <div
            className="flex gap-2 overflow-x-auto px-3 pb-3 [&::-webkit-scrollbar]:hidden"
            style={{ scrollbarWidth: "none" }}
          >
            <button
              onClick={() => setCategory("")}
              className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-[13px] font-semibold transition-colors ${
                category === "" ? "bg-[#1B6B3A] text-white" : "bg-gray-100 text-gray-600"
              }`}
            >
              {tr("Tout", "الكل")} ({matching.length})
            </button>
            {visibleCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategory(category === cat.id ? "" : cat.id)}
                className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-[13px] font-semibold transition-colors whitespace-nowrap ${
                  category === cat.id ? "bg-[#1B6B3A] text-white" : "bg-gray-100 text-gray-600"
                }`}
              >
                {cat.icon} {t(cat.id as any)} ({categoryCounts.get(cat.id) || 0})
              </button>
            ))}
          </div>
        )}

        {/* Emplois : uniquement des demandes d'emploi */}
        {isJobs && (
          <div className="border-t border-gray-100 px-3 py-3">
            <div className="flex items-center justify-between bg-gray-100 rounded-2xl px-4 py-2.5">
              <span className="text-[13px] font-bold text-[#1B6B3A]">{tr("Demandes d'emploi", "طلبات العمل")}</span>
              <span className="text-[13px] font-bold text-gray-500">{jobCount}</span>
            </div>
          </div>
        )}
      </div>

      {/* Accueil de la recherche : emploi, récentes, catégories */}
      {!hasSearch && (
        <div className="px-4 pt-5 space-y-6">
          <button
            onClick={() => setCategory("jobs")}
            className="w-full flex items-center gap-3 bg-gradient-to-br from-[#0B1F16] to-[#1B6B3A] rounded-3xl px-5 py-4 text-start shadow-md active:scale-[0.99] transition-transform"
          >
            <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center flex-shrink-0">
              <Briefcase className="w-6 h-6 text-[#F2D27A]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-base font-extrabold">{tr("Demandes d'emploi", "طلبات العمل")}</p>
              <p className="text-white/70 text-xs mt-0.5">
                {tr("Des chercheurs d'emploi partout en Algérie", "باحثون عن عمل في كل أنحاء الجزائر")}
              </p>
            </div>
            <ChevronRight className={`w-5 h-5 text-white/70 flex-shrink-0 ${isRTL ? "rotate-180" : ""}`} />
          </button>

          {recent.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-bold text-gray-800">{tr("Recherches récentes", "عمليات البحث الأخيرة")}</p>
                <button
                  onClick={() => {
                    clearRecent();
                    setRecent([]);
                  }}
                  className="text-xs font-semibold text-[#1B6B3A]"
                >
                  {tr("Effacer", "مسح")}
                </button>
              </div>
              <ul className="bg-white rounded-2xl shadow-sm overflow-hidden">
                {recent.map((r) => (
                  <li key={r}>
                    <button
                      onClick={() => setQuery(r)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-start active:bg-gray-50 border-b border-gray-50 last:border-0"
                    >
                      <Clock className="w-4 h-4 text-gray-300" />
                      <span className="text-sm text-gray-700">{r}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <p className="text-sm font-bold text-gray-800 mb-3">{tr("Parcourir par catégorie", "تصفح حسب الفئة")}</p>
            <div className="grid grid-cols-4 gap-2.5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className="bg-white rounded-2xl shadow-sm p-3 flex flex-col items-center gap-1.5 active:scale-95 transition-transform"
                >
                  <span className="text-2xl">{cat.icon}</span>
                  <span className="text-[10px] font-bold text-gray-700 text-center leading-tight">
                    {t(cat.id as any)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Résultats */}
      {hasSearch && (
        <div className="px-4 pt-3">
          {loading && <p className="text-center text-sm text-gray-400 py-10">{tr("Chargement...", "جاري التحميل...")}</p>}
          {error && <p className="text-center text-sm text-red-500 py-10">{error}</p>}

          {!loading && !error && (
            <>
              <p className="text-xs font-semibold text-gray-500 px-1 mb-2.5">
                {filtered.length} {countWord}
              </p>

              {filtered.length === 0 ? (
                <div className="flex flex-col items-center text-center pt-14 px-8">
                  <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center mb-4">
                    {isJobs ? <Briefcase className="w-7 h-7 text-gray-300" /> : <Search className="w-7 h-7 text-gray-300" />}
                  </div>
                  <p className="text-sm font-bold text-gray-700">
                    {isJobs
                      ? tr("Aucune demande trouvée", "لم يتم العثور على طلبات")
                      : tr("Aucune annonce trouvée", "لم يتم العثور على إعلانات")}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {tr("Essayez un autre mot ou retirez des filtres.", "جرّب كلمة أخرى أو احذف بعض المرشحات.")}
                  </p>
                  {(activeFilters > 0 || category) && (
                    <button
                      onClick={() => {
                        resetFilters();
                        setCategory("");
                      }}
                      className="mt-4 text-sm font-semibold text-[#1B6B3A]"
                    >
                      {tr("Réinitialiser les filtres", "إعادة ضبط المرشحات")}
                    </button>
                  )}
                </div>
              ) : (
                <div
                  className="space-y-3"
                  onClickCapture={() => {
                    saveRecent(query);
                  }}
                >
                  {filtered.map((x) => (
                    <ListingCard key={x.l.id} listing={x.l} variant="list" />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Filtres */}
      {sheetOpen && (
        <div className="fixed inset-0 z-[10000] flex items-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSheetOpen(false)} />
          <div className="relative w-full max-w-[430px] mx-auto bg-white rounded-t-3xl px-5 pt-5 pb-[max(env(safe-area-inset-bottom),20px)] max-h-[85dvh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-extrabold text-gray-900">{tr("Filtres", "المرشحات")}</h2>
              <button onClick={() => setSheetOpen(false)} className="p-1.5 rounded-full bg-gray-100">
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <p className="text-sm font-bold text-gray-800 mb-2">{tr("Wilaya", "الولاية")}</p>
            <select
              value={wilaya}
              onChange={(e) => setWilaya(e.target.value)}
              className="w-full bg-gray-100 rounded-xl px-3.5 py-3 text-base mb-5 focus:outline-none text-gray-800"
            >
              <option value="">{tr("Toute l'Algérie", "كل الجزائر")}</option>
              {WILAYA_OPTIONS.map((w) => (
                <option key={w.code} value={w.name}>
                  {String(w.code).padStart(2, "0")} - {isRTL ? w.nameAr : w.name}
                </option>
              ))}
            </select>

            {isJobs && (
              <>
                <p className="text-sm font-bold text-gray-800 mb-2">{tr("Secteur", "القطاع")}</p>
                <select
                  value={jobSector}
                  onChange={(e) => setJobSector(e.target.value)}
                  className="w-full bg-gray-100 rounded-xl px-3.5 py-3 text-base mb-5 focus:outline-none text-gray-800"
                >
                  <option value="">{tr("Tous les secteurs", "كل القطاعات")}</option>
                  {JOB_SECTORS.map((s) => (
                    <option key={s} value={s}>
                      {sectorLabel(s)}
                    </option>
                  ))}
                </select>
              </>
            )}

            <p className="text-sm font-bold text-gray-800 mb-2">{priceLabel}</p>
            <div className="flex gap-3 mb-5">
              <input
                type="number"
                inputMode="numeric"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder={tr("Min", "الأدنى")}
                className="flex-1 min-w-0 bg-gray-100 rounded-xl px-3.5 py-3 text-base focus:outline-none text-gray-800"
              />
              <input
                type="number"
                inputMode="numeric"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder={tr("Max", "الأقصى")}
                className="flex-1 min-w-0 bg-gray-100 rounded-xl px-3.5 py-3 text-base focus:outline-none text-gray-800"
              />
            </div>

            <p className="text-sm font-bold text-gray-800 mb-2">{tr("Trier par", "ترتيب حسب")}</p>
            <div className="flex flex-wrap gap-2 mb-6">
              {[
                { id: "relevance" as const, label: tr("Pertinence", "الأكثر صلة") },
                { id: "recent" as const, label: tr("Plus récentes", "الأحدث") },
                { id: "price_asc" as const, label: sortAsc },
                { id: "price_desc" as const, label: sortDesc },
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSort(s.id)}
                  className={`px-3.5 py-2 rounded-full text-[13px] font-semibold ${
                    sort === s.id ? "bg-[#1B6B3A] text-white" : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={resetFilters}
                className="flex-1 py-3.5 rounded-2xl bg-gray-100 text-gray-700 font-semibold text-sm"
              >
                {tr("Réinitialiser", "إعادة ضبط")}
              </button>
              <button
                onClick={() => setSheetOpen(false)}
                className="flex-1 py-3.5 rounded-2xl bg-[#1B6B3A] text-white font-semibold text-sm shadow-md"
              >
                {tr(
                  `Voir ${filtered.length} résultat${filtered.length > 1 ? "s" : ""}`,
                  `عرض ${filtered.length} نتيجة`
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
