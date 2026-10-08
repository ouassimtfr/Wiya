import { Heart, MapPin, Zap, Briefcase } from "lucide-react";
import { useLocation } from "wouter";
import { useStore } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import { WILAYAS_DATA } from "@/lib/wilayas";

interface Props {
  listing: any;
  variant?: "grid" | "list";
}

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

export default function ListingCard({ listing, variant = "grid" }: Props) {
  const [, navigate] = useLocation();
  const { toggleFavorite, isFavorite } = useStore();
  const { t, isRTL } = useI18n();
  const tr = (fr: string, ar: string) => (isRTL ? ar : fr);
  const fav = isFavorite(listing.id);

  const isJob = listing.category === "jobs";
  const title = listing.title ?? tr("Sans titre", "بدون عنوان");
  const realImage = listing.images?.[0] ?? "";
  const image = realImage || (isJob ? "" : "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400&q=80");
  const price = listing.price ?? 0;
  const wilayaRaw = listing.wilaya ?? "";
  const wilaya = isRTL ? WILAYAS_DATA.find((w) => w.name === wilayaRaw)?.nameAr ?? wilayaRaw : wilayaRaw;
  const isBoosted = listing.is_boosted ?? false;
  const isUrgent = listing.is_urgent ?? false;
  const isNegotiable = listing.is_negotiable ?? false;
  const condition = listing.condition ?? "";

  const jobSectorRaw: string = listing.job_sector ?? "";
  const jobSector = isRTL ? JOB_SECTOR_AR[jobSectorRaw] ?? jobSectorRaw : jobSectorRaw;
  const isSeeking = isJob && listing.job_kind === "seeking";

  const priceText = isJob
    ? price > 0
      ? `${price.toLocaleString()} ${t("da")} ${tr("/ mois", "/ شهر")}`
      : tr("Salaire à discuter", "الراتب قابل للنقاش")
    : `${price.toLocaleString()} ${t("da")}`;

  const Placeholder = ({ small }: { small?: boolean }) => (
    <div className="w-full h-full bg-gradient-to-br from-[#1B6B3A]/15 to-[#C8972B]/20 flex items-center justify-center">
      <Briefcase className={`${small ? "w-7 h-7" : "w-9 h-9"} text-[#1B6B3A]/60`} />
    </div>
  );

  if (variant === "list") {
    return (
      <div
        onClick={() => navigate(`/listing/${listing.id}`)}
        className={`bg-white rounded-2xl overflow-hidden flex gap-3 p-3 cursor-pointer active:scale-[0.98] transition-transform
          ${isBoosted ? "ring-1 ring-[#C8972B]/40 shadow-md" : "shadow-sm"}`}
      >
        <div className="relative w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden bg-gray-100">
          {image ? (
            <img src={image} alt={title} className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <Placeholder small />
          )}
          {isBoosted && (
            <div className="absolute top-1 start-1 bg-[#C8972B] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
              <Zap className="w-2.5 h-2.5" />{t("boosted")}
            </div>
          )}
          {isUrgent && !isBoosted && (
            <div className="absolute top-1 start-1 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
              {t("urgent")}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
          <div>
            <p className="text-sm font-semibold text-gray-900 truncate leading-tight">{title}</p>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-base font-bold text-[#1B6B3A]">{priceText}</span>
              {isNegotiable && (
                <span className="text-[10px] text-gray-400">• {t("negotiable")}</span>
              )}
            </div>
            {isJob && (
              <div className="flex items-center gap-1.5 mt-1 min-w-0">
                <span
                  className={`flex-shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                    isSeeking ? "bg-[#C8972B]/15 text-[#8A6414]" : "bg-[#1B6B3A]/10 text-[#1B6B3A]"
                  }`}
                >
                  {isSeeking ? tr("Cherche un emploi", "يبحث عن عمل") : tr("Recrute", "يوظّف")}
                </span>
                {jobSector && <span className="text-[10px] text-gray-400 truncate">{jobSector}</span>}
              </div>
            )}
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-gray-400">
              <MapPin className="w-3 h-3" />
              <span className="text-xs">{wilaya}</span>
            </div>
          </div>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); toggleFavorite(listing.id); }}
          className="self-start mt-0.5 p-1.5"
        >
          <Heart
            className={`w-4 h-4 transition-colors ${fav ? "fill-red-500 text-red-500" : "text-gray-300"}`}
            strokeWidth={fav ? 0 : 1.5}
          />
        </button>
      </div>
    );
  }

  return (
    <div
      onClick={() => navigate(`/listing/${listing.id}`)}
      className={`bg-white rounded-2xl overflow-hidden cursor-pointer active:scale-[0.97] transition-transform
        ${isBoosted ? "ring-1 ring-[#C8972B]/40 shadow-md" : "shadow-sm"}`}
    >
      <div className="relative aspect-[4/3] bg-gray-100">
        {image ? (
          <img src={image} alt={title} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <Placeholder />
        )}
        <button
          onClick={(e) => { e.stopPropagation(); toggleFavorite(listing.id); }}
          className="absolute top-2 end-2 w-7 h-7 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-sm"
        >
          <Heart
            className={`w-3.5 h-3.5 transition-colors ${fav ? "fill-red-500 text-red-500" : "text-gray-500"}`}
            strokeWidth={fav ? 0 : 1.8}
          />
        </button>
        {isBoosted && (
          <div className="absolute top-2 start-2 bg-[#C8972B] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
            <Zap className="w-2.5 h-2.5" />{t("boosted")}
          </div>
        )}
        {isUrgent && !isBoosted && (
          <div className="absolute top-2 start-2 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
            {t("urgent")}
          </div>
        )}
        {!isJob && condition === "new" && (
          <div className="absolute bottom-2 start-2 bg-[#1B6B3A] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
            {t("conditionNew")}
          </div>
        )}
        {isJob && jobSector && (
          <div className="absolute bottom-2 start-2 bg-[#1B6B3A] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full max-w-[90%] truncate">
            {jobSector}
          </div>
        )}
      </div>
      <div className="p-2.5">
        <p className="text-xs font-semibold text-gray-900 truncate leading-tight">{title}</p>
        <p className="text-sm font-bold text-[#1B6B3A] mt-0.5">{priceText}</p>
        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center gap-0.5 text-gray-400">
            <MapPin className="w-2.5 h-2.5" />
            <span className="text-[10px]">{wilaya}</span>
          </div>
          {isNegotiable && (
            <span className="text-[9px] text-[#C8972B] font-medium bg-amber-50 px-1.5 py-0.5 rounded-full">
              {t("negotiable")}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
