import { useLocation } from "wouter";
import { Star, MapPin, Shield, ChevronRight, Package, Heart, Settings, HelpCircle, LogOut, Zap, Bell } from "lucide-react";
import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { LISTINGS } from "@/lib/data";
import ListingCard from "@/components/ListingCard";
import AppHeader from "@/components/AppHeader";

export default function ProfilePage() {
  const [, navigate] = useLocation();
  const { t } = useI18n();
  const { user, logout, favorites } = useStore();

  if (!user) {
    return (
      <div className="bg-[#F4F6F5] min-h-screen pb-20">
        <AppHeader title={t("profile")} />
        <div className="flex flex-col items-center justify-center h-[70vh] px-8 text-center gap-4">
          <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center text-4xl">
            👤
          </div>
          <h2 className="text-base font-bold text-gray-900">{t("notLoggedIn")}</h2>
          <p className="text-sm text-gray-500">{t("notLoggedInDesc")}</p>
          <button
            onClick={() => navigate("/auth")}
            className="w-full max-w-xs py-3.5 bg-[#1B6B3A] text-white rounded-2xl font-bold text-sm shadow-md shadow-green-200"
          >
            {t("login")}
          </button>
          <button
            onClick={() => navigate("/auth?mode=register")}
            className="w-full max-w-xs py-3.5 border-2 border-[#1B6B3A] text-[#1B6B3A] rounded-2xl font-bold text-sm"
          >
            {t("createAccount")}
          </button>
        </div>
      </div>
    );
  }

  const myListings = LISTINGS.filter((l) => l.sellerId === "u1").slice(0, 3);

  const menuItems = [
    { icon: Package, label: t("myListings"), action: () => {}, badge: myListings.length },
    { icon: Heart, label: t("favorites"), action: () => navigate("/favorites"), badge: favorites.length },
    { icon: Zap, label: t("boostTitle"), action: () => navigate("/boost/1") },
    { icon: Bell, label: "Notifications", action: () => {} },
    { icon: Settings, label: "Paramètres", action: () => {} },
    { icon: HelpCircle, label: "Aide & Support", action: () => {} },
  ];

  return (
    <div className="bg-[#F4F6F5] min-h-screen pb-20">
      {/* Profile header */}
      <div className="bg-[#1B6B3A] pt-12 pb-8 px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -bottom-8 -right-8 w-40 h-40 rounded-full bg-[#C8972B]" />
        </div>
        <div className="relative flex items-center gap-4">
          <div className="relative">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-18 h-18 rounded-full bg-white/20 border-3 border-white/40 shadow-lg w-[72px] h-[72px]"
            />
            {user.verified && (
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#C8972B] rounded-full flex items-center justify-center border-2 border-[#1B6B3A]">
                <Shield className="w-3 h-3 text-white" />
              </div>
            )}
          </div>
          <div className="flex-1">
            <h2 className="text-white text-lg font-black">{user.name}</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-[#C8972B] text-[#C8972B]" />
                <span className="text-white/90 text-xs font-semibold">{user.rating}</span>
                <span className="text-green-200 text-xs">({user.reviews} {t("reviews")})</span>
              </div>
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3 text-green-200" />
              <span className="text-green-200 text-xs">{user.wilaya}</span>
              <span className="text-green-300 text-xs">• {t("memberSince")} {user.memberSince}</span>
            </div>
          </div>
          <button className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <Settings className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Stats */}
        <div className="flex gap-3 mt-5">
          {[
            { label: t("myListings"), value: "7" },
            { label: t("favorites"), value: String(favorites.length) },
            { label: t("reviews"), value: String(user.reviews) },
          ].map((stat) => (
            <div key={stat.label} className="flex-1 bg-white/15 rounded-2xl py-2.5 px-3 text-center">
              <p className="text-white text-lg font-black">{stat.value}</p>
              <p className="text-green-200 text-[10px] font-medium">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Post new listing CTA */}
        <button
          onClick={() => navigate("/post")}
          className="w-full bg-gradient-to-r from-[#C8972B] to-[#E8B84A] rounded-2xl py-4 flex items-center justify-between px-5 shadow-md shadow-amber-200"
        >
          <div className="text-left">
            <p className="text-white font-black text-sm">Publier une nouvelle annonce</p>
            <p className="text-amber-100 text-xs mt-0.5">Vendez rapidement avec Wiya</p>
          </div>
          <div className="text-2xl">📢</div>
        </button>

        {/* My listings */}
        {myListings.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-800">{t("myListings")}</h3>
              <button className="text-xs text-[#1B6B3A] font-semibold">Voir tout</button>
            </div>
            <div className="space-y-2.5">
              {myListings.map((l) => (
                <ListingCard key={l.id} listing={l} variant="list" />
              ))}
            </div>
          </div>
        )}

        {/* Menu */}
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
          {menuItems.map((item, i) => (
            <motion.button
              key={item.label}
              whileTap={{ backgroundColor: "#f9fafb" }}
              onClick={item.action}
              className="w-full flex items-center gap-3 px-4 py-3.5 border-b border-gray-50 last:border-0"
            >
              <div className="w-8 h-8 rounded-xl bg-green-50 flex items-center justify-center">
                <item.icon className="w-4 h-4 text-[#1B6B3A]" />
              </div>
              <span className="flex-1 text-sm font-medium text-gray-800 text-left">{item.label}</span>
              {item.badge != null && item.badge > 0 && (
                <span className="w-5 h-5 bg-[#1B6B3A] rounded-full text-white text-[10px] font-bold flex items-center justify-center">
                  {item.badge}
                </span>
              )}
              <ChevronRight className="w-4 h-4 text-gray-300" />
            </motion.button>
          ))}
        </div>

        {/* Logout */}
        <button
          onClick={() => { logout(); navigate("/"); }}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-red-200 text-red-500 font-semibold text-sm"
        >
          <LogOut className="w-4 h-4" />
          {t("logout")}
        </button>
      </div>
    </div>
  );
}
