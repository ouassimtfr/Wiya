import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { Heart, MapPin, ChevronLeft, ChevronRight, Phone, MessageCircle, Zap, Clock, Trash2, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { CATEGORIES } from "@/lib/data";
import { supabase } from "@/lib/supabase";
import ListingCard from "@/components/ListingCard";
import ImageLightbox from "@/components/ImageLightbox";

export default function ListingDetail() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { t, isRTL } = useI18n();
  const { toggleFavorite, isFavorite, user, startConversation } = useStore();
  const [imgIndex, setImgIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [showMsgBox, setShowMsgBox] = useState(false);
  const [msgText, setMsgText] = useState("");
  const [listing, setListing] = useState<any>(null);
  const [similar, setSimilar] = useState<any[]>([]);
  const [sellerProfile, setSellerProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [marking, setMarking] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => { fetchListing(); }, [params.id]);

  const fetchListing = async () => {
    setLoading(true);
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

  const handleDelete = async () => {
    if (!confirm("Supprimer cette annonce ?")) return;
    setDeleting(true);

    const { error, count } = await supabase
      .from("listings")
      .delete({ count: "exact" })
      .eq("id", params.id);

    if (error) {
      console.error("Erreur suppression:", error);
      alert(`Erreur suppression: ${error.message}`);
      setDeleting(false);
      return;
    }

    if (!count) {
      console.error("Suppression bloquée silencieusement (0 ligne affectée, probablement RLS).");
      alert("Suppression refusée par le serveur (droits insuffisants). Vérifie les permissions.");
      setDeleting(false);
      return;
    }

    navigate("/");
  };

  const handleMarkSold = async () => {
    const confirmed = confirm("Êtes-vous sûr de vouloir marquer cette annonce comme vendue ?");
    if (!confirmed) return;

    setMarking(true);
    const { error } = await supabase.from("listings").update({ is_active: false }).eq("id", params.id);
    if (!error) { 
      alert("Annonce marquée comme vendue !"); 
      navigate("/"); 
    } else { 
      alert("Erreur, réessaie."); 
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
      sellerProfile?.username ?? "Vendeur",
      sellerProfile?.avatar_url ?? "",
      msg
    );

    setMsgText("");
    setShowMsgBox(false);
    setSending(false);
    navigate(`/messages/${conversationId}`);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-[#1B6B3A] border-t-transparent rounded-full animate-spin" /></div>;
  if (!listing) return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-500">Annonce introuvable</p></div>;

  const images = listing.images ?? [];
  const category = CATEGORIES.find((c) => c.id === listing.category);
  const fav = isFavorite(listing.id);
  const isMyListing = user?.id === listing.user_id;
  const displayPhone = listing.contact_phone || sellerProfile?.phone || null;

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setImgIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setImgIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="bg-white min-h-screen pb-40">
      <div className="relative bg-gray-100 aspect-[4/3]">
        {images.length > 0 ? (
          <button
            type="button"
            onClick={() => setLightboxOpen(true)}
            className="w-full h-full block"
            aria-label="Agrandir la photo"
          >
            <AnimatePresence mode="wait">
              <motion.img key={imgIndex} src={images[imgIndex]} alt={listing.title} className="w-full h-full object-cover" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} />
            </AnimatePresence>
          </button>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 text-5xl">📦</div>
        )}

        {/* Retour + favoris : épinglés en haut uniquement, pour laisser la place aux flèches photo au milieu */}
        <div className="absolute top-3 inset-x-3 flex items-center justify-between pointer-events-none z-10">
          <button onClick={() => navigate("/")} className="pointer-events-auto w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
            <ChevronLeft className={`w-5 h-5 text-white ${isRTL ? "rotate-180" : ""}`} />
          </button>
          <button onClick={() => toggleFavorite(listing.id)} className="pointer-events-auto w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
            <Heart className={`w-4 h-4 ${fav ? "fill-red-500 text-red-500" : "text-white"}`} strokeWidth={fav ? 0 : 1.8} />
          </button>
        </div>

        {/* Flèches de navigation entre photos : agrandies (44px, zone tactile confortable) + z-index explicite pour être sûr qu'elles passent devant la photo */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={prevImage}
              aria-label="Photo précédente"
              className="absolute z-20 left-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/55 backdrop-blur-sm flex items-center justify-center shadow-lg active:scale-90 transition-transform"
            >
              <ChevronLeft className="w-6 h-6 text-white" strokeWidth={2.5} />
            </button>
            <button
              type="button"
              onClick={nextImage}
              aria-label="Photo suivante"
              className="absolute z-20 right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/55 backdrop-blur-sm flex items-center justify-center shadow-lg active:scale-90 transition-transform"
            >
              <ChevronRight className="w-6 h-6 text-white" strokeWidth={2.5} />
            </button>
            {/* Compteur "1/3" : agrandi et plus contrasté */}
            <div className="absolute z-20 bottom-3 end-3 bg-black/60 backdrop-blur-sm rounded-full px-3 py-1 text-white text-xs font-bold pointer-events-none">
              {imgIndex + 1}/{images.length}
            </div>
          </>
        )}

        {images.length > 1 && (
          <div className="absolute z-20 bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 pointer-events-none">
            {images.map((_: any, i: number) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); e.preventDefault(); setImgIndex(i); }}
                className={`pointer-events-auto h-1.5 rounded-full transition-all ${i === imgIndex ? "w-4 bg-white" : "w-1.5 bg-white/50"}`}
              />
            ))}
          </div>
        )}
        <div className="absolute top-3 start-3 flex gap-1.5 z-10">
          {listing.is_boosted && <span className="bg-[#C8972B] text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1"><Zap className="w-3 h-3" /> {t("boosted")}</span>}
          {listing.is_urgent && <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full">{t("urgent")}</span>}
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h1 className="text-lg font-bold text-gray-900 flex-1 leading-snug">{listing.title}</h1>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-2xl font-black text-[#1B6B3A]">{listing.price?.toLocaleString()} {t("da")}</span>
            {listing.is_negotiable && <span className="text-xs text-[#C8972B] font-semibold bg-amber-50 px-2 py-1 rounded-full">{t("negotiable")}</span>}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {category && <div className="flex items-center gap-1.5 bg-gray-50 rounded-xl px-3 py-2"><span className="text-base">{category.icon}</span><span className="text-xs font-medium text-gray-600">{t(listing.category as any)}</span></div>}
          {listing.wilaya && <div className="flex items-center gap-1.5 bg-gray-50 rounded-xl px-3 py-2"><MapPin className="w-3.5 h-3.5 text-gray-400" /><span className="text-xs font-medium text-gray-600">{listing.wilaya}</span></div>}
          {listing.condition && <div className="flex items-center gap-1.5 bg-gray-50 rounded-xl px-3 py-2"><div className={`w-2 h-2 rounded-full ${listing.condition === "new" ? "bg-[#1B6B3A]" : "bg-orange-400"}`} /><span className="text-xs font-medium text-gray-600">{listing.condition === "new" ? t("conditionNew") : t("conditionUsed")}</span></div>}
          <div className="flex items-center gap-1.5 bg-gray-50 rounded-xl px-3 py-2"><Clock className="w-3.5 h-3.5 text-gray-400" /><span className="text-xs font-medium text-gray-600">{new Date(listing.created_at).toLocaleDateString("fr-FR")}</span></div>
        </div>

        {listing.description && (
          <div className="bg-gray-50 rounded-2xl p-4">
            <h3 className="text-sm font-bold text-gray-800 mb-2">{t("description")}</h3>
            <p className="text-sm text-gray-600 leading-relaxed">{listing.description}</p>
          </div>
        )}

        {sellerProfile && !isMyListing && (
          <div className="bg-gray-50 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#1B6B3A]/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {sellerProfile.avatar_url ? <img src={sellerProfile.avatar_url} className="w-12 h-12 rounded-full object-cover" alt="" /> : <span className="text-xl">👤</span>}
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-gray-900">{sellerProfile.username ?? "Vendeur"}</p>
              {displayPhone && <p className="text-xs text-gray-500 mt-0.5">{displayPhone}</p>}
            </div>
          </div>
        )}

        {isMyListing && (
          <div className="space-y-2">
            <p className="text-xs font-bold text-gray-400 uppercase">Gérer mon annonce</p>
            <div className="flex gap-2">
              <button onClick={() => navigate(`/boost/${listing.id}`)} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#C8972B] text-white font-semibold text-sm">
                <Zap className="w-4 h-4 fill-white" />Booster
              </button>
              <button onClick={handleMarkSold} disabled={marking} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-gray-100 text-gray-700 font-semibold text-sm">
                <CheckCircle className="w-4 h-4" />Vendu
              </button>
              <button onClick={handleDelete} disabled={deleting} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-red-50 text-red-500 font-semibold text-sm">
                <Trash2 className="w-4 h-4" />Supprimer
              </button>
            </div>
          </div>
        )}

        {similar.length > 0 && (
          <div>
            <h3 className="text-sm font-bold text-gray-800 mb-3">{t("similarListings")}</h3>
            <div className="grid grid-cols-2 gap-2.5">
              {similar.map((l) => <ListingCard key={l.id} listing={l} />)}
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showMsgBox && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-[100] flex items-end" onClick={() => setShowMsgBox(false)}>
            <motion.div initial={{ y: 200 }} animate={{ y: 0 }} exit={{ y: 200 }} onClick={(e) => e.stopPropagation()} className="bg-white w-full rounded-t-3xl p-5 space-y-4">
              <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto" />
              <h3 className="text-sm font-bold text-gray-900">{t("sendMessage")}</h3>
              <div className="flex gap-2">
                {["Toujours dispo ?", "Quel est votre meilleur prix ?", "Je suis intéressé !"].map((q) => (
                  <button key={q} onClick={() => handleSendMessage(q)} className="flex-1 text-[11px] font-medium text-[#1B6B3A] bg-green-50 border border-green-100 rounded-xl py-2 px-1.5 text-center">
                    {q}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm outline-none"
                  placeholder={t("typeMessage")}
                  value={msgText}
                  onChange={(e) => setMsgText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSendMessage(); }}
                />
                <button
                  onClick={() => handleSendMessage()}
                  disabled={!msgText.trim() || sending}
                  className="w-11 h-11 rounded-full bg-[#1B6B3A] flex items-center justify-center shadow-md disabled:opacity-50"
                >
                  <ChevronRight className="w-5 h-5 text-white" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {!isMyListing && (
        <div className="fixed bottom-[60px] left-0 right-0 bg-white border-t border-gray-100 px-4 py-3 flex gap-3 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] z-[30]">
          <a href={displayPhone ? `tel:${displayPhone}` : "#"} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-gray-100 font-semibold text-gray-700 text-sm">
            <Phone className="w-4 h-4" />{t("call")}
          </a>
          <button onClick={() => { if (!user) { navigate("/auth"); return; } setShowMsgBox(true); }} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#1B6B3A] font-semibold text-white text-sm shadow-md">
            <MessageCircle className="w-4 h-4" />{t("sendMessage")}
          </button>
        </div>
      )}

      {lightboxOpen && images.length > 0 && (
        <ImageLightbox images={images} initialIndex={imgIndex} onClose={() => setLightboxOpen(false)} />
      )}
    </div>
  );
}
