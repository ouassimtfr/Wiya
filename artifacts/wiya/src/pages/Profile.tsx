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
  return (
    <button onClick={onToggle} className="w-full flex items-center gap-3 px-4 py-3.5 bg-white rounded-2xl shadow-sm">
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${isDark ? "bg-indigo-950" : "bg-amber-50"}`}>
        {isDark ? <Moon className="w-4 h-4 text-indigo-300" /> : <Sun className="w-4 h-4 text-amber-500" />}
      </div>
      <span className="flex-1 text-sm font-medium text-gray-800 text-start">{isDark ? "Mode sombre" : "Mode clair"}</span>
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

const STATUS_CONFIG = {
  pending: { label: "En attente", icon: Clock, pill: "bg-amber-50 text-amber-600 border border-amber-200", dot: "bg-amber-400", card: "border-amber-100" },
  active: { label: "Boost actif", icon: Check, pill: "bg-green-50 text-[#1B6B3A] border border-green-200", dot: "bg-[#1B6B3A]", card: "border-green-100" },
  refused: { label: "Refusé", icon: X, pill: "bg-red-50 text-red-500 border border-red-200", dot: "bg-red-400", card: "border-red-100" },
} as const;

export default function ProfilePage() {
  const [, navigate] = useLocation();
  const { t } = useI18n();
  const { user, logout, favorites, boostRequests } = useStore();
  const { isDark, toggleTheme } = useTheme();
  const [tab, setTab] = useState<"profile" | "boosts">("profile");
  const [myListings, setMyListings] = useState<any[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [showSupport, setShowSupport] = useState(false);

  // Champs modifiables
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(user?.name ?? "");
  const [editPhone, setEditPhone] = useState(user?.phone ?? "");
  const [editWilaya, setEditWilaya] = useState(user?.wilaya ?? "");
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => { if (user) fetchMyListings(); }, [user]);

  const fetchMyListings = async () => {
    const { data } = await supabase.from("listings").select("*").eq("user_id", user!.id).eq("is_active", true).order("created_at", { ascending: false });
    if (data) setMyListings(data);
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.auth.updateUser({
      data: {
        name: editName,
        phone: editPhone,
        wilaya: editWilaya,
      }
    });
    setSaving(false);
    if (!error) {
      setSaveSuccess(true);
      setEditing(false);
      setTimeout(() => setSaveSuccess(false), 2000);
    }
  };

  const pendingBoosts = boostRequests.filter((r) => r.status === "pending").length;
  const activeBoosts = boostRequests.filter((r) => r.status === "active").length;

  if (!user) {
    return (
      <div className="bg-[#F4F6F5] min-h-screen pb-24">
        <AppHeader title={t("profile")} />
        <div className="flex flex-col items-center justify-center h-[70vh] px-8 text-center gap-4">
          <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center text-4xl">👤</div>
          <h2 className="text-base font-bold text-gray-900">{t("notLoggedIn")}</h2>
          <p className="text-sm text-gray-500">{t("notLoggedInDesc")}</p>
          <button onClick={() => navigate("/auth")} className="w-full max-w-xs py-3.5 bg-[#1B6B3A] text-white rounded-2xl font-bold text-sm shadow-md shadow-green-200">{t("login")}</button>
          <button onClick={() => navigate("/auth?mode=register")} className="w-full max-w-xs py-3.5 border-2 border-[#1B6B3A] text-[#1B6B3A] rounded-2xl font-bold text-sm">{t("createAccount")}</button>
        </div>
        <div className="px-4 mt-2"><DarkModeRow isDark={isDark} onToggle={toggleTheme} /></div>
      </div>
    );
  }

  const menuItems = [
    { icon: Package, label: t("myListings"), action: () => {}, badge: myListings.length },
    { icon: Heart, label: t("favorites"), action: () => navigate("/favorites"), badge: favorites.length },
    { icon: Zap, label: t("boostTitle"), action: () => setTab("boosts"), badge: pendingBoosts },
    { icon: Bell, label: "Notifications", action: () => navigate("/notifications"), badge: 0 },
    { icon: Settings, label: "Paramètres", action: () => { setEditName(user.name); setEditPhone(user.phone); setEditWilaya(user.wilaya); setShowSettings(true); }, badge: 0 },
    { icon: HelpCircle, label: "Aide & Support", action: () => setShowSupport(true), badge: 0 },
  ];

  return (
    <div className="bg-[#F4F6F5] min-h-screen pb-28">
      <div className="bg-[#1B6B3A] pt-12 pb-5 px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10"><div className="absolute -bottom-8 -right-8 w-40 h-40 rounded-full bg-[#C8972B]" /></div>
        <div className="relative flex items-center gap-4">
          <div className="relative">
            <UserAvatar name={user.name} avatarUrl={user.avatar} size={72} />
            {user.verified && <div className="absolute -bottom-1 -end-1 w-6 h-6 bg-[#C8972B] rounded-full flex items-center justify-center border-2 border-[#1B6B3A]"><Shield className="w-3 h-3 text-white" /></div>}
          </div>
          <div className="flex-1">
            <h2 className="text-white text-lg font-black">{user.name}</h2>
            <div className="flex items-center gap-1 mt-0.5"><Star className="w-3.5 h-3.5 fill-[#C8972B] text-[#C8972B]" /><span className="text-white/90 text-xs font-semibold">{user.rating}</span><span className="text-green-200 text-xs">({user.reviews} {t("reviews")})</span></div>
            <div className="flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3 text-green-200" /><span className="text-green-200 text-xs">{user.wilaya}</span><span className="text-green-300 text-xs">• {t("memberSince")} {user.memberSince}</span></div>
          </div>
          <button onClick={() => { setEditName(user.name); setEditPhone(user.phone); setEditWilaya(user.wilaya); setShowSettings(true); }} className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <Settings className="w-4 h-4 text-white" />
          </button>
        </div>
        <div className="flex gap-3 mt-4">
          {[{ label: t("myListings"), value: String(myListings.length) }, { label: t("favorites"), value: String(favorites.length) }, { label: "Boosts actifs", value: String(activeBoosts) }].map((stat) => (
            <div key={stat.label} className="flex-1 bg-white/15 rounded-2xl py-2.5 px-3 text-center">
              <p className="text-white text-lg font-black">{stat.value}</p>
              <p className="text-green-200 text-[10px] font-medium leading-tight">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex bg-white border-b border-gray-100 px-4 gap-1 sticky top-0 z-30 shadow-sm">
        {(["profile", "boosts"] as const).map((t_) => {
          const labels = { profile: "Mon profil", boosts: "Mes boosts" };
          const badges = { profile: 0, boosts: pendingBoosts };
          return (
            <button key={t_} onClick={() => setTab(t_)} className={`flex-1 py-3 text-sm font-semibold transition-colors relative flex items-center justify-center gap-1.5 ${tab === t_ ? "text-[#1B6B3A]" : "text-gray-400"}`}>
              {labels[t_]}
              {badges[t_] > 0 && <span className="w-4 h-4 bg-amber-400 rounded-full text-white text-[9px] font-black flex items-center justify-center">{badges[t_]}</span>}
              {tab === t_ && <motion.div layoutId="profile-tab-bar" className="absolute bottom-0 start-0 end-0 h-0.5 bg-[#1B6B3A] rounded-full" />}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {tab === "profile" && (
          <motion.div key="profile" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.18 }} className="px-4 pt-4 space-y-4">
            <button onClick={() => navigate("/post")} className="w-full bg-gradient-to-r from-[#C8972B] to-[#E8B84A] rounded-2xl py-4 flex items-center justify-between px-5 shadow-md shadow-amber-200">
              <div className="text-start"><p className="text-white font-black text-sm">Publier une nouvelle annonce</p><p className="text-amber-100 text-xs mt-0.5">Vendez rapidement avec Wiya</p></div>
              <div className="text-2xl">📢</div>
            </button>
            {myListings.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3"><h3 className="text-sm font-bold text-gray-800">{t("myListings")}</h3><button className="text-xs text-[#1B6B3A] font-semibold">Voir tout</button></div>
                <div className="space-y-2.5">{myListings.slice(0, 3).map((l) => <ListingCard key={l.id} listing={l} variant="list" />)}</div>
              </div>
            )}
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
              {menuItems.map((item) => (
                <motion.button key={item.label} whileTap={{ backgroundColor: "#f9fafb" }} onClick={item.action} className="w-full flex items-center gap-3 px-4 py-3.5 border-b border-gray-50 last:border-0">
                  <div className="w-8 h-8 rounded-xl bg-green-50 flex items-center justify-center"><item.icon className="w-4 h-4 text-[#1B6B3A]" /></div>
                  <span className="flex-1 text-sm font-medium text-gray-800 text-start">{item.label}</span>
                  {item.badge != null && item.badge > 0 && <span className="w-5 h-5 bg-[#1B6B3A] rounded-full text-white text-[10px] font-bold flex items-center justify-center">{item.badge}</span>}
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </motion.button>
              ))}
            </div>
            <DarkModeRow isDark={isDark} onToggle={toggleTheme} />
            <button onClick={() => { logout(); navigate("/"); }} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-red-200 text-red-500 font-semibold text-sm">
              <LogOut className="w-4 h-4" />{t("logout")}
            </button>
          </motion.div>
        )}

        {tab === "boosts" && (
          <motion.div key="boosts" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }} transition={{ duration: 0.18 }} className="px-4 pt-4 space-y-3 pb-6">
            {boostRequests.length > 0 && (
              <div className="flex gap-2">
                {[{ status: "pending", label: "En attente", color: "bg-amber-50 text-amber-600" }, { status: "active", label: "Actifs", color: "bg-green-50 text-[#1B6B3A]" }, { status: "refused", label: "Refusés", color: "bg-red-50 text-red-500" }].map((s) => {
                  const count = boostRequests.filter((r) => r.status === s.status).length;
                  return <div key={s.status} className={`flex-1 ${s.color} rounded-2xl py-2.5 text-center`}><p className="text-lg font-black">{count}</p><p className="text-[10px] font-semibold opacity-80">{s.label}</p></div>;
                })}
              </div>
            )}
            {boostRequests.length === 0 && (
              <div className="bg-white rounded-3xl p-8 text-center shadow-sm">
                <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4"><Zap className="w-8 h-8 text-[#C8972B]" /></div>
                <h3 className="text-base font-black text-gray-900 mb-1">Aucun boost soumis</h3>
                <p className="text-sm text-gray-400 mb-5 leading-relaxed">Boostez une annonce pour lui donner plus de visibilité.</p>
                <button onClick={() => navigate("/boost/1")} className="w-full py-3.5 bg-gradient-to-r from-[#1B6B3A] to-[#25924F] text-white rounded-2xl font-bold text-sm shadow-md shadow-green-200">
                  <Zap className="w-4 h-4 inline me-1.5 fill-white" />Booster une annonce
                </button>
              </div>
            )}
            {boostRequests.map((req, i) => {
              const cfg = STATUS_CONFIG[req.status];
              const StatusIcon = cfg.icon;
              return (
                <motion.div key={req.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className={`bg-white rounded-3xl shadow-sm border ${cfg.card} overflow-hidden`}>
                  <div className={`px-4 py-2 flex items-center justify-between ${req.status === "active" ? "bg-green-50 border-b border-green-100" : req.status === "refused" ? "bg-red-50 border-b border-red-100" : "bg-amber-50 border-b border-amber-100"}`}>
                    <div className="flex items-center gap-1.5"><div className={`w-2 h-2 rounded-full ${cfg.dot}`} /><span className={`text-xs font-bold ${req.status === "active" ? "text-[#1B6B3A]" : req.status === "refused" ? "text-red-500" : "text-amber-600"}`}>{cfg.label}</span></div>
                    <span className="text-[10px] text-gray-400">{req.submittedAt}</span>
                  </div>
                  <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-50">
                    <img src={req.listingImage} alt="" className="w-12 h-12 rounded-2xl object-cover flex-shrink-0 bg-gray-100" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">{req.listingTitle}</p>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${req.type === "premium" ? "bg-amber-50 text-[#C8972B]" : "bg-green-50 text-[#1B6B3A]"}`}>{req.planLabel}</span>
                        <span className="text-[10px] text-gray-400">·</span>
                        <span className="text-[10px] font-bold text-gray-600">{req.price.toLocaleString()} DA</span>
                        <span className="text-[10px] text-gray-400">·</span>
                        <span className="text-[10px] text-gray-400">{req.days} jours</span>
                      </div>
                    </div>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${req.status === "active" ? "bg-green-50" : req.status === "refused" ? "bg-red-50" : "bg-amber-50"}`}>
                      <StatusIcon className={`w-4 h-4 ${req.status === "active" ? "text-[#1B6B3A]" : req.status === "refused" ? "text-red-500" : "text-amber-500"}`} />
                    </div>
                  </div>
                  <div className="px-4 py-3">
                    {req.status === "pending" && <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse flex-shrink-0" /><p className="text-xs text-amber-600 font-medium">En cours de vérification — activation sous 24h</p></div>}
                    {req.status === "active" && <div className="flex items-center gap-2"><Zap className="w-3.5 h-3.5 text-[#1B6B3A] fill-[#1B6B3A] flex-shrink-0" /><p className="text-xs text-[#1B6B3A] font-semibold">Boost actif · votre annonce est mise en avant</p></div>}
                    {req.status === "refused" && <div className="flex items-center justify-between gap-3"><p className="text-xs text-red-400 font-medium flex-1">Reçu non validé — vérifiez le montant et réessayez</p><button onClick={() => navigate(`/boost/${req.listingId}`)} className="flex items-center gap-1.5 px-3 py-2 bg-[#1B6B3A] text-white rounded-xl text-xs font-bold flex-shrink-0 shadow-sm"><RefreshCw className="w-3 h-3" />Renouveler</button></div>}
                  </div>
                </motion.div>
              );
            })}
            {boostRequests.length > 0 && <button onClick={() => navigate("/boost/1")} className="w-full py-3.5 border-2 border-dashed border-[#1B6B3A]/30 rounded-2xl text-sm font-semibold text-[#1B6B3A] flex items-center justify-center gap-2"><Zap className="w-4 h-4" />Booster une autre annonce</button>}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings bottom sheet */}
      <AnimatePresence>
        {showSettings && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={() => setShowSettings(false)}>
            <motion.div initial={{ y: 300 }} animate={{ y: 0 }} exit={{ y: 300 }} onClick={(e) => e.stopPropagation()} className="bg-white w-full rounded-t-3xl p-5 space-y-4 max-h-[85vh] flex flex-col" style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 110px)" }}>
              <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto flex-shrink-0" />
              
              <div className="flex items-center justify-between flex-shrink-0">
                <h3 className="text-base font-black text-gray-900">Paramètres</h3>
                <button onClick={() => setEditing(!editing)} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1B6B3A]/10 rounded-xl">
                  <Edit2 className="w-3.5 h-3.5 text-[#1B6B3A]" />
                  <span className="text-xs font-bold text-[#1B6B3A]">{editing ? "Annuler" : "Modifier"}</span>
                </button>
              </div>

              {/* Zone scrollable interne pour contenir le formulaire de manière sécurisée */}
              <div className="space-y-3 overflow-y-auto pr-1 pb-4 flex-1">
                <div className="bg-gray-50 rounded-2xl p-4">
                  <p className="text-xs font-semibold text-gray-500 mb-1">Nom</p>
                  {editing ? (
                    <input value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#1B6B3A]" />
                  ) : (
                    <p className="text-sm font-bold text-gray-900">{user.name}</p>
                  )}
                </div>
                <div className="bg-gray-50 rounded-2xl p-4">
                  <p className="text-xs font-semibold text-gray-500 mb-1">Email</p>
                  <p className="text-sm font-bold text-gray-900">{user.email}</p>
                </div>
                <div className="bg-gray-50 rounded-2xl p-4">
                  <p className="text-xs font-semibold text-gray-500 mb-1">Téléphone</p>
                  {editing ? (
                    <input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#1B6B3A]" type="tel" />
                  ) : (
                    <p className="text-sm font-bold text-gray-900">{user.phone || "Non renseigné"}</p>
                  )}
                </div>
                <div className="bg-gray-50 rounded-2xl p-4">
                  <p className="text-xs font-semibold text-gray-500 mb-1">Wilaya</p>
                  {editing ? (
                    <input value={editWilaya} onChange={(e) => setEditWilaya(e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#1B6B3A]" />
                  ) : (
                    <p className="text-sm font-bold text-gray-900">{user.wilaya}</p>
                  )}
                </div>
              </div>

              {/* Bouton de validation surélevé */}
              <div className="flex-shrink-0 pt-2">
                {editing ? (
                  <button onClick={handleSaveProfile} disabled={saving} className="w-full py-3.5 bg-[#1B6B3A] text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-md">
                    {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Save className="w-4 h-4" />Enregistrer</>}
                  </button>
                ) : (
                  <button onClick={() => setShowSettings(false)} className="w-full py-3.5 bg-[#1B6B3A] text-white rounded-2xl font-bold text-sm shadow-md">
                    {saveSuccess ? "✅ Modifications enregistrées !" : "Fermer"}
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Support bottom sheet */}
      <AnimatePresence>
        {showSupport && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={() => setShowSupport(false)}>
            <motion.div initial={{ y: 300 }} animate={{ y: 0 }} exit={{ y: 300 }} onClick={(e) => e.stopPropagation()} className="bg-white w-full rounded-t-3xl p-5 space-y-4" style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 110px)" }}>
              <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto" />
              <h3 className="text-base font-black text-gray-900">Aide & Support</h3>
              <div className="space-y-3">
                <a href="https://wa.me/213783150457" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 bg-green-50 rounded-2xl">
                  <span className="text-2xl">💬</span>
                  <div>
                    <p className="text-sm font-bold text-gray-900">WhatsApp</p>
                    <p className="text-xs text-gray-500">Contactez-nous directement</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 ml-auto" />
                </a>
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl">
                  <span className="text-2xl">📧</span>
                  <div>
                    <p className="text-sm font-bold text-gray-900">Email</p>
                    <p className="text-xs text-gray-500">support@wiya.app</p>
                  </div>
                </div>
              </div>
              <button onClick={() => setShowSupport(false)} className="w-full py-3.5 bg-[#1B6B3A] text-white rounded-2xl font-bold text-sm shadow-md">
                Fermer
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
