import { useEffect, useMemo, useState } from "react";
import { useParams, useLocation } from "wouter";
import { MessageCircle, ChevronLeft, Package, Store, Calendar, Share2 } from "lucide-react";
import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import { CATEGORIES } from "@/lib/data";
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
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [shareFeedback, setShareFeedback] = useState(false);

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

  const usedCategories = useMemo(() => {
    const ids = Array.from(new Set(listings.map((l) => l.category)));
    return CATEGORIES.filter((c) => ids.includes(c.id));
  }, [listings]);

  const filteredListings = activeCategory
    ? listings.filter((l) => l.category === activeCategory)
    : listings;

  const handleShare = async () => {
    const url = window.location.href;
    const title = `Boutique ${profile?.username ?? "Wiya"}`;

    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // partage annulé par l'utilisateur, on ignore
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(url);
      setShareFeedback(true);
      setTimeout(() => setShareFeedback(false), 2000);
    } catch {
      // clipboard indisponible, on ignore silencieusement
    }
  };

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
        <div className="absolute inset-0 opacity-[0.07]" style={{
          backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
          backgroundSize: "16px 16px",
        }} />
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full border border-white/10" />
        <div className="absolute -bottom-16 -left-10 w-48 h-48 rounded-full border border-white/10" />
        <Store className="absolute -right-4 top-8 w-32 h-32 text-white/[0.06] rotate-[-12deg]" strokeWidth={1} />

        <div className="relative flex items-center justify-between mb-6">
          <button onClick={() => window.history.back()} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/15">
            <ChevronLeft className={`w-5 h-5 text-white ${isRTL ? "rotate-180" : ""}`} />
          </button>
          <button
            onClick={handleShare}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/15"
            aria-label="Partager la boutique"
          >
            <Share2 className="w-4 h-4 text-white" />
          </button>
        </div>

        <div className="relative flex items-center gap-2.5 mb-1.5">
          <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0">
            <Store className="w-4 h-4 text-white" />
          </div>
          <span className="text-[10px] font-bold tracking-wider text-white/60 uppercase">Boutique</span>
        </div>
        <h1 className="relative text-2xl font-black text-white leading-tight">{displayName}</h1>

        <div className="relative flex items-center gap-2 mt-3">
          <div className="flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1.5">
            <Package className="w-3.5 h-3.5 text-white/80" />
            <span className="text-xs font-semibold text-white">
              {listings.length} annonce{listings.length > 1 ? "s" : ""}
            </span>
          </div>
          {memberSince && (
            <div className="flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1.5">
              <Calendar className="w-3.5 h-3.5 text-white/80" />
              <span className="text-xs font-semibold text-white">Depuis {memberSince}</span>
            </div>
          )}
        </div>

        {shareFeedback && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-14 right-4 bg-white text-[#1B6B3A] text-[11px] font-semibold px-3 py-1.5 rounded-full shadow-lg"
          >
            Lien copié !
          </motion.div>
        )}
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

      {/* Category filters */}
      {usedCategories.length > 1 && (
        <div className="mt-5 px-4 flex gap-2 overflow-x-auto no-scrollbar pb-1">
          <button
            onClick={() => setActiveCategory(null)}
            className={`flex-shrink-0 px-3.5 py-2 rounded-full text-xs font-semibold transition-colors ${
              activeCategory === null ? "bg-[#1B6B3A] text-white" : "bg-white text-gray-600"
            }`}
          >
            Tout
          </button>
          {usedCategories.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveCategory(c.id)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold transition-colors ${
                activeCategory === c.id ? "bg-[#1B6B3A] text-white" : "bg-white text-gray-600"
              }`}
            >
              <span>{c.icon}</span>
              {t(c.id as any)}
            </button>
          ))}
        </div>
      )}

      {/* Seller listings */}
      <div className="px-4 mt-6">
        <h3 className="text-sm font-bold text-gray-800 mb-3">Toutes les annonces</h3>
        {filteredListings.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">Aucune annonce dans cette catégorie</p>
        ) : (
          <div className="grid grid-cols-2 gap-2.5">
            {filteredListings.map((listing, i) => (
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
