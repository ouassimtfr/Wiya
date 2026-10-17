import { useState } from "react";
import { Heart, MapPin, Zap, Briefcase, Camera, Package, Play } from "lucide-react";
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
  // Les cartes utilisent la petite version de la photo (plus rapide, moins de données) ;
  // si elle n'existe pas ou ne charge pas, on retombe sur la grande photo.
  const [thumbFailed, setThumbFailed] = useState(false);

  const isJob = listing.category === "jobs";
  const title = listing.title ?? tr("Sans titre", "بدون عنوان");
  const images: string[] = Array.isArray(listing.images) ? listing.images : [];
  const image = (!thumbFailed && listing.thumb_url) || images[0] || "";
  const photoCount = images.length;
  const hasVideo = !!listing.video_url;
  const price = listing.price ?? 0;
  const wilayaRaw = listing.wilaya ?? "";
  const wilaya = isRTL ? WILAYAS_DATA.find((w) => w.name === wilayaRaw)?.nameAr ?? wilayaRaw : wilayaRaw;
  const isBoosted = listing.is_boosted ?? false;
  const isUrgent = listing.is_urgent ?? false;
  const isNegotiable = listing.is_negotiable ?? false;

  const jobSectorRaw: string = listing.job_sector ?? "";
  const jobSector = isRTL ? JOB_SECTOR_AR[jobSectorRaw] ?? jobSectorRaw : jobSectorRaw;
  const isSeeking = isJob && listing.job_kind === "seeking";

  const priceText = isJob
    ? price > 0
      ? `${price.toLocaleString()} ${t("da")} ${tr("/ mois", "/ شهر")}`
      : tr("Salaire à discuter", "الراتب قابل للنقاش")
    : `${price.toLocaleString()} ${t("da")}`;

  const timeAgo = (iso?: string): string => {
    if (!iso) return "";
    const diff = Date.now() - new Date(iso).getTime();
    if (!isFinite(diff) || diff < 0) return "";
    const mins = Math.floor(diff / 60000);
    const hrs = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1) return tr("À l'instant", "الآن");
    if (mins < 60) return tr(`Il y a ${mins} min`, `منذ ${mins} دقيقة`);
    if (hrs < 24) return tr(`Il y a ${hrs} h`, `منذ ${hrs} ساعة`);
    if (days < 30) return tr(`Il y a ${days} j`, `منذ ${days} يوم`);
    return new Date(iso).toLocaleDateString(isRTL ? "ar-DZ" : "fr-FR", { day: "2-digit", month: "short" });
  };
  const when = timeAgo(listing.created_at);

  const Placeholder = ({ small }: { small?: boolean }) => (
    <div className="w-full h-full bg-gradient-to-br from-primary/10 to-accent/20 flex items-center justify-center">
      {isJob ? (
        <Briefcase className={`${small ? "w-7 h-7" : "w-10 h-10"} text-primary/50`} />
      ) : (
        <Package className={`${small ? "w-7 h-7" : "w-10 h-10"} text-primary/40`} />
      )}
    </div>
  );

  const renderImage = (small?: boolean) => {
    if (!image || failed) return <Placeholder small={small} />;
    return (
      <>
        {!loaded && <div className="absolute inset-0 bg-muted animate-pulse" />}
        <img
          key={image}
          src={image}
          alt={title}
          loading="lazy"
          decoding="async"
          ref={(el) => {
            // Photo déjà en cache : onLoad ne se déclenche pas toujours, on vérifie à la main
            if (el && !loaded && el.complete && el.naturalWidth > 0) setLoaded(true);
          }}
          onLoad={() => setLoaded(true)}
          onError={() => {
            if (listing.thumb_url && !thumbFailed && images[0]) setThumbFailed(true);
            else setFailed(true);
          }}
          className={`w-full h-full object-cover transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
        />
      </>
    );
  };

  const badges = (
    <div className="absolute top-2 start-2 flex flex-col items-start gap-1">
      {isBoosted && (
        <div className="bg-accent text-accent-foreground text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow">
          <Zap className="w-3 h-3 fill-current" />
          {tr("À la une", "مميز")}
        </div>
      )}
      {isUrgent && (
        <div className="bg-destructive text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow">
          {t("urgent")}
        </div>
      )}
    </div>
  );

  const heartOverlay = (
    <button
      onClick={(e) => {
        e.stopPropagation();
        toggleFavorite(listing.id);
      }}
      aria-label="Favori"
      className="absolute bottom-2 end-2 w-9 h-9 rounded-full bg-white shadow flex items-center justify-center active:scale-90 transition-transform"
    >
      <Heart
        className={`w-[18px] h-[18px] transition-colors ${fav ? "fill-red-500 text-red-500" : "text-gray-900"}`}
        strokeWidth={fav ? 0 : 2.1}
      />
    </button>
  );

  // Badge « Vidéo » bien lisible + compteur de photos, en bas à gauche de l'image
  const renderMedia = (endClass: string) =>
    photoCount > 1 || hasVideo ? (
      <div className={`absolute bottom-2 start-2 ${endClass} flex items-center gap-1 flex-wrap`}>
        {hasVideo && (
          <div className="bg-black/75 text-white text-[10px] font-bold ps-1.5 pe-2 py-1 rounded-full flex items-center gap-1">
            <Play className="w-3 h-3 fill-white" />
            {tr("Vidéo", "فيديو")}
          </div>
        )}
        {photoCount > 1 && (
          <div className="bg-black/60 text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
            <Camera className="w-3 h-3" />
            {photoCount}
          </div>
        )}
      </div>
    ) : null;

  const metaRow = (
    <div className="flex items-center gap-1 text-muted-foreground min-w-0">
      <MapPin className="w-3 h-3 flex-shrink-0" />
      <span className="text-[12px] truncate">
        {wilaya}
        {wilaya && when ? " · " : ""}
        {when}
      </span>
    </div>
  );

  const jobRow = isJob && (
    <div className="flex items-center gap-1.5 mt-1 min-w-0">
      <span
        className={`flex-shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
          isSeeking ? "bg-accent/25 text-foreground" : "bg-primary/10 text-primary"
        }`}
      >
        {isSeeking ? tr("Cherche un emploi", "يبحث عن عمل") : tr("Recrute", "يوظّف")}
      </span>
      {jobSector && <span className="text-[10px] text-muted-foreground truncate">{jobSector}</span>}
    </div>
  );

  // ─── Carte en liste (recherche, favoris, mes annonces) ───
  if (variant === "list") {
    return (
      <div
        onClick={() => navigate(`/listing/${listing.id}`)}
        className="bg-card rounded-3xl p-2.5 flex gap-3 cursor-pointer ring-1 ring-border/60 active:scale-[0.98] transition-transform"
      >
        <div className="relative w-28 h-28 flex-shrink-0 rounded-2xl overflow-hidden bg-muted">
          {renderImage(true)}
          {isBoosted && (
            <div className="absolute top-1.5 start-1.5 bg-accent text-accent-foreground rounded-full p-1 shadow">
              <Zap className="w-3 h-3 fill-current" />
            </div>
          )}
          {renderMedia("end-1.5")}
        </div>
        <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
          <div>
            <p className="font-display text-[18px] font-extrabold text-foreground leading-tight">{priceText}</p>
            <p className="text-[14px] text-foreground line-clamp-2 leading-snug mt-1">{title}</p>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              {isUrgent && (
                <span className="text-[10px] font-bold text-white bg-destructive px-1.5 py-0.5 rounded-full">
                  {t("urgent")}
                </span>
              )}
              {isNegotiable && (
                <span className="text-[10px] font-medium text-foreground bg-accent/25 px-1.5 py-0.5 rounded-full">
                  {t("negotiable")}
                </span>
              )}
            </div>
            {jobRow}
          </div>
          {metaRow}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(listing.id);
          }}
          aria-label="Favori"
          className="self-start p-1.5 active:scale-90 transition-transform"
        >
          <Heart
            className={`w-5 h-5 transition-colors ${fav ? "fill-red-500 text-red-500" : "text-muted-foreground"}`}
            strokeWidth={fav ? 0 : 1.7}
          />
        </button>
      </div>
    );
  }

  // ─── Carte en grille (accueil, annonces similaires) : photo, prix, titre, lieu ───
  return (
    <div
      onClick={() => navigate(`/listing/${listing.id}`)}
      className="cursor-pointer active:scale-[0.97] transition-transform"
    >
      <div className="relative aspect-square rounded-[18px] overflow-hidden bg-muted">
        {renderImage(false)}
        {badges}
        {heartOverlay}
        {renderMedia("end-12")}
      </div>
      <p className="font-display text-[18px] font-extrabold text-foreground leading-tight mt-2">{priceText}</p>
      <p className="text-[14px] text-foreground line-clamp-1 mt-0.5">{title}</p>
      {jobRow}
      <div className="mt-0.5">{metaRow}</div>
    </div>
  );
}
