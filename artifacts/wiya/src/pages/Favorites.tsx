import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import ListingCard from "@/components/ListingCard";
import AppHeader from "@/components/AppHeader";
import { useLocation } from "wouter";

export default function FavoritesPage() {
  const { t, isRTL } = useI18n();
  const tr = (fr: string, ar: string) => (isRTL ? ar : fr);
  const { favorites } = useStore();
  const [, navigate] = useLocation();
  const [favListings, setFavListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFavorites();
  }, [favorites]);

  const fetchFavorites = async () => {
    if (favorites.length === 0) {
      setFavListings([]);
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("listings")
      .select("*")
      .in("id", favorites);
    setFavListings(data ?? []);
    setLoading(false);
  };

  const n = favListings.length;

  return (
    <div className="bg-card min-h-[100dvh] pb-[calc(7rem+env(safe-area-inset-bottom))]">
      <AppHeader title={t("favorites")} showBack />

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : favListings.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[65vh] px-8 text-center gap-4">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
            <Heart className="w-9 h-9 text-primary" />
          </div>
          <h2 className="font-display text-[20px] font-extrabold text-foreground">{t("noFavorites")}</h2>
          <p className="text-sm text-muted-foreground">{t("noFavoritesDesc")}</p>
          <button
            onClick={() => navigate("/")}
            className="px-8 py-3.5 bg-primary text-primary-foreground rounded-2xl font-bold text-sm shadow-md active:scale-95 transition-transform"
          >
            {tr("Parcourir les annonces", "تصفح الإعلانات")}
          </button>
        </div>
      ) : (
        <div className="px-4 pt-3">
          <p className="text-[13px] text-muted-foreground font-semibold px-1 mb-3">
            {tr(
              `${n} annonce${n > 1 ? "s" : ""} sauvegardée${n > 1 ? "s" : ""}`,
              `${n} إعلان محفوظ`
            )}
          </p>
          <div className="grid grid-cols-2 gap-x-3 gap-y-5">
            {favListings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} variant="grid" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
