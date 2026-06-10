import { Heart } from "lucide-react";
import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { LISTINGS } from "@/lib/data";
import ListingCard from "@/components/ListingCard";
import AppHeader from "@/components/AppHeader";
import { useLocation } from "wouter";

export default function FavoritesPage() {
  const { t } = useI18n();
  const { favorites } = useStore();
  const [, navigate] = useLocation();

  const favListings = LISTINGS.filter((l) => favorites.includes(l.id));

  return (
    <div className="bg-[#F4F6F5] min-h-screen pb-20">
      <AppHeader title={t("favorites")} />

      {favListings.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[70vh] px-8 text-center gap-4">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center"
          >
            <Heart className="w-8 h-8 text-red-400" />
          </motion.div>
          <h2 className="text-base font-bold text-gray-900">{t("noFavorites")}</h2>
          <p className="text-sm text-gray-500">{t("noFavoritesDesc")}</p>
          <button
            onClick={() => navigate("/")}
            className="px-8 py-3 bg-[#1B6B3A] text-white rounded-2xl font-semibold text-sm"
          >
            Parcourir les annonces
          </button>
        </div>
      ) : (
        <div className="px-4 pt-4 space-y-2.5">
          <p className="text-xs text-gray-500 font-medium">{favListings.length} annonce{favListings.length > 1 ? "s" : ""} sauvegardée{favListings.length > 1 ? "s" : ""}</p>
          {favListings.map((listing, i) => (
            <motion.div
              key={listing.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
            >
              <ListingCard listing={listing} variant="list" />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
