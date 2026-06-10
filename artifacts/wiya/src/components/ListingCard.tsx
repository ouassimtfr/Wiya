import { Heart, MapPin, Eye, Zap } from "lucide-react";
import { useLocation } from "wouter";
import { Listing } from "@/lib/data";
import { useStore } from "@/lib/store";
import { useI18n } from "@/lib/i18n";

interface Props {
  listing: Listing;
  variant?: "grid" | "list";
}

export default function ListingCard({ listing, variant = "grid" }: Props) {
  const [, navigate] = useLocation();
  const { toggleFavorite, isFavorite } = useStore();
  const { t, lang } = useI18n();
  const fav = isFavorite(listing.id);

  const title = lang === "ar" ? listing.titleAr : listing.title;

  if (variant === "list") {
    return (
      <div
        onClick={() => navigate(`/listing/${listing.id}`)}
        className={`bg-white rounded-2xl overflow-hidden flex gap-3 p-3 cursor-pointer active:scale-[0.98] transition-transform
          ${listing.isBoosted ? "ring-1 ring-[#C8972B]/40 shadow-md" : "shadow-sm"}`}
      >
        <div className="relative w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden bg-gray-100">
          <img
            src={listing.images[0]}
            alt={title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          {listing.isBoosted && (
            <div className="absolute top-1 start-1 bg-[#C8972B] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
              <Zap className="w-2.5 h-2.5" />
              {t("boosted")}
            </div>
          )}
          {listing.isUrgent && (
            <div className="absolute top-1 start-1 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
              {t("urgent")}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
          <div>
            <p className="text-sm font-semibold text-gray-900 truncate leading-tight">{title}</p>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-base font-bold text-[#1B6B3A]">
                {listing.price.toLocaleString()} {t("da")}
              </span>
              {listing.negotiable && (
                <span className="text-[10px] text-gray-400">• {t("negotiable")}</span>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-gray-400">
              <MapPin className="w-3 h-3" />
              <span className="text-xs">{listing.wilaya}</span>
            </div>
            <div className="flex items-center gap-1 text-gray-300">
              <Eye className="w-3 h-3" />
              <span className="text-[10px]">{listing.views}</span>
            </div>
          </div>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); toggleFavorite(listing.id); }}
          className="self-start mt-0.5 p-1.5"
        >
          <Heart
            className={`w-4.5 h-4.5 transition-colors ${fav ? "fill-red-500 text-red-500" : "text-gray-300"}`}
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
        ${listing.isBoosted ? "ring-1 ring-[#C8972B]/40 shadow-md" : "shadow-sm"}`}
    >
      <div className="relative aspect-[4/3] bg-gray-100">
        <img
          src={listing.images[0]}
          alt={title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <button
          onClick={(e) => { e.stopPropagation(); toggleFavorite(listing.id); }}
          className="absolute top-2 end-2 w-7 h-7 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-sm"
        >
          <Heart
            className={`w-3.5 h-3.5 transition-colors ${fav ? "fill-red-500 text-red-500" : "text-gray-500"}`}
            strokeWidth={fav ? 0 : 1.8}
          />
        </button>
        {listing.isBoosted && (
          <div className="absolute top-2 start-2 bg-[#C8972B] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
            <Zap className="w-2.5 h-2.5" />
            {t("boosted")}
          </div>
        )}
        {listing.isUrgent && !listing.isBoosted && (
          <div className="absolute top-2 start-2 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
            {t("urgent")}
          </div>
        )}
        {listing.condition === "new" && (
          <div className="absolute bottom-2 start-2 bg-[#1B6B3A] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
            {t("conditionNew")}
          </div>
        )}
      </div>
      <div className="p-2.5">
        <p className="text-xs font-semibold text-gray-900 truncate leading-tight">{title}</p>
        <p className="text-sm font-bold text-[#1B6B3A] mt-0.5">
          {listing.price.toLocaleString()} {t("da")}
        </p>
        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center gap-0.5 text-gray-400">
            <MapPin className="w-2.5 h-2.5" />
            <span className="text-[10px]">{listing.wilaya}</span>
          </div>
          {listing.negotiable && (
            <span className="text-[9px] text-[#C8972B] font-medium bg-amber-50 px-1.5 py-0.5 rounded-full">
              {t("negotiable")}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
