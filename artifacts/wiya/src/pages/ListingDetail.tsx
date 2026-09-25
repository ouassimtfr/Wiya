import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { MapPin, Shield, MessageCircle, ChevronLeft, Package, User } from "lucide-react";
import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import ListingCard from "@/components/ListingCard";

interface SellerProfile {
  id: string;
  username: string;
  avatar_url: string | null;
}

export default function SellerProfilePage() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { t, isRTL } = useI18n();

  const [profile, setProfile] = useState<SellerProfile | null>(null);
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);

      const [{ data: profileData, error: profileError }, { data: listingsData, error: listingsError }] =
        await Promise.all([
          supabase
            .from("profiles")
            .select("id, username, avatar_url")
            .eq("id", params.id)
            .maybeSingle(),
          supabase
            .from("listings")
            .select("*")
            .eq("user_id", params.id)
            .eq("is_active", true)
            .order("created_at", { ascending: false }),
        ]);

      if (profileError) console.error("Erreur fetch profil vendeur:", profileError);
      if (listingsError) console.error("Erreur fetch annonces vendeur:", listingsError);

      if (!cancelled) {
        setProfile(profileData ?? null);
        setListings(listingsData ?? []);
        setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [params.id]);

  if (loading) {
    return (
      <div className="bg-[#F4F6F5] min-h-screen flex items-center justify-center">
        <p className="text-sm text-gray-400">Chargement...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="bg-[#F4F6F5] min-h-screen flex items-center justify-center px-4">
        <p className="text-sm text-gray-400 text-center">Vendeur introuvable</p>
      </div>
    );
  }

  const displayName = profile.username || "Utilisateur";
  const contactPhone = listings.find((l) => l.contact_phone)?.contact_phone as string | undefined;

  const oldestListing = listings.length > 0 ? listings[listings.length - 1] : null;
  const memberSince = oldestListing?.created_at
    ? new Date(oldestListing.created_at).getFullYear().toString()
    : null;

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
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={displayName}
                  className="w-16 h-16 rounded-full border-3 border-green-50 shadow-sm object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-full border-3 border-green-50 shadow-sm bg-gray-100 flex items-center justify-center">
                  <User className="w-7 h-7 text-gray-400" />
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#C8972B] rounded-full flex items-center justify-center border-2 border-white">
                <Shield className="w-3 h-3 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <h2 className="text-base font-black text-gray-900">{displayName}</h2>
              {memberSince && (
                <p className="text-xs text-gray-400 mt-0.5">{t("memberSince")} {memberSince}</p>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-3 mt-4 pt-4 border-t border-gray-50">
            <div className="flex-1 text-center">
              <p className="text-lg font-black text-gray-900">{listings.length}</p>
              <p className="text-[10px] text-gray-400 font-medium">{t("myListings")}</p>
            </div>
          </div>

          {/* Contact */}
          <div className="flex gap-2 mt-4">
            {contactPhone && (
              <a
                href={`tel:${contactPhone}`}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-100 rounded-2xl text-sm font-semibold text-gray-700"
              >
                📞 {t("call")}
              </a>
            )}
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
          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
            <Package className="w-4 h-4 text-gray-400" />
            Annonces de {displayName}
          </h3>
          <span className="text-xs text-gray-400">
            {listings.length} annonce{listings.length > 1 ? "s" : ""}
          </span>
        </div>
        {listings.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">Aucune annonce active</p>
        ) : (
          <div className="space-y-2.5">
            {listings.map((listing, i) => (
              <motion.div
                key={listing.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <ListingCard listing={listing} variant="list" />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
