import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { MessageCircle, ChevronLeft, Package, Store } from "lucide-react";
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
        <div className="w-8 h-8 border-4 border-[#1B6B3A] border-t-transparent rounded-full animate-spin" />
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
      {/* Header pro */}
      <div className="bg-gradient-to-br from-[#1B6B3A] to-[#0F4526] pt-12 pb-8 px-4 relative overflow-hidden">
        {/* Motif géométrique discret */}
        <div className="absolute inset-0 opacity-[0.07]" style={{
          backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
          backgroundSize: "16px 16px",
        }} />
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full border border-white/10" />
        <div className="absolute -bottom-16 -left-10 w-48 h-48 rounded-full border border-white/10" />

        <button onClick={() => window.history.back()} className="relative w-8 h-8 flex items-center justify-center rounded-full bg-white/15 mb-6">
          <ChevronLeft className={`w-5 h-5 text-white ${isRTL ? "rotate-180" : ""}`} />
        </button>

        <div className="relative flex items-center gap-2.5 mb-1.5">
          <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0">
            <Store className="w-4 h-4 text-white" />
          </div>
          <span className="text-[10px] font-bold tracking-wider text-white/60 uppercase">Boutique</span>
        </div>
        <h1 className="relative text-2xl font-black text-white leading-tight">{displayName}</h1>
        <p className="relative text-xs text-white/60 mt-1.5 flex items-center gap-1.5">
          <Package className="w-3.5 h-3.5" />
          {listings.length} annonce{listings.length > 1 ? "s" : ""}
          {memberSince && <span> · membre depuis {memberSince}</span>}
        </p>
      </div>

      {/* Contact */}
      <div className="px-4 -mt-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-3 shadow-lg shadow-black/5 flex gap-2"
        >
          {contactPhone && (
            <a
              href={`tel:${contactPhone}`}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-100 rounded-xl text-sm font-semibold text-gray-700"
            >
              📞 {t("call")}
            </a>
          )}
          <button
            onClick={() => navigate("/messages")}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#1B6B3A] rounded-xl text-sm font-semibold text-white"
          >
            <MessageCircle className="w-4 h-4" />
            {t("messages")}
          </button>
        </motion.div>
      </div>

      {/* Seller listings */}
      <div className="px-4 mt-6">
        <h3 className="text-sm font-bold text-gray-800 mb-3">Toutes les annonces</h3>
        {listings.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">Aucune annonce active</p>
        ) : (
          <div className="grid grid-cols-2 gap-2.5">
            {listings.map((listing, i) => (
              <motion.div
                key={listing.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <ListingCard listing={listing} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
