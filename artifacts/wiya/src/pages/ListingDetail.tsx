import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import {
  Heart, MapPin, ChevronLeft, ChevronRight, Phone, MessageCircle, Zap, Clock,
  Trash2, CheckCircle, Share2, Play, X, ShieldCheck,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { CATEGORIES } from "@/lib/data";
import { WILAYAS_DATA } from "@/lib/wilayas";
import { supabase } from "@/lib/supabase";
import ListingCard from "@/components/ListingCard";
import ImageLightbox from "@/components/ImageLightbox";

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
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);

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
      const { data: profile } = await supabase.from("profiles").select("username, phone, avatar_url").eq("id", data.user_id).single();
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

  const handleDelete = async () => {
    if (!confirm(tr("Supprimer cette annonce ?", "حذف هذا الإعلان؟"))) return;
    setDeleting(true);

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

    navigate("/");
  };

  const handleMarkSold = async () => {
    const confirmed = confirm(tr("Êtes-vous sûr de vouloir marquer cette annonce comme vendue ?", "هل أنت متأكد أنك تريد وضع علامة «مباع» على هذا الإعلان؟"));
    if (!confirmed) return;

    setMarking(true);
    const { error } = await supabase.from("listings").update({ is_active: false }).eq("id", params.id);
    if (!error) {
      alert(tr("Annonce marquée comme vendue !", "تم وضع علامة «مباع» على الإعلان!"));
      navigate("/");
    } else {
      alert(tr("Erreur, réessaie.", "خطأ، حاول مرة أخرى."));
      setMarking(false);
    }
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
      <div className="bg-background min-h-[100dvh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!listing) {
    return (
      <div className="bg-background min-h-[100dvh] flex flex-col items-center justify-center gap-4 px-8 text-center">
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

  const chip = "flex items-center gap-1.5 bg-card ring-1 ring-border/60 rounded-xl px-3 py-2";

  return (
    <div className="bg-background min-h-[100dvh] pb-[calc(7.5rem+env(safe-area-inset-bottom))]">
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
        <div className="absolute top-[calc(0.75rem+env(safe-area-inset-top))] inset-x-3 flex items-center justify-between pointer-events-none">
          <button onClick={handleBack} aria-label="Retour" className="pointer-events-auto w-10 h-10 rounded-full bg-black/45 backdrop-blur-sm flex items-center justify-center active:scale-95 transition-transform">
            <ChevronLeft className={`w-5 h-5 text-white ${isRTL ? "rotate-180" : ""}`} />
          </button>
          <div className="flex items-center gap-2">
            <button onClick={handleShare} aria-label="Partager" className="pointer-events-auto w-10 h-10 rounded-full bg-black/45 backdrop-blur-sm flex items-center justify-center active:scale-95 transition-transform">
              <Share2 className="w-[18px] h-[18px] text-white" />
            </button>
            <button onClick={() => toggleFavorite(listing.id)} aria-label="Favori" className="pointer-events-auto w-10 h-10 rounded-full bg-black/45 backdrop-blur-sm flex items-center justify-center active:scale-95 transition-transform">
              <Heart className={`w-[18px] h-[18px] ${fav ? "fill-red-500 text-red-500" : "text-white"}`} strokeWidth={fav ? 0 : 2} />
            </button>
          </div>
        </div>

        {copied && (
          <div className="absolute top-[calc(4rem+env(safe-area-inset-top))] end-3 bg-white text-gray-900 text-[11px] font-semibold px-3 py-1.5 rounded-full shadow-lg">
            {tr("Lien copié !", "تم نسخ الرابط!")}
          </div>
        )}

        {/* Flèches (utiles sur ordinateur) */}
        {images.length > 1 && (
          <>
            <button onClick={() => goTo(-1)} aria-label={tr("Photo précédente", "الصورة السابقة")} className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <button onClick={() => goTo(1)} aria-label={tr("Photo suivante", "الصورة التالية")} className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
              <ChevronRight className="w-5 h-5 text-white" />
            </button>
            <div className="absolute bottom-3 end-3 bg-black/55 backdrop-blur-sm rounded-full px-2.5 py-1 text-white text-[11px] font-semibold pointer-events-none">
              {imgIndex + 1}/{images.length}
            </div>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 pointer-events-none">
              {images.map((_, i) => (
                <span key={i} className={`h-1.5 rounded-full transition-all ${i === imgIndex ? "w-4 bg-white" : "w-1.5 bg-white/55"}`} />
              ))}
            </div>
          </>
        )}

        {/* Vidéo */}
        {listing.video_url && (
          <button
            onClick={() => setVideoOpen(true)}
            className="absolute bottom-12 end-3 flex items-center gap-1.5 bg-black/65 backdrop-blur-sm text-white text-xs font-bold ps-2.5 pe-3 py-1.5 rounded-full active:scale-95 transition-transform"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            {tr("Vidéo", "فيديو")}
          </button>
        )}

        {/* Badges */}
        <div className="absolute bottom-3 start-3 flex gap-1.5">
          {listing.is_boosted && (
            <span className="bg-accent text-accent-foreground text-[10px] font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1 shadow">
              <Zap className="w-3 h-3 fill-current" /> {tr("À la une", "مميز")}
            </span>
          )}
          {listing.is_urgent && (
            <span className="bg-destructive text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow">{t("urgent")}</span>
          )}
        </div>
      </div>

      <div className="px-4 pt-5 space-y-4">
        {/* Titre + prix */}
        <div>
          <p className="font-display text-[30px] font-extrabold text-primary leading-none">{priceText}</p>
          {listing.is_negotiable && (
            <span className="inline-block mt-2 text-[11px] font-semibold text-foreground bg-accent/25 px-2.5 py-1 rounded-full">
              {t("negotiable")}
            </span>
          )}
          <h1 className="text-[19px] font-bold text-foreground leading-snug mt-3">{listing.title}</h1>
        </div>

        {/* Infos */}
        <div className="flex flex-wrap gap-2">
          {category && (
            <div className={chip}>
              <span className="text-base">{category.icon}</span>
              <span className="text-xs font-medium text-foreground/80">{t(listing.category as any)}</span>
            </div>
          )}
          {place && (
            <div className={chip}>
              <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs font-medium text-foreground/80">{place}</span>
            </div>
          )}
          {!isJob && listing.condition && (
            <div className={chip}>
              <span className={`w-2 h-2 rounded-full ${listing.condition === "new" ? "bg-primary" : "bg-orange-400"}`} />
              <span className="text-xs font-medium text-foreground/80">
                {listing.condition === "new" ? t("conditionNew") : t("conditionUsed")}
              </span>
            </div>
          )}
          <div className={chip}>
            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-foreground/80">{timeAgo(listing.created_at)}</span>
          </div>
        </div>

        {/* Description */}
        {listing.description && (
          <div className="bg-card ring-1 ring-border/60 rounded-2xl p-4">
            <h3 className="text-sm font-bold text-foreground mb-2">{t("description")}</h3>
            <p dir="auto" className="text-[14px] text-foreground/75 leading-relaxed whitespace-pre-wrap break-words">
              {listing.description}
            </p>
          </div>
        )}

        {/* Vendeur */}
        {sellerProfile && !isMyListing && (
          <button
            onClick={() => navigate(`/seller/${listing.user_id}`)}
            className="w-full bg-card ring-1 ring-border/60 rounded-2xl p-4 flex items-center gap-3 text-start active:scale-[0.99] transition-transform"
          >
            <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {sellerProfile.avatar_url ? (
                <img src={sellerProfile.avatar_url} className="w-12 h-12 rounded-full object-cover" alt="" />
              ) : (
                <span className="text-xl">👤</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground truncate">{sellerProfile.username ?? tr("Vendeur", "البائع")}</p>
              <p className="text-xs text-primary font-semibold mt-0.5">{tr("Voir toutes ses annonces", "عرض كل إعلاناته")}</p>
            </div>
            <ChevronRight className={`w-4 h-4 text-muted-foreground flex-shrink-0 ${isRTL ? "rotate-180" : ""}`} />
          </button>
        )}

        {/* Conseil sécurité */}
        {!isMyListing && (
          <div className="flex items-start gap-3 bg-primary/10 rounded-2xl p-3.5">
            <ShieldCheck className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <p className="text-[12.5px] text-foreground/80 leading-snug">
              {tr(
                "Conseil sécurité : rencontrez le vendeur dans un lieu public et ne payez jamais à l'avance.",
                "نصيحة أمان: قابل البائع في مكان عام ولا تدفع مسبقا."
              )}
            </p>
          </div>
        )}

        {/* Gestion de mon annonce */}
        {isMyListing && (
          <div className="space-y-2">
            <p className="text-xs font-bold text-muted-foreground uppercase">{tr("Gérer mon annonce", "إدارة إعلاني")}</p>
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
          </div>
        )}

        {/* Annonces similaires */}
        {similar.length > 0 && (
          <div className="pt-2">
            <h3 className="text-base font-extrabold text-foreground mb-3">{t("similarListings")}</h3>
            <div className="grid grid-cols-2 gap-3">
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
        <div className="fixed bottom-0 inset-x-0 max-w-[430px] mx-auto bg-card/95 backdrop-blur-md border-t border-border px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] flex gap-2 z-[30]">
          {displayPhone && (
            <a
              href={`tel:${displayPhone}`}
              className="flex-1 flex items-center justify-center gap-1.5 py-3.5 rounded-2xl bg-muted font-semibold text-foreground text-[13px] active:scale-[0.98] transition-transform"
            >
              <Phone className="w-4 h-4" />{t("call")}
            </a>
          )}
          {displayPhone && (
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 py-3.5 rounded-2xl bg-[#25D366] font-bold text-white text-[13px] active:scale-[0.98] transition-transform"
            >
              WhatsApp
            </a>
          )}
          <button
            onClick={() => {
              if (!user) { navigate("/auth"); return; }
              setShowMsgBox(true);
            }}
            className="flex-1 flex items-center justify-center gap-1.5 py-3.5 rounded-2xl bg-primary font-semibold text-primary-foreground text-[13px] shadow-md active:scale-[0.98] transition-transform"
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
