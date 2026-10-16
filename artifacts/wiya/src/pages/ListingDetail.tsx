import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import {
  Heart, MapPin, ChevronLeft, ChevronRight, Phone, MessageCircle, Zap, Clock,
  Trash2, CheckCircle, Share2, Play, X, ShieldCheck, Camera, Flag, BadgeCheck, RefreshCw,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { CATEGORIES } from "@/lib/data";
import { WILAYAS_DATA } from "@/lib/wilayas";
import { supabase } from "@/lib/supabase";
import { deleteListingMedia } from "@/lib/storageCleanup";
import ListingCard from "@/components/ListingCard";
import ImageLightbox from "@/components/ImageLightbox";

const DAY = 86400000;
const RENEW_DAYS = 60;

// 0555 12 34 56 → 213555123456 (format international pour WhatsApp)
function waNumber(phone: string): string {
  let d = phone.replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  else if (d.startsWith("0")) d = "213" + d.slice(1);
  return d;
}

export default function ListingDetail() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { t, isRTL } = useI18n();
  const tr = (fr: string, ar: string) => (isRTL ? ar : fr);
  const { toggleFavorite, isFavorite, user, startConversation } = useStore();

  const [imgIndex, setImgIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [videoOpen, setVideoOpen] = useState(false);
  const [showMsgBox, setShowMsgBox] = useState(false);
  const [msgText, setMsgText] = useState("");
  const [listing, setListing] = useState<any>(null);
  const [similar, setSimilar] = useState<any[]>([]);
  const [sellerProfile, setSellerProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [marking, setMarking] = useState(false);
  const [renewing, setRenewing] = useState(false);
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [reportSent, setReportSent] = useState(false);

  const touchX = useRef<number | null>(null);
  const swiped = useRef(false);

  useEffect(() => { fetchListing(); }, [params.id]);

  const fetchListing = async () => {
    setLoading(true);
    setImgIndex(0);
    const { data } = await supabase.from("listings").select("*").eq("id", params.id).single();
    if (data) {
      setListing(data);
      const { data: sim } = await supabase.from("listings").select("*").eq("category", data.category).neq("id", data.id).eq("is_active", true).limit(4);
      setSimilar(sim ?? []);
      const { data: profile } = await supabase.from("profiles").select("username, phone, avatar_url, is_verified").eq("id", data.user_id).single();
      if (profile) setSellerProfile(profile);
    }
    setLoading(false);
  };

  const images: string[] = Array.isArray(listing?.images) ? listing.images : [];

  const goTo = (dir: 1 | -1) => {
    if (images.length < 2) return;
    setImgIndex((prev) => (prev + dir + images.length) % images.length);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    touchX.current = e.touches[0].clientX;
    swiped.current = false;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    touchX.current = null;
    if (Math.abs(dx) > 40) {
      swiped.current = true;
      goTo(dx < 0 ? 1 : -1);
    }
  };

  const handleBack = () => {
    if (window.history.length > 1) window.history.back();
    else navigate("/");
  };

  const handleShare = async () => {
    const url = window.location.href;
    const title = listing?.title ?? "Wiya";
    if (navigator.share) {
      try { await navigator.share({ title, url }); } catch {}
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  // Supprime l'annonce ET libère l'espace : photos et vidéo effacées du stockage
  const handleDelete = async () => {
    if (!confirm(tr("Supprimer cette annonce ? Ses photos seront aussi supprimées.", "حذف هذا الإعلان؟ سيتم حذف صوره أيضا."))) return;
    setDeleting(true);

    const media = { images: listing.images, video_url: listing.video_url };

    const { error, count } = await supabase
      .from("listings")
      .delete({ count: "exact" })
      .eq("id", params.id);

    if (error) {
      console.error("Erreur suppression:", error);
      alert(tr("Erreur suppression, réessaie.", "خطأ في الحذف، حاول مرة أخرى."));
      setDeleting(false);
      return;
    }

    if (!count) {
      console.error("Suppression bloquée silencieusement (0 ligne affectée, probablement RLS).");
      alert(tr("Suppression refusée par le serveur (droits insuffisants). Vérifie les permissions.", "رفض الخادم الحذف (صلاحيات غير كافية)."));
      setDeleting(false);
      return;
    }

    // On efface les fichiers seulement après la suppression réussie de l'annonce
    await deleteListingMedia(media);
    navigate("/");
  };

  // « Vendu » : l'annonce disparaît des listes et ses photos/vidéo sont supprimées pour libérer l'espace
  const handleMarkSold = async () => {
    const confirmed = confirm(
      tr(
        "Marquer cette annonce comme vendue ? Elle disparaîtra et ses photos seront supprimées.",
        "وضع علامة «مباع» على هذا الإعلان؟ سيختفي وسيتم حذف صوره."
      )
    );
    if (!confirmed) return;

    setMarking(true);
    const media = { images: listing.images, video_url: listing.video_url };

    const { error } = await supabase
      .from("listings")
      .update({
        is_active: false,
        sold_at: new Date().toISOString(),
        images: [],
        ...(listing.video_url ? { video_url: null } : {}),
      })
      .eq("id", params.id);

    if (!error) {
      await deleteListingMedia(media);
      alert(tr("Annonce marquée comme vendue !", "تم وضع علامة «مباع» على الإعلان!"));
      navigate("/");
    } else {
      console.error("Erreur marquage vendu:", error);
      alert(tr("Erreur, réessaie.", "خطأ، حاول مرة أخرى."));
      setMarking(false);
    }
  };

  // Renouvelle une annonce expirée (ou proche de l'expiration) pour 60 jours
  const handleRenew = async () => {
    setRenewing(true);
    const until = new Date(Date.now() + RENEW_DAYS * DAY).toISOString();
    const { error } = await supabase
      .from("listings")
      .update({ is_active: true, expires_at: until })
      .eq("id", params.id);
    setRenewing(false);
    if (error) {
      console.error("Erreur renouvellement:", error);
      alert(tr("Erreur, réessaie.", "خطأ، حاول مرة أخرى."));
      return;
    }
    setListing((l: any) => ({ ...l, is_active: true, expires_at: until }));
  };

  const handleReport = async (reason: string) => {
    if (!user) { navigate("/auth"); return; }
    setReporting(true);
    const { error } = await supabase
      .from("reports")
      .insert({ listing_id: String(listing.id), reporter_id: user.id, reason });
    setReporting(false);
    if (error) {
      console.error("Erreur signalement:", error);
      alert(tr("Erreur, réessaie.", "خطأ، حاول مرة أخرى."));
      return;
    }
    setReportSent(true);
  };

  const closeReport = () => {
    setShowReport(false);
    setReportSent(false);
  };

  const handleSendMessage = async (customText?: string) => {
    if (!user) { navigate("/auth"); return; }
    const msg = customText ?? msgText.trim();
    if (!msg || !listing) return;
    setSending(true);

    const conversationId = await startConversation(
      listing.id,
      listing.title,
      listing.images?.[0] ?? "",
      listing.user_id,
      sellerProfile?.username ?? tr("Vendeur", "البائع"),
      sellerProfile?.avatar_url ?? "",
      msg
    );

    setMsgText("");
    setShowMsgBox(false);
    setSending(false);
    navigate(`/messages/${conversationId}`);
  };

  if (loading) {
    return (
      <div className="bg-white min-h-[100dvh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!listing) {
    return (
      <div className="bg-white min-h-[100dvh] flex flex-col items-center justify-center gap-4 px-8 text-center">
        <p className="text-muted-foreground">{tr("Annonce introuvable", "الإعلان غير موجود")}</p>
        <button onClick={() => navigate("/")} className="px-6 py-3 bg-primary text-primary-foreground rounded-2xl font-semibold text-sm">
          {tr("Retour à l'accueil", "العودة إلى الرئيسية")}
        </button>
      </div>
    );
  }

  const isJob = listing.category === "jobs";
  const category = CATEGORIES.find((c) => c.id === listing.category);
  const fav = isFavorite(listing.id);
  const isMyListing = user?.id === listing.user_id;
  const displayPhone: string | null = listing.contact_phone || sellerProfile?.phone || null;
  const wilayaLabel = isRTL
    ? WILAYAS_DATA.find((w) => w.name === listing.wilaya)?.nameAr ?? listing.wilaya
    : listing.wilaya;
  const place = [listing.city, wilayaLabel].filter(Boolean).join(", ");

  // Annonce expirée (jamais vendue) : visible seulement par son vendeur, qui peut la renouveler
  const expired = !listing.is_active && !listing.sold_at;
  const daysLeft = listing.expires_at ? Math.ceil((new Date(listing.expires_at).getTime() - Date.now()) / DAY) : null;

  const price = listing.price ?? 0;
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
    return new Date(iso).toLocaleDateString(isRTL ? "ar-DZ" : "fr-FR");
  };

  const waText = encodeURIComponent(
    tr(
      `Bonjour, je suis intéressé par votre annonce « ${listing.title} » sur Wiya.`,
      `مرحبا، أنا مهتم بإعلانك «${listing.title}» على ويا.`
    )
  );
  const waHref = displayPhone ? `https://wa.me/${waNumber(displayPhone)}?text=${waText}` : "#";

  const reportReasons = [
    tr("Arnaque ou faux prix", "احتيال أو سعر مزيف"),
    tr("Annonce interdite", "إعلان ممنوع"),
    tr("Déjà vendu", "تم بيعه"),
    tr("Mauvaise catégorie", "فئة خاطئة"),
    tr("Autre", "أخرى"),
  ];

  const chip = "flex items-center gap-1.5 bg-muted rounded-xl px-3 py-2";
  const roundBtn =
    "pointer-events-auto w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center active:scale-95 transition-transform";

  return (
    <div className="bg-white min-h-[100dvh] pb-[calc(7.5rem+env(safe-area-inset-bottom))]">
      {/* ─── Galerie ─── */}
      <div
        className="relative bg-muted aspect-[4/3] select-none"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {images.length > 0 ? (
          <button
            type="button"
            onClick={() => {
              if (swiped.current) { swiped.current = false; return; }
              setLightboxOpen(true);
            }}
            className="w-full h-full block"
            aria-label={tr("Agrandir la photo", "تكبير الصورة")}
          >
            <AnimatePresence mode="wait">
              <motion.img
                key={imgIndex}
                src={images[imgIndex]}
                alt={listing.title}
                className="w-full h-full object-cover"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
              />
            </AnimatePresence>
          </button>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground/40 text-6xl">📦</div>
        )}

        {/* Boutons du haut */}
        <div className="absolute top-[calc(1rem+env(safe-area-inset-top))] inset-x-4 flex items-center justify-between pointer-events-none">
          <button onClick={handleBack} aria-label="Retour" className={roundBtn}>
            <ChevronLeft className={`w-5 h-5 text-gray-900 ${isRTL ? "rotate-180" : ""}`} strokeWidth={2.4} />
          </button>
          <div className="flex items-center gap-2">
            <button onClick={handleShare} aria-label="Partager" className={roundBtn}>
              <Share2 className="w-[18px] h-[18px] text-gray-900" strokeWidth={2.2} />
            </button>
            <button onClick={() => toggleFavorite(listing.id)} aria-label="Favori" className={roundBtn}>
              <Heart className={`w-[18px] h-[18px] ${fav ? "fill-red-500 text-red-500" : "text-gray-900"}`} strokeWidth={fav ? 0 : 2.2} />
            </button>
          </div>
        </div>

        {copied && (
          <div className="absolute top-[calc(4.25rem+env(safe-area-inset-top))] end-4 bg-white text-gray-900 text-[11px] font-semibold px-3 py-1.5 rounded-full shadow-lg">
            {tr("Lien copié !", "تم نسخ الرابط!")}
          </div>
        )}

        {/* Badges en bas à gauche */}
        <div className="absolute bottom-3 start-4 flex gap-1.5">
          {listing.is_boosted && (
            <span className="bg-accent text-accent-foreground text-[12px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1 shadow">
              <Zap className="w-3.5 h-3.5 fill-current" /> {tr("À la une", "مميز")}
            </span>
          )}
          {listing.is_urgent && (
            <span className="bg-destructive text-white text-[12px] font-bold px-3 py-1.5 rounded-full shadow">{t("urgent")}</span>
          )}
        </div>

        {/* Vidéo et compteur en bas à droite */}
        <div className="absolute bottom-3 end-4 flex items-center gap-2">
          {listing.video_url && (
            <button
              onClick={() => setVideoOpen(true)}
              className="flex items-center gap-1.5 bg-black/75 backdrop-blur-sm text-white text-xs font-bold ps-3 pe-3.5 py-1.5 rounded-full active:scale-95 transition-transform"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              {tr("Vidéo", "فيديو")}
            </button>
          )}
          {images.length > 1 && (
            <div className="flex items-center gap-1 bg-black/60 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full pointer-events-none">
              <Camera className="w-3.5 h-3.5" />
              {imgIndex + 1}/{images.length}
            </div>
          )}
        </div>
      </div>

      <div className="px-5 pt-5 space-y-4">
        {/* Annonce expirée : bandeau de renouvellement pour son vendeur */}
        {isMyListing && expired && (
          <div className="bg-accent/25 rounded-2xl p-4">
            <p className="text-[15px] font-bold text-foreground">
              {tr("Cette annonce a expiré", "انتهت صلاحية هذا الإعلان")}
            </p>
            <p className="text-[13px] text-foreground/80 mt-0.5 leading-snug">
              {tr(
                "Elle n'est plus visible par les acheteurs. Renouvelez-la pour la remettre en ligne.",
                "لم تعد ظاهرة للمشترين. جدّدها لإعادتها."
              )}
            </p>
            <button
              onClick={handleRenew}
              disabled={renewing}
              className="mt-3 w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold disabled:opacity-60 active:scale-[0.98] transition-transform"
            >
              <RefreshCw className={`w-4 h-4 ${renewing ? "animate-spin" : ""}`} />
              {tr(`Renouveler pour ${RENEW_DAYS} jours`, `تجديد لمدة ${RENEW_DAYS} يوم`)}
            </button>
          </div>
        )}

        {/* Prix + titre */}
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <p className="font-display text-[32px] font-extrabold text-primary leading-none">{priceText}</p>
            {listing.is_negotiable && (
              <span className="text-[12px] font-bold text-foreground bg-accent/25 px-2.5 py-1 rounded-full">
                {t("negotiable")}
              </span>
            )}
          </div>
          <h1 className="text-[20px] font-bold text-foreground leading-snug mt-2">{listing.title}</h1>
        </div>

        {/* Annonce avec vidéo : bouton bien visible */}
        {listing.video_url && (
          <button
            onClick={() => setVideoOpen(true)}
            className="w-full flex items-center gap-3 bg-primary text-primary-foreground rounded-2xl p-3.5 text-start shadow-md active:scale-[0.99] transition-transform"
          >
            <span className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <Play className="w-5 h-5 fill-current" />
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-[15px] font-bold">
                {tr("Cette annonce a une vidéo", "هذا الإعلان يحتوي على فيديو")}
              </span>
              <span className="block text-[12px] opacity-85">
                {tr("Touchez pour la regarder", "اضغط للمشاهدة")}
              </span>
            </span>
            <ChevronRight className={`w-5 h-5 flex-shrink-0 ${isRTL ? "rotate-180" : ""}`} />
          </button>
        )}

        {/* Infos */}
        <div className="flex flex-wrap gap-2">
          {category && (
            <div className={chip}>
              <span className="text-base">{category.icon}</span>
              <span className="text-[13px] text-foreground">{t(listing.category as any)}</span>
            </div>
          )}
          {place && (
            <div className={chip}>
              <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-[13px] text-foreground">{place}</span>
            </div>
          )}
          {!isJob && listing.condition && (
            <div className={chip}>
              <span className={`w-2 h-2 rounded-full ${listing.condition === "new" ? "bg-primary" : "bg-orange-400"}`} />
              <span className="text-[13px] text-foreground">
                {listing.condition === "new" ? t("conditionNew") : t("conditionUsed")}
              </span>
            </div>
          )}
          <div className={chip}>
            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-[13px] text-foreground">{timeAgo(listing.created_at)}</span>
          </div>
        </div>

        {/* Vendeur */}
        {sellerProfile && !isMyListing && (
          <button
            onClick={() => navigate(`/seller/${listing.user_id}`)}
            className="w-full border border-border rounded-2xl p-3.5 flex items-center gap-3 text-start active:scale-[0.99] transition-transform"
          >
            <div className="w-11 h-11 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {sellerProfile.avatar_url ? (
                <img src={sellerProfile.avatar_url} className="w-11 h-11 rounded-full object-cover" alt="" />
              ) : (
                <span className="text-primary font-extrabold text-lg">
                  {(sellerProfile.username ?? "?").charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[15px] font-bold text-foreground truncate flex items-center gap-1.5">
                <span className="truncate">{sellerProfile.username ?? tr("Vendeur", "البائع")}</span>
                {sellerProfile.is_verified && (
                  <BadgeCheck className="w-[18px] h-[18px] text-primary flex-shrink-0" aria-label={tr("Vendeur vérifié", "بائع موثق")} />
                )}
              </p>
              {sellerProfile.is_verified && (
                <p className="text-[12px] font-bold text-primary">{tr("Vendeur vérifié", "بائع موثق")}</p>
              )}
              <p className="text-[13px] text-primary font-bold mt-0.5">{tr("Voir toutes ses annonces", "عرض كل إعلاناته")}</p>
            </div>
            <ChevronRight className={`w-4 h-4 text-muted-foreground flex-shrink-0 ${isRTL ? "rotate-180" : ""}`} />
          </button>
        )}

        {/* Description */}
        {listing.description && (
          <div>
            <h3 className="text-[15px] font-bold text-foreground">{t("description")}</h3>
            <p dir="auto" className="text-[14px] text-foreground/75 leading-relaxed whitespace-pre-wrap break-words mt-1">
              {listing.description}
            </p>
          </div>
        )}

        {/* Conseil sécurité + signalement */}
        {!isMyListing && (
          <>
            <div className="flex items-start gap-3 bg-primary/10 rounded-2xl p-3.5">
              <ShieldCheck className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <p className="text-[13px] text-foreground leading-snug">
                {tr(
                  "Rencontrez le vendeur dans un lieu public et ne payez jamais à l'avance.",
                  "قابل البائع في مكان عام ولا تدفع مسبقا."
                )}
              </p>
            </div>
            <button
              onClick={() => {
                if (!user) { navigate("/auth"); return; }
                setShowReport(true);
              }}
              className="flex items-center gap-2 text-[13px] font-semibold text-muted-foreground active:opacity-70"
            >
              <Flag className="w-4 h-4" />
              {tr("Signaler cette annonce", "الإبلاغ عن هذا الإعلان")}
            </button>
          </>
        )}

        {/* Gestion de mon annonce */}
        {isMyListing && (
          <div className="space-y-2">
            <p className="text-xs font-bold text-muted-foreground uppercase">{tr("Gérer mon annonce", "إدارة إعلاني")}</p>
            {!expired && daysLeft !== null && (
              <p className={`text-[13px] font-semibold ${daysLeft <= 10 ? "text-destructive" : "text-muted-foreground"}`}>
                {tr(`Expire dans ${Math.max(daysLeft, 0)} jours`, `تنتهي خلال ${Math.max(daysLeft, 0)} يوم`)}
              </p>
            )}
            <div className="flex gap-2">
              <button onClick={() => navigate(`/boost/${listing.id}`)} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-accent text-accent-foreground font-bold text-sm">
                <Zap className="w-4 h-4 fill-current" />{tr("Booster", "تعزيز")}
              </button>
              <button onClick={handleMarkSold} disabled={marking} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-muted text-foreground font-semibold text-sm disabled:opacity-60">
                <CheckCircle className="w-4 h-4" />{tr("Vendu", "مباع")}
              </button>
              <button onClick={handleDelete} disabled={deleting} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-destructive/10 text-destructive font-semibold text-sm disabled:opacity-60">
                <Trash2 className="w-4 h-4" />{tr("Supprimer", "حذف")}
              </button>
            </div>
            {!expired && daysLeft !== null && daysLeft <= 10 && (
              <button
                onClick={handleRenew}
                disabled={renewing}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-accent/25 text-foreground font-bold text-sm disabled:opacity-60"
              >
                <RefreshCw className={`w-4 h-4 ${renewing ? "animate-spin" : ""}`} />
                {tr(`Prolonger de ${RENEW_DAYS} jours`, `تمديد ${RENEW_DAYS} يوم`)}
              </button>
            )}
          </div>
        )}

        {/* Annonces similaires */}
        {similar.length > 0 && (
          <div className="pt-3">
            <h3 className="font-display text-[20px] font-extrabold text-foreground mb-3">{t("similarListings")}</h3>
            <div className="grid grid-cols-2 gap-x-3 gap-y-5">
              {similar.map((l) => <ListingCard key={l.id} listing={l} />)}
            </div>
          </div>
        )}
      </div>

      {/* ─── Fenêtre message ─── */}
      <AnimatePresence>
        {showMsgBox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[100] flex items-end"
            onClick={() => setShowMsgBox(false)}
          >
            <motion.div
              initial={{ y: 200 }}
              animate={{ y: 0 }}
              exit={{ y: 200 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card w-full max-w-[430px] mx-auto rounded-t-3xl p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] space-y-4"
            >
              <div className="w-10 h-1 bg-border rounded-full mx-auto" />
              <h3 className="text-sm font-bold text-foreground">{t("sendMessage")}</h3>
              <div className="flex gap-2">
                {[
                  tr("Toujours dispo ?", "هل ما زال متوفرا؟"),
                  tr("Quel est votre meilleur prix ?", "ما هو أفضل سعر؟"),
                  tr("Je suis intéressé !", "أنا مهتم!"),
                ].map((q) => (
                  <button
                    key={q}
                    onClick={() => handleSendMessage(q)}
                    className="flex-1 text-[11px] font-semibold text-primary bg-primary/10 rounded-xl py-2.5 px-1.5 text-center"
                  >
                    {q}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  dir="auto"
                  className="flex-1 bg-muted rounded-2xl px-4 py-3 text-base outline-none text-foreground"
                  placeholder={t("typeMessage")}
                  value={msgText}
                  onChange={(e) => setMsgText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSendMessage(); }}
                />
                <button
                  onClick={() => handleSendMessage()}
                  disabled={!msgText.trim() || sending}
                  className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-md disabled:opacity-50"
                >
                  <ChevronRight className={`w-5 h-5 text-primary-foreground ${isRTL ? "rotate-180" : ""}`} />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Fenêtre de signalement ─── */}
      <AnimatePresence>
        {showReport && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[100] flex items-end"
            onClick={closeReport}
          >
            <motion.div
              initial={{ y: 200 }}
              animate={{ y: 0 }}
              exit={{ y: 200 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card w-full max-w-[430px] mx-auto rounded-t-3xl p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]"
            >
              <div className="w-10 h-1 bg-border rounded-full mx-auto mb-4" />
              {reportSent ? (
                <div className="text-center py-4">
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <CheckCircle className="w-7 h-7 text-primary" />
                  </div>
                  <p className="font-display text-[18px] font-extrabold text-foreground">
                    {tr("Merci pour votre signalement", "شكرا على إبلاغك")}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {tr("Nous allons vérifier cette annonce.", "سنتحقق من هذا الإعلان.")}
                  </p>
                  <button onClick={closeReport} className="mt-4 w-full py-3.5 rounded-2xl bg-primary text-primary-foreground font-bold text-sm">
                    {tr("Fermer", "إغلاق")}
                  </button>
                </div>
              ) : (
                <>
                  <h3 className="font-display text-[18px] font-extrabold text-foreground mb-3">
                    {tr("Pourquoi signalez-vous cette annonce ?", "لماذا تبلغ عن هذا الإعلان؟")}
                  </h3>
                  <div className="space-y-2">
                    {reportReasons.map((r) => (
                      <button
                        key={r}
                        onClick={() => handleReport(r)}
                        disabled={reporting}
                        className="w-full text-start px-4 py-3.5 rounded-2xl bg-muted text-foreground text-[15px] font-medium disabled:opacity-60 active:scale-[0.99] transition-transform"
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Lecteur vidéo ─── */}
      <AnimatePresence>
        {videoOpen && listing.video_url && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] bg-black flex flex-col"
          >
            <div className="flex justify-end px-4 pb-2 pt-[calc(1rem+env(safe-area-inset-top))]">
              <button onClick={() => setVideoOpen(false)} aria-label="Fermer" className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
            <div className="flex-1 min-h-0 flex items-center justify-center">
              <video
                src={listing.video_url}
                controls
                autoPlay
                playsInline
                className="max-w-full max-h-full"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Barre d'actions fixe en bas ─── */}
      {!isMyListing && (
        <div className="fixed bottom-0 inset-x-0 max-w-[430px] mx-auto bg-white border-t border-border px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] flex gap-2 z-[30]">
          {displayPhone && (
            <a
              href={`tel:${displayPhone}`}
              className="flex-1 flex items-center justify-center gap-1.5 py-3.5 rounded-2xl border border-border font-bold text-foreground text-[14px] active:scale-[0.98] transition-transform"
            >
              <Phone className="w-4 h-4" />{t("call")}
            </a>
          )}
          {displayPhone && (
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center py-3.5 rounded-2xl bg-[#25D366] font-bold text-[#0B3D1F] text-[14px] active:scale-[0.98] transition-transform"
            >
              WhatsApp
            </a>
          )}
          <button
            onClick={() => {
              if (!user) { navigate("/auth"); return; }
              setShowMsgBox(true);
            }}
            className="flex-1 flex items-center justify-center gap-1.5 py-3.5 rounded-2xl bg-primary font-bold text-primary-foreground text-[14px] active:scale-[0.98] transition-transform"
          >
            <MessageCircle className="w-4 h-4" />{tr("Message", "رسالة")}
          </button>
        </div>
      )}

      {lightboxOpen && images.length > 0 && (
        <ImageLightbox images={images} initialIndex={imgIndex} onClose={() => setLightboxOpen(false)} />
      )}
    </div>
  );
}
