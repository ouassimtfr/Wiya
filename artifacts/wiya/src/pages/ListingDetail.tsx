import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { Heart, Share2, MapPin, Eye, ChevronLeft, ChevronRight, Star, Phone, MessageCircle, Zap, Shield, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { LISTINGS, CATEGORIES } from "@/lib/data";
import ListingCard from "@/components/ListingCard";

export default function ListingDetail() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { t, lang, isRTL } = useI18n();
  const { toggleFavorite, isFavorite, user, startConversation } = useStore();
  const [imgIndex, setImgIndex] = useState(0);
  const [showMsgBox, setShowMsgBox] = useState(false);
  const [msgText, setMsgText] = useState("");

  const listing = LISTINGS.find((l) => l.id === params.id);
  if (!listing) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500">Annonce introuvable</p>
    </div>
  );

  const title = lang === "ar" ? listing.titleAr : listing.title;
  const description = lang === "ar" ? listing.descriptionAr : listing.description;
  const category = CATEGORIES.find((c) => c.id === listing.category);
  const fav = isFavorite(listing.id);
  const similar = LISTINGS.filter((l) => l.category === listing.category && l.id !== listing.id).slice(0, 4);

  const handleSendMessage = () => {
    if (!user) { navigate("/auth"); return; }
    if (!msgText.trim()) return;
    const convId = startConversation(
      listing.id, listing.title, listing.images[0],
      listing.sellerId, listing.sellerName, listing.sellerAvatar,
      msgText.trim()
    );
    setMsgText("");
    setShowMsgBox(false);
    navigate(`/messages/${convId}`);
  };

  return (
    <div className="bg-white min-h-screen pb-28">
      {/* Image gallery */}
      <div className="relative bg-gray-100 aspect-[4/3]">
        <AnimatePresence mode="wait">
          <motion.img
            key={imgIndex}
            src={listing.images[imgIndex]}
            alt={title}
            className="w-full h-full object-cover"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        </AnimatePresence>

        {/* Nav overlay */}
        <div className="absolute inset-0 flex items-center justify-between px-3 pointer-events-none">
          <button
            onClick={() => navigate("/")}
            className="pointer-events-auto w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center"
          >
            <ChevronLeft className={`w-5 h-5 text-white ${isRTL ? "rotate-180" : ""}`} />
          </button>
          <button
            onClick={() => toggleFavorite(listing.id)}
            className="pointer-events-auto w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center"
          >
            <Heart className={`w-4.5 h-4.5 ${fav ? "fill-red-500 text-red-500" : "text-white"}`} strokeWidth={fav ? 0 : 1.8} />
          </button>
        </div>

        {/* Image dots */}
        {listing.images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {listing.images.map((_, i) => (
              <button
                key={i}
                onClick={() => setImgIndex(i)}
                className={`h-1.5 rounded-full transition-all ${i === imgIndex ? "w-4 bg-white" : "w-1.5 bg-white/50"}`}
              />
            ))}
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-3 start-3 flex gap-1.5">
          {listing.isBoosted && (
            <span className="bg-[#C8972B] text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
              <Zap className="w-3 h-3" /> {t("boosted")}
            </span>
          )}
          {listing.isUrgent && (
            <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full">
              {t("urgent")}
            </span>
          )}
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Price & title */}
        <div>
          <div className="flex items-start justify-between gap-2">
            <h1 className="text-lg font-bold text-gray-900 flex-1 leading-snug">{title}</h1>
            <button className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100">
              <Share2 className="w-4 h-4 text-gray-600" />
            </button>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-2xl font-black text-[#1B6B3A]">
              {listing.price.toLocaleString()} {t("da")}
            </span>
            {listing.negotiable && (
              <span className="text-xs text-[#C8972B] font-semibold bg-amber-50 px-2 py-1 rounded-full">
                {t("negotiable")}
              </span>
            )}
          </div>
        </div>

        {/* Meta chips */}
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-1.5 bg-gray-50 rounded-xl px-3 py-2">
            <span className="text-base">{category?.icon}</span>
            <span className="text-xs font-medium text-gray-600">{t(listing.category as any)}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-gray-50 rounded-xl px-3 py-2">
            <MapPin className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-xs font-medium text-gray-600">{listing.city}, {listing.wilaya}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-gray-50 rounded-xl px-3 py-2">
            <div className={`w-2 h-2 rounded-full ${listing.condition === "new" ? "bg-[#1B6B3A]" : "bg-orange-400"}`} />
            <span className="text-xs font-medium text-gray-600">
              {listing.condition === "new" ? t("conditionNew") : t("conditionUsed")}
            </span>
          </div>
          <div className="flex items-center gap-1.5 bg-gray-50 rounded-xl px-3 py-2">
            <Eye className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-xs font-medium text-gray-600">{listing.views} {t("views")}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-gray-50 rounded-xl px-3 py-2">
            <Clock className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-xs font-medium text-gray-600">{listing.postedAt}</span>
          </div>
        </div>

        {/* Description */}
        <div className="bg-gray-50 rounded-2xl p-4">
          <h3 className="text-sm font-bold text-gray-800 mb-2">{t("description")}</h3>
          <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
        </div>

        {/* Seller card */}
        <div
          onClick={() => navigate(`/seller/${listing.sellerId}`)}
          className="bg-gray-50 rounded-2xl p-4 flex items-center gap-3 cursor-pointer active:bg-gray-100 transition-colors"
        >
          <img
            src={listing.sellerAvatar}
            alt={listing.sellerName}
            className="w-12 h-12 rounded-full bg-white border-2 border-white shadow-sm"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-gray-900">{listing.sellerName}</span>
              <Shield className="w-3.5 h-3.5 text-[#1B6B3A]" />
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <Star className="w-3.5 h-3.5 fill-[#C8972B] text-[#C8972B]" />
              <span className="text-xs font-semibold text-gray-700">{listing.sellerRating}</span>
              <span className="text-xs text-gray-400">({listing.sellerReviews} {t("reviews")})</span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">{t("memberSince")} {listing.sellerSince}</p>
          </div>
          <ChevronRight className={`w-4 h-4 text-gray-300 ${isRTL ? "rotate-180" : ""}`} />
        </div>

        {/* Similar */}
        {similar.length > 0 && (
          <div>
            <h3 className="text-sm font-bold text-gray-800 mb-3">{t("similarListings")}</h3>
            <div className="grid grid-cols-2 gap-2.5">
              {similar.map((l) => (
                <ListingCard key={l.id} listing={l} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Message compose */}
      <AnimatePresence>
        {showMsgBox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-end"
            onClick={() => setShowMsgBox(false)}
          >
            <motion.div
              initial={{ y: 200 }}
              animate={{ y: 0 }}
              exit={{ y: 200 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full rounded-t-3xl p-5 space-y-4"
            >
              <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto" />
              <h3 className="text-sm font-bold text-gray-900">{t("sendMessage")} à {listing.sellerName}</h3>
              <div className="flex gap-2">
                {["Toujours dispo ?", "Quel est votre meilleur prix ?", "Je suis intéressé !"].map((q) => (
                  <button
                    key={q}
                    onClick={() => setMsgText(q)}
                    className="flex-1 text-[11px] font-medium text-[#1B6B3A] bg-green-50 border border-green-100 rounded-xl py-2 px-1.5 text-center"
                  >
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
                />
                <button
                  onClick={handleSendMessage}
                  className="w-11 h-11 rounded-full bg-[#1B6B3A] flex items-center justify-center shadow-md"
                >
                  <ChevronRight className="w-5 h-5 text-white" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom action bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3 flex gap-3 shadow-lg z-40">
        <a
          href={`tel:${listing.sellerPhone}`}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-gray-100 font-semibold text-gray-700 text-sm"
        >
          <Phone className="w-4 h-4" />
          {t("call")}
        </a>
        <button
          onClick={() => { if (!user) { navigate("/auth"); return; } setShowMsgBox(true); }}
          className="flex-2 flex items-center justify-center gap-2 py-3 px-8 rounded-2xl bg-[#1B6B3A] font-semibold text-white text-sm shadow-md shadow-green-200"
        >
          <MessageCircle className="w-4 h-4" />
          {t("sendMessage")}
        </button>
      </div>
    </div>
  );
}
