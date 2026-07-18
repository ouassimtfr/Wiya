import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  ChevronRight, Package, Heart, Settings,
  LogOut, Bell, Sun, Moon, X, ArrowLeft, Camera, Trash2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { useTheme } from "@/lib/theme";
import { supabase } from "@/lib/supabase";
import { WILAYAS } from "@/lib/data";
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

function UserAvatar({ name, avatarUrl, size = 72, editable = false, uploading = false, onPick, onRemove }: { name: string; avatarUrl?: string; size?: number; editable?: boolean; uploading?: boolean; onPick?: (file: File) => void; onRemove?: () => void }) {
  const initials = name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  const inputId = "avatar-upload-input";
  const hasCustomAvatar = !!avatarUrl && !avatarUrl.includes("dicebear");

  const content = hasCustomAvatar ? (
    <img src={avatarUrl} alt={name} style={{ width: size, height: size }} className="rounded-full bg-white/20 border-2 border-white/40 shadow-lg object-cover" />
  ) : (
    <div style={{ width: size, height: size }} className="rounded-full bg-white/30 border-2 border-white/40 shadow-lg flex items-center justify-center">
      <span className="text-white font-black text-2xl">{initials}</span>
    </div>
  );

  if (!editable) return content;

  return (
    <div className="relative">
      {content}
      {uploading && (
        <div style={{ width: size, height: size }} className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      {hasCustomAvatar && onRemove && !uploading && (
        <button onClick={onRemove} className="absolute top-0 right-0 w-6 h-6 rounded-full bg-red-500 flex items-center justify-center shadow-md">
          <Trash2 className="w-3 h-3 text-white" />
        </button>
      )}
      <label htmlFor={inputId} className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-white flex items-center justify-center shadow-md cursor-pointer">
        <Camera className="w-3.5 h-3.5 text-[#1B6B3A]" />
      </label>
      <input
        id={inputId}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && onPick) onPick(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}

export default function ProfilePage() {
  const [, navigate] = useLocation();
  const { t } = useI18n();
  const { user, logout, favorites, updateAvatar, removeAvatar } = useStore();
  const { isDark, toggleTheme } = useTheme();
  const [tab, setTab] = useState<"profile" | "listings">("profile");
  const [myListings, setMyListings] = useState<any[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [editName, setEditName] = useState(user?.name ?? "");
  const [editPhone, setEditPhone] = useState(user?.phone ?? "");
  const [editWilaya, setEditWilaya] = useState(user?.wilaya ?? "");
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState("");

  // FIX iOS Safari : empêche le body de scroller derrière la modale quand on
  // tape dans un champ (Nom / Téléphone), ce qui poussait tout hors écran.
  useEffect(() => {
    if (showSettings) {
      const scrollY = window.scrollY;
      const originalOverflow = document.body.style.overflow;
      const originalPosition = document.body.style.position;
      const originalTop = document.body.style.top;
      const originalWidth = document.body.style.width;

      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";

      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.position = originalPosition;
        document.body.style.top = originalTop;
        document.body.style.width = originalWidth;
        window.scrollTo(0, scrollY);
      };
    }
  }, [showSettings]);

  const handleAvatarPick = async (file: File) => {
    setUploadingAvatar(true);
    setAvatarError("");
    const { error } = await updateAvatar(file);
    if (error) setAvatarError(error);
    setUploadingAvatar(false);
  };

  const handleAvatarRemove = async () => {
    setUploadingAvatar(true);
    setAvatarError("");
    const { error } = await removeAvatar();
    if (error) setAvatarError(error);
    setUploadingAvatar(false);
  };

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
    if (!error) setShowSettings(false);
  };

  if (!user) {
    return (
      <div className="bg-[#F4F6F5] min-h-[100dvh] pb-[calc(6rem+env(safe-area-inset-bottom))]">
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
    { icon: Package, label: t("myListings"), action: () => setTab("listings"), badge: myListings.length },
    { icon: Heart, label: t("favorites"), action: () => navigate("/favorites"), badge: favorites.length },
    { icon: Bell, label: t("notifications"), action: () => navigate("/notifications"), badge: 0 },
    { icon: Settings, label: t("settings"), action: () => { setEditName(user.name); setEditPhone(user.phone); setEditWilaya(user.wilaya ?? ""); setShowSettings(true); }, badge: 0 },
  ];

  return (
    <div className="bg-[#F4F6F5] min-h-[100dvh] pb-[calc(7rem+env(safe-area-inset-bottom))]">
      <div className="bg-[#1B6B3A] pt-12 pb-5 px-4 relative overflow-hidden">
        <div className="relative flex items-center gap-4">
          {tab !== "profile" && (
            <button onClick={() => setTab("profile")} className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <ArrowLeft className="w-4.5 h-4.5 text-white" />
            </button>
          )}
          <div className="relative"><UserAvatar name={user.name} avatarUrl={user.avatar} size={tab === "profile" ? 72 : 44} editable={tab === "profile"} uploading={uploadingAvatar} onPick={handleAvatarPick} onRemove={handleAvatarRemove} /></div>
          <div className="flex-1">
            {tab === "profile" && <h2 className="text-white text-lg font-black">{user.name}</h2>}
            {tab === "listings" && <h2 className="text-white text-lg font-black">{t("myListings")}</h2>}
            {avatarError && <p className="text-red-200 text-xs mt-1">{avatarError}</p>}
          </div>
        </div>
      </div>

      {tab === "profile" && (
        <div className="px-4 pt-4 space-y-4">
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
            {menuItems.map((item) => (
              <button key={item.label} onClick={item.action} className="w-full flex items-center gap-3 px-4 py-3.5 border-b border-gray-50 last:border-0">
                <div className="w-8 h-8 rounded-xl bg-green-50 flex items-center justify-center"><item.icon className="w-4 h-4 text-[#1B6B3A]" /></div>
                <span className="flex-1 text-sm font-medium text-gray-800 text-start">{item.label}</span>
                {item.badge > 0 && (
                  <span className="text-[10px] font-bold text-white bg-[#1B6B3A] rounded-full w-5 h-5 flex items-center justify-center">{item.badge}</span>
                )}
                <ChevronRight className="w-4 h-4 text-gray-300" />
              </button>
            ))}
          </div>
          <DarkModeRow isDark={isDark} onToggle={toggleTheme} />

          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-red-200 text-red-500 font-semibold text-sm">
            <LogOut className="w-4 h-4" />{t("logout")}
          </button>
        </div>
      )}

      {tab === "listings" && (
        <div className="px-4 pt-4">
          {myListings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="text-4xl">📦</div>
              <p className="text-sm font-bold text-gray-600">{t("noListingsYet")}</p>
              <p className="text-xs text-gray-400">{t("postFirst")}</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {myListings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} variant="list" />
              ))}
            </div>
          )}
        </div>
      )}

      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-[200] flex items-end"
            onClick={() => setShowSettings(false)}
          >
            <motion.div
              initial={{ y: 300 }}
              animate={{ y: 0 }}
              exit={{ y: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full max-w-[430px] mx-auto rounded-t-3xl max-h-[88dvh] flex flex-col"
            >
              <div className="px-5 pt-5 flex-shrink-0">
                <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-1" />
                <div className="flex items-center justify-between py-3">
                  <h3 className="text-base font-black text-gray-900">{t("settings")}</h3>
                  <button onClick={() => setShowSettings(false)}><X className="w-5 h-5 text-gray-400" /></button>
                </div>
              </div>

              <div className="px-5 pb-5 space-y-4 overflow-y-auto flex-1">
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1.5 block">{t("name")}</label>
                  <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-[#1B6B3A]" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1.5 block">{t("phone")}</label>
                  <input type="tel" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-[#1B6B3A]" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1.5 block">{t("wilaya")}</label>
                  <select value={editWilaya} onChange={(e) => setEditWilaya(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-[#1B6B3A]">
                    <option value="">{t("selectWilaya")}</option>
                    {WILAYAS.map((w) => (
                      <option key={w} value={w}>{w}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-2 flex-shrink-0 border-t border-gray-100">
                <button onClick={handleSaveProfile} disabled={saving} className="w-full py-3.5 bg-[#1B6B3A] text-white rounded-2xl font-bold text-sm shadow-md disabled:opacity-50">
                  {saving ? "..." : t("apply")}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
