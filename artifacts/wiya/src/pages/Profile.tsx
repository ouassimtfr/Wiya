import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  ChevronRight, Package, Heart, Settings, Languages,
  LogOut, Bell, Sun, Moon, X, ArrowLeft, Camera, Trash2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { useTheme } from "@/lib/theme";
import { supabase } from "@/lib/supabase";
import { WILAYAS_DATA } from "@/lib/wilayas";
import { compressImage } from "@/lib/imageCompress";
import ListingCard from "@/components/ListingCard";
import AppHeader from "@/components/AppHeader";

const WILAYA_OPTIONS = WILAYAS_DATA.slice().sort((a, b) => a.code - b.code);

function UserAvatar({
  name, avatarUrl, size = 92, uploading = false, onPick, onRemove,
}: {
  name: string; avatarUrl?: string; size?: number; uploading?: boolean;
  onPick?: (file: File) => void; onRemove?: () => void;
}) {
  const initials = name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  const inputId = "avatar-upload-input";
  const hasCustomAvatar = !!avatarUrl && !avatarUrl.includes("dicebear");

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {hasCustomAvatar ? (
        <img src={avatarUrl} alt={name} style={{ width: size, height: size }} className="rounded-full object-cover ring-4 ring-card shadow-md" decoding="async" />
      ) : (
        <div style={{ width: size, height: size }} className="rounded-full bg-primary/15 ring-4 ring-card shadow-md flex items-center justify-center">
          <span className="text-primary font-black text-3xl">{initials}</span>
        </div>
      )}
      {uploading && (
        <div style={{ width: size, height: size }} className="absolute inset-0 rounded-full bg-black/45 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      {hasCustomAvatar && onRemove && !uploading && (
        <button onClick={onRemove} aria-label="Supprimer la photo" className="absolute top-0 end-0 w-7 h-7 rounded-full bg-destructive flex items-center justify-center shadow-md">
          <Trash2 className="w-3.5 h-3.5 text-white" />
        </button>
      )}
      <label htmlFor={inputId} className="absolute bottom-0 end-0 w-9 h-9 rounded-full bg-primary flex items-center justify-center shadow-md cursor-pointer ring-2 ring-card">
        <Camera className="w-4 h-4 text-primary-foreground" />
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
  const { t, isRTL, lang, setLang } = useI18n();
  const tr = (fr: string, ar: string) => (isRTL ? ar : fr);
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

  // La photo de profil est réduite (512 px max) avant l'envoi : upload beaucoup plus rapide.
  const handleAvatarPick = async (file: File) => {
    setUploadingAvatar(true);
    setAvatarError("");
    const small = await compressImage(file, 512, 0.85);
    const { error } = await updateAvatar(small);
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
    // Le nom va dans `profiles` (pas user_metadata, sinon Google l'écrase
    // à la prochaine connexion). Téléphone/wilaya restent dans
    // user_metadata, Google n'y touche pas.
    const [{ error: profileError }, { error: authError }] = await Promise.all([
      supabase.from("profiles").update({ username: editName }).eq("id", user.id),
      supabase.auth.updateUser({ data: { phone: editPhone, wilaya: editWilaya } }),
    ]);
    setSaving(false);
    if (!profileError && !authError) setShowSettings(false);
  };

  if (!user) {
    return (
      <div className="bg-card min-h-[100dvh] pb-[calc(6rem+env(safe-area-inset-bottom))]">
        <AppHeader title={t("profile")} />
        <div className="flex flex-col items-center justify-center h-[70vh] px-8 text-center gap-4">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-4xl">👤</div>
          <h2 className="font-display text-[20px] font-extrabold text-foreground">{t("notLoggedIn")}</h2>
          <p className="text-sm text-muted-foreground">{t("notLoggedInDesc")}</p>
          <button onClick={() => navigate("/auth")} className="w-full max-w-xs py-3.5 bg-primary text-primary-foreground rounded-2xl font-bold text-sm shadow-md active:scale-95 transition-transform">{t("login")}</button>
        </div>
      </div>
    );
  }

  const row = "w-full flex items-center gap-3 px-4 py-3.5 text-start active:bg-muted transition-colors";
  const iconBox = "w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0";
  const fieldClass =
    "w-full bg-muted rounded-2xl px-4 py-3 text-base text-foreground outline-none focus:ring-2 focus:ring-primary/40";

  const menuItems = [
    { icon: Package, label: t("myListings"), action: () => setTab("listings"), badge: myListings.length },
    { icon: Heart, label: t("favorites"), action: () => navigate("/favorites"), badge: favorites.length },
    { icon: Bell, label: t("notifications"), action: () => navigate("/notifications"), badge: 0 },
    { icon: Settings, label: t("settings"), action: () => { setEditName(user.name); setEditPhone(user.phone); setEditWilaya(user.wilaya ?? ""); setShowSettings(true); }, badge: 0 },
  ];

  return (
    <div className="bg-card min-h-[100dvh] pb-[calc(7rem+env(safe-area-inset-bottom))]">
      {tab === "profile" ? (
        <>
          {/* ─── Carte d'identité ─── */}
          <div className="flex flex-col items-center text-center px-5 pt-[calc(2rem+env(safe-area-inset-top))] pb-6">
            <UserAvatar
              name={user.name}
              avatarUrl={user.avatar}
              uploading={uploadingAvatar}
              onPick={handleAvatarPick}
              onRemove={handleAvatarRemove}
            />
            <h1 className="font-display text-[24px] font-extrabold text-foreground mt-4 leading-tight">{user.name}</h1>
            {user.email && <p className="text-[13px] text-muted-foreground mt-0.5" dir="ltr">{user.email}</p>}
            {avatarError && <p className="text-destructive text-xs mt-2">{avatarError}</p>}

            <div className="flex gap-3 mt-5 w-full max-w-xs">
              <button onClick={() => setTab("listings")} className="flex-1 bg-muted rounded-2xl py-3 active:scale-95 transition-transform">
                <p className="font-display text-[22px] font-extrabold text-foreground leading-none">{myListings.length}</p>
                <p className="text-[12px] text-muted-foreground mt-1">{t("myListings")}</p>
              </button>
              <button onClick={() => navigate("/favorites")} className="flex-1 bg-muted rounded-2xl py-3 active:scale-95 transition-transform">
                <p className="font-display text-[22px] font-extrabold text-foreground leading-none">{favorites.length}</p>
                <p className="text-[12px] text-muted-foreground mt-1">{t("favorites")}</p>
              </button>
            </div>
          </div>

          <div className="px-4 space-y-3">
            <div className="rounded-2xl ring-1 ring-border overflow-hidden divide-y divide-border">
              {menuItems.map((item) => (
                <button key={item.label} onClick={item.action} className={row}>
                  <div className={iconBox}><item.icon className="w-[18px] h-[18px] text-primary" /></div>
                  <span className="flex-1 text-[15px] font-medium text-foreground">{item.label}</span>
                  {item.badge > 0 && (
                    <span className="text-[11px] font-bold text-primary-foreground bg-primary rounded-full min-w-[22px] h-[22px] px-1.5 flex items-center justify-center">{item.badge}</span>
                  )}
                  <ChevronRight className={`w-4 h-4 text-muted-foreground ${isRTL ? "rotate-180" : ""}`} />
                </button>
              ))}
            </div>

            <div className="rounded-2xl ring-1 ring-border overflow-hidden divide-y divide-border">
              <button onClick={() => setLang(lang === "fr" ? "ar" : "fr")} className={row}>
                <div className={iconBox}><Languages className="w-[18px] h-[18px] text-primary" /></div>
                <span className="flex-1 text-[15px] font-medium text-foreground">{tr("Langue", "اللغة")}</span>
                <span className="text-[14px] font-bold text-primary">{lang === "fr" ? "العربية" : "Français"}</span>
              </button>
              <button onClick={toggleTheme} className={row}>
                <div className={iconBox}>
                  {isDark ? <Moon className="w-[18px] h-[18px] text-primary" /> : <Sun className="w-[18px] h-[18px] text-primary" />}
                </div>
                <span className="flex-1 text-[15px] font-medium text-foreground">
                  {isDark ? tr("Mode sombre", "الوضع الليلي") : t("lightMode")}
                </span>
                <div className={`relative w-11 h-6 rounded-full transition-colors duration-300 flex-shrink-0 ${isDark ? "bg-primary" : "bg-border"}`}>
                  <motion.div layout className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm" animate={{ left: isDark ? "calc(100% - 22px)" : "2px" }} transition={{ type: "spring", stiffness: 500, damping: 30 }} />
                </div>
              </button>
            </div>

            <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl ring-1 ring-destructive/40 text-destructive font-bold text-sm active:scale-[0.98] transition-transform">
              <LogOut className="w-4 h-4" />{t("logout")}
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center gap-3 px-4 pb-3 pt-[calc(1rem+env(safe-area-inset-top))]">
            <button onClick={() => setTab("profile")} aria-label="Retour" className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0 active:scale-95 transition-transform">
              <ArrowLeft className={`w-5 h-5 text-foreground ${isRTL ? "rotate-180" : ""}`} />
            </button>
            <h1 className="font-display text-[22px] font-extrabold text-foreground">{t("myListings")}</h1>
          </div>

          <div className="px-4 pt-1">
            {myListings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-4xl">📦</div>
                <p className="font-display text-[18px] font-extrabold text-foreground">{t("noListingsYet")}</p>
                <p className="text-sm text-muted-foreground">{t("postFirst")}</p>
                <button onClick={() => navigate("/post")} className="mt-2 px-8 py-3.5 bg-primary text-primary-foreground rounded-2xl font-bold text-sm shadow-md active:scale-95 transition-transform">
                  {tr("Vendre", "بيع")}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-x-3 gap-y-5">
                {myListings.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} variant="grid" />
                ))}
              </div>
            )}
          </div>
        </>
      )}

      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[200] flex items-end"
            onClick={() => setShowSettings(false)}
          >
            <motion.div
              initial={{ y: 300 }}
              animate={{ y: 0 }}
              exit={{ y: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card w-full max-w-[430px] mx-auto rounded-t-3xl max-h-[88dvh] flex flex-col"
            >
              <div className="px-5 pt-5 flex-shrink-0">
                <div className="w-10 h-1 bg-border rounded-full mx-auto mb-1" />
                <div className="flex items-center justify-between py-3">
                  <h3 className="font-display text-[20px] font-extrabold text-foreground">{t("settings")}</h3>
                  <button onClick={() => setShowSettings(false)} aria-label="Fermer" className="w-9 h-9 rounded-full bg-muted flex items-center justify-center"><X className="w-5 h-5 text-foreground" /></button>
                </div>
              </div>

              <div className="px-5 pb-5 space-y-4 overflow-y-auto flex-1">
                <div>
                  <label className="text-xs font-bold text-muted-foreground mb-1.5 block">{t("name")}</label>
                  <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className={fieldClass} />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground mb-1.5 block">{t("phone")}</label>
                  <input type="tel" dir="ltr" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} className={fieldClass} />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground mb-1.5 block">{t("wilaya")}</label>
                  <select value={editWilaya} onChange={(e) => setEditWilaya(e.target.value)} className={fieldClass}>
                    <option value="">{t("selectWilaya")}</option>
                    {WILAYA_OPTIONS.map((w) => (
                      <option key={w.code} value={w.name}>
                        {String(w.code).padStart(2, "0")} - {isRTL ? w.nameAr : w.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-3 flex-shrink-0 border-t border-border">
                <button onClick={handleSaveProfile} disabled={saving} className="w-full py-3.5 bg-primary text-primary-foreground rounded-2xl font-bold text-sm shadow-md disabled:opacity-50">
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
