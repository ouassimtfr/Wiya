import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  Star, MapPin, Shield, ChevronRight, Package, Heart, Settings,
  HelpCircle, LogOut, Zap, Bell, Sun, Moon, Clock, Check, X, RefreshCw, Edit2, Save,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { useTheme } from "@/lib/theme";
import { supabase } from "@/lib/supabase";
import ListingCard from "@/components/ListingCard";
import AppHeader from "@/components/AppHeader";

function DarkModeRow({ isDark, onToggle }: { isDark: boolean; onToggle: () => void }) {
  const { t } = useI18n();
  return (
    <button onClick={onToggle} className="w-full flex items-center gap-3 px-4 py-3.5 bg-white rounded-2xl shadow-sm">
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${isDark ? "bg-indigo-950" : "bg-amber-50"}`}>
        {isDark ? <Moon className="w-4 h-4 text-indigo-300" /> : <Sun className="w-4 h-4 text-amber-500" />}
      </div>
      <span className="flex-1 text-sm font-medium text-gray-800 text-start">{isDark ? t("darkMode") : t("lightMode")}</span>
      <div className={`relative w-11 h-6 rounded-full transition-colors duration-300 flex-shrink-0 ${isDark ? "bg-indigo-500" : "bg-gray-200"}`}>
        <motion.div layout className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm" animate={{ left: isDark ? "calc(100% - 22px)" : "2px" }} transition={{ type: "spring", stiffness: 500, damping: 30 }} />
      </div>
    </button>
  );
}

function UserAvatar({ name, avatarUrl, size = 72 }: { name: string; avatarUrl?: string; size?: number }) {
  const initials = name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  if (avatarUrl && !avatarUrl.includes("dicebear")) {
    return <img src={avatarUrl} alt={name} style={{ width: size, height: size }} className="rounded-full bg-white/20 border-2 border-white/40 shadow-lg object-cover" />;
  }
  return (
    <div style={{ width: size, height: size }} className="rounded-full bg-white/30 border-2 border-white/40 shadow-lg flex items-center justify-center">
      <span className="text-white font-black text-2xl">{initials}</span>
    </div>
  );
}

export default function ProfilePage() {
  const [, navigate] = useLocation();
  const { t } = useI18n();
  const { user, logout, favorites, boostRequests } = useStore();
  const { isDark, toggleTheme } = useTheme();
  const [tab, setTab] = useState<"profile" | "boosts">("profile");
  const [myListings, setMyListings] = useState<any[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(user?.name ?? "");
  const [editPhone, setEditPhone] = useState(user?.phone ?? "");
  const [editWilaya, setEditWilaya] = useState(user?.wilaya ?? "");
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const STATUS_CONFIG = {
    pending: { label: t("boost") /* TODO: ajouter clé "pending" si besoin d'un libellé distinct */, icon: Clock, pill: "bg-amber-50 text-amber-600 border border-amber-200", dot: "bg-amber-400", card: "border-amber-100" },
    active: { label: t("boosted"), icon: Check, pill: "bg-green-50 text-[#1B6B3A] border border-green-200", dot: "bg-[#1B6B3A]", card: "border-green-100" },
    refused: { label: t("boost") /* TODO: ajouter clé "refused" si besoin d'un libellé distinct */, icon: X, pill: "bg-red-50 text-red-500 border border-red-200", dot: "bg-red-400", card: "border-red-100" },
  } as const;

  // --- LOGIQUE DÉCONNEXION CORRIGÉE ---
  const handleLogout = async () => {
    await supabase.auth.signOut();
    logout();
    window.location.href = "/";
  };

  useEffect(() => { if (user) fetchMyListings(); }, [user]);

  const fetchMyListings = async () => {
    if (!user) return;
    const { data } = await supabase.from("listings").select("*").eq("user_id", user.id).eq("is_active", true).order("created_at", { ascending: false });
    if (data) setMyListings(data);
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ data: { name: editName, phone: editPhone, wilaya: editWilaya } });
    setSaving(false);
    if (!error) {
      setSaveSuccess(true);
      setEditing(false);
      setTimeout(() => setSaveSuccess(false), 2000);
    }
  };

  if (!user) {
    return (
      <div className="bg-[#F4F6F5] min-h-screen pb-24">
        <AppHeader title={t("profile")} />
        <div className="flex flex-col items-center justify-center h-[70vh] px-8 text-center gap-4">
          <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center text-4xl">👤</div>
          <h2 className="text-base font-bold text-gray-900">{t("notLoggedIn")}</h2>
          <button onClick={() => navigate("/auth")} className="w-full max-w-xs py-3.5 bg-[#1B6B3A] text-white rounded-2xl font-bold text-sm shadow-md">{t("login")}</button>
        </div>
      </div>
    );
  }

  const menuItems = [
    { icon: Package, label: t("myListings"), action: () => {}, badge: myListings.length },
    { icon: Heart, label: t("favorites"), action: () => navigate("/favorites"), badge: favorites.length },
    { icon: Zap, label: t("boostTitle"), action: () => setTab("boosts"), badge: boostRequests.filter(r => r.status === "pending").length },
    { icon: Bell, label: t("notifications"), action: () => navigate("/notifications"), badge: 0 },
    { icon: Settings, label: t("settings"), action: () => { setEditName(user.name); setEditPhone(user.phone); setShowSettings(true); }, badge: 0 },
    { icon: HelpCircle, label: t("helpSupport"), action: () => setShowSupport(true), badge: 0 },
  ];

  return (
    <div className="bg-[#F4F6F5] min-h-screen pb-28">
      <div className="bg-[#1B6B3A] pt-12 pb-5 px-4 relative overflow-hidden">
        <div className="relative flex items-center gap-4">
          <div className="relative"><UserAvatar name={user.name} avatarUrl={user.avatar} size={72} /></div>
          <div className="flex-1"><h2 className="text-white text-lg font-black">{user.name}</h2></div>
        </div>
      </div>

      {/* Reste du JSX... */}
      <div className="px-4 pt-4 space-y-4">
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
          {menuItems.map((item) => (
             <button key={item.label} onClick={item.action} className="w-full flex items-center gap-3 px-4 py-3.5 border-b border-gray-50 last:border-0">
               <div className="w-8 h-8 rounded-xl bg-green-50 flex items-center justify-center"><item.icon className="w-4 h-4 text-[#1B6B3A]" /></div>
               <span className="flex-1 text-sm font-medium text-gray-800 text-start">{item.label}</span>
               <ChevronRight className="w-4 h-4 text-gray-300" />
             </button>
          ))}
        </div>
        <DarkModeRow isDark={isDark} onToggle={toggleTheme} />

        {/* BOUTON DÉCONNEXION CORRIGÉ */}
        <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-red-200 text-red-500 font-semibold text-sm">
          <LogOut className="w-4 h-4" />{t("logout")}
        </button>
      </div>

      {/* (Modal Settings / Support restants ici...) */}
    </div>
  );
}
