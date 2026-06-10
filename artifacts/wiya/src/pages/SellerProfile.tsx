import { useParams, useLocation } from "wouter";
import { Star, MapPin, Shield, MessageCircle, ChevronLeft, Package } from "lucide-react";
import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { LISTINGS } from "@/lib/data";
import ListingCard from "@/components/ListingCard";

export default function SellerProfilePage() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { t, isRTL } = useI18n();

  const sellerListing = LISTINGS.find((l) => l.sellerId === params.id);
  if (!sellerListing) return null;

  const sellerListings = LISTINGS.filter((l) => l.sellerId === params.id);

  return (
    <div className="bg-[#F4F6F5] min-h-screen pb-20">
      {/* Header bg */}
      <div className="bg-[#1B6B3A] pt-12 pb-16 px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -bottom-8 -right-8 w-40 h-40 rounded-full bg-[#C8972B]" />
        </div>
        <button onClick={() => window.history.back()} className="relative w-8 h-8 flex items-center justify-center rounded-full bg-white/20 mb-4">
          <ChevronLeft className={`w-5 h-5 text-white ${isRTL ? "rotate-180" : ""}`} />
        </button>
      </div>

      {/* Profile card */}
      <div className="px-4 -mt-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-5 shadow-xl shadow-black/5"
        >
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={sellerListing.sellerAvatar}
                alt={sellerListing.sellerName}
                className="w-16 h-16 rounded-full border-3 border-green-50 shadow-sm"
              />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#C8972B] rounded-full flex items-center justify-center border-2 border-white">
                <Shield className="w-3 h-3 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <h2 className="text-base font-black text-gray-900">{sellerListing.sellerName}</h2>
              <div className="flex items-center gap-1 mt-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`w-3.5 h-3.5 ${s <= Math.round(sellerListing.sellerRating) ? "fill-[#C8972B] text-[#C8972B]" : "text-gray-200"}`}
                  />
                ))}
                <span className="text-xs text-gray-500 ml-1">({sellerListing.sellerReviews} {t("reviews")})</span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">{t("memberSince")} {sellerListing.sellerSince}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-3 mt-4 pt-4 border-t border-gray-50">
            {[
              { label: t("myListings"), value: String(sellerListings.length), icon: Package },
              { label: t("rating"), value: String(sellerListing.sellerRating), icon: Star },
              { label: t("verified"), value: "Oui", icon: Shield },
            ].map((stat) => (
              <div key={stat.label} className="flex-1 text-center">
                <p className="text-lg font-black text-gray-900">{stat.value}</p>
                <p className="text-[10px] text-gray-400 font-medium">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Contact */}
          <div className="flex gap-2 mt-4">
            <a
              href={`tel:${sellerListing.sellerPhone}`}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-100 rounded-2xl text-sm font-semibold text-gray-700"
            >
              📞 {t("call")}
            </a>
            <button
              onClick={() => navigate("/messages")}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#1B6B3A] rounded-2xl text-sm font-semibold text-white"
            >
              <MessageCircle className="w-4 h-4" />
              {t("messages")}
            </button>
          </div>
        </motion.div>
      </div>

      {/* Seller listings */}
      <div className="px-4 mt-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-gray-800">
            Annonces de {sellerListing.sellerName}
          </h3>
          <span className="text-xs text-gray-400">{sellerListings.length} annonce{sellerListings.length > 1 ? "s" : ""}</span>
        </div>
        <div className="space-y-2.5">
          {sellerListings.map((listing, i) => (
            <motion.div
              key={listing.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
            >
              <ListingCard listing={listing} variant="list" />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
