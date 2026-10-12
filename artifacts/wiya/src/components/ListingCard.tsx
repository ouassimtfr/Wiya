import { useState } from "react";
import { Heart, MapPin, Zap, Briefcase } from "lucide-react";
import { useLocation } from "wouter";
import { useStore } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import { WILAYAS_DATA } from "@/lib/wilayas";

interface Props {
  listing: any;
  variant?: "grid" | "list" | "featured";
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

  // Chargement progressif : fond animé tant que la photo n'est pas arrivée, puis fondu.
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

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
    <div className="w-full h-full bg-gradient-to-br from-primary/15 to-accent/25 flex items-center justify-center">
      <Briefcase className={`${small ? "w-7 h-7" : "w-9 h-9"} text-primary/60`} />
    </div>
  );

  const renderImage = (small?: boolean) => {
    if (!image || failed) return <Placeholder small={small} />;
    return (
      <>
        {!loaded && <div className="absolute inset-0 bg-muted animate-pulse" />}
        <img
          src={image}
          alt={title}
          loading="lazy"
          decoding="async"
          ref={(el) => {
            // Photo déjà en cache : onLoad ne se déclenche pas toujours, on vérifie à la main
            if (el && !loaded && el.complete && el.naturalWidth > 0) setLoaded(true);
          }}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={`w-full h-full object-cover transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
        />
      </>
    );
  };

  const badges = (
    <>
      {isBoosted && (
        <div className="absolute top-2 start-2 bg-accent text-accent-foreground text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-sm">
          <Zap className="w-3 h-3" />
          {t("boosted")}
        </div>
      )}
      {isUrgent && !isBoosted && (
        <div className="absolute top-2 start-2 bg-destructive text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm">
          {t("urgent")}
        </div>
      )}
    </>
  );

  const heartOverlay = (
    <button
      onClick={(e) => { e.stopPropagation(); toggleFavorite(listing.id); }}
      aria-label="Favori"
      className="absolute top-2 end-2 w-8 h-8 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center active:scale-90 transition-transform"
    >
      <Heart
        className={`w-4 h-4 transition-colors ${fav ? "fill-red-500 text-red-500" : "text-white"}`}
        strokeWidth={fav ? 0 : 2}
      />
    </button>
  );

  const jobRow = isJob && (
    <div className="flex items-center gap-1.5 mt-1 min-w-0">
      <span
        className={`flex-shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
          isSeeking ? "bg-accent/20 text-foreground" : "bg-primary/10 text-primary"
        }`}
      >
        {isSeeking ? tr("Cherche un emploi", "يبحث عن عمل") : tr("Recrute", "يوظّف")}
      </span>
      {jobSector && <span className="text-[10px] text-muted-foreground truncate">{jobSector}</span>}
    </div>
  );

  // ─── Grande carte "À la une" (annonces boostées) ───
  if (variant === "featured") {
    return (
      <div
        onClick={() => navigate(`/listing/${listing.id}`)}
        className="flex-none w-[78%] snap-start bg-card rounded-3xl overflow-hidden cursor-pointer border border-accent/70 shadow-md active:scale-[0.98] transition-transform"
      >
        <div className="relative h-44 bg-muted">
          {renderImage(false)}
          {badges}
          {heartOverlay}
        </div>
        <div className="p-3.5">
          <p className="font-display text-xl font-bold text-primary leading-tight">{priceText}</p>
          <p className="text-[15px] font-semibold text-foreground truncate mt-0.5">{title}</p>
          <div className="flex items-center gap-1 mt-1 text-muted-foreground">
            <MapPin className="w-3.5 h-3.5" />
            <span className="text-xs">{wilaya}</span>
          </div>
        </div>
      </div>
    );
  }

  // ─── Carte en liste (accueil, mes annonces) ───
  if (variant === "list") {
    return (
      <div
        onClick={() => navigate(`/listing/${listing.id}`)}
        className="bg-card rounded-3xl p-3 flex gap-3 cursor-pointer border border-border shadow-sm active:scale-[0.98] transition-transform"
      >
        <div className="relative w-24 h-24 flex-shrink-0 rounded-2xl overflow-hidden bg-muted">
          {renderImage(true)}
          {isUrgent && (
            <div className="absolute top-1 start-1 bg-destructive text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
              {t("urgent")}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
          <div>
            <p className="text-[15px] font-semibold text-foreground truncate leading-tight">{title}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="font-display text-lg font-bold text-primary">{priceText}</span>
              {isNegotiable && <span className="text-[10px] text-muted-foreground">• {t("negotiable")}</span>}
            </div>
            {jobRow}
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <MapPin className="w-3.5 h-3.5" />
            <span className="text-xs">{wilaya}</span>
          </div>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); toggleFavorite(listing.id); }}
          aria-label="Favori"
          className="self-start p-1.5 active:scale-90 transition-transform"
        >
          <Heart
            className={`w-5 h-5 transition-colors ${fav ? "fill-red-500 text-red-500" : "text-muted-foreground"}`}
            strokeWidth={fav ? 0 : 1.6}
          />
        </button>
      </div>
    );
  }

  // ─── Carte en grille ───
  return (
    <div
      onClick={() => navigate(`/listing/${listing.id}`)}
      className={`bg-card rounded-3xl overflow-hidden cursor-pointer border shadow-sm active:scale-[0.97] transition-transform ${
        isBoosted ? "border-accent/70" : "border-border"
      }`}
    >
      <div className="relative aspect-[4/3] bg-muted">
        {renderImage(false)}
        {badges}
        {heartOverlay}
        {!isJob && condition === "new" && (
          <div className="absolute bottom-2 start-2 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">
            {t("conditionNew")}
          </div>
        )}
        {isJob && jobSector && (
          <div className="absolute bottom-2 start-2 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full max-w-[90%] truncate">
            {jobSector}
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="font-display text-base font-bold text-primary leading-tight">{priceText}</p>
        <p className="text-[13px] font-semibold text-foreground truncate mt-0.5">{title}</p>
        <div className="flex items-center justify-between mt-1.5">
          <div className="flex items-center gap-1 text-muted-foreground">
            <MapPin className="w-3 h-3" />
            <span className="text-[11px]">{wilaya}</span>
          </div>
          {isNegotiable && (
            <span className="text-[10px] text-foreground font-medium bg-accent/25 px-1.5 py-0.5 rounded-full">
              {t("negotiable")}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
