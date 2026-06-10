import { useState } from "react";
import { useLocation } from "wouter";
import { Bell, BellOff, Plus, X, MapPin, Tag, CheckCheck, ChevronRight, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { useNotifications } from "@/lib/notifications";
import { CATEGORIES, WILAYAS } from "@/lib/data";
import AppHeader from "@/components/AppHeader";

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "À l'instant";
  if (mins < 60) return `Il y a ${mins} min`;
  if (hrs < 24) return `Il y a ${hrs}h`;
  return `Il y a ${days}j`;
}

type Tab = "notifications" | "alerts";

export default function NotificationsPage() {
  const [, navigate] = useLocation();
  const { t, lang } = useI18n();
  const { alerts, notifications, addAlert, removeAlert, hasAlert, markAllRead, markRead, unreadCount } = useNotifications();
  const [tab, setTab] = useState<Tab>("notifications");
  const [showAddAlert, setShowAddAlert] = useState(false);
  const [alertType, setAlertType] = useState<"wilaya" | "category">("wilaya");
  const [alertValue, setAlertValue] = useState("");

  const handleAddAlert = () => {
    if (!alertValue) return;
    const label =
      alertType === "wilaya"
        ? alertValue
        : CATEGORIES.find((c) => c.id === alertValue)?.id
          ? (lang === "ar"
            ? ""
            : (CATEGORIES.find((c) => c.id === alertValue)?.id ?? alertValue))
          : alertValue;
    addAlert(alertType, alertValue, alertValue);
    setAlertValue("");
    setShowAddAlert(false);
  };

  const catLabel = (catId: string) => {
    const cat = CATEGORIES.find((c) => c.id === catId);
    return cat ? `${cat.icon} ${t(catId as any)}` : catId;
  };

  return (
    <div className="bg-[#F4F6F5] min-h-screen pb-20">
      <AppHeader
        title="Notifications"
        showBack
        right={
          tab === "notifications" && unreadCount > 0 ? (
            <button
              onClick={markAllRead}
              className="flex items-center gap-1 text-xs text-[#1B6B3A] font-semibold"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Tout lire
            </button>
          ) : undefined
        }
      />

      {/* Tabs */}
      <div className="flex bg-white border-b border-gray-100 px-4 gap-1">
        {(["notifications", "alerts"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-3 text-sm font-semibold transition-colors relative
              ${tab === t ? "text-[#1B6B3A]" : "text-gray-400"}`}
          >
            {t === "notifications" ? (
              <span className="flex items-center justify-center gap-1.5">
                Notifications
                {unreadCount > 0 && (
                  <span className="w-4 h-4 bg-[#1B6B3A] rounded-full text-white text-[9px] font-bold flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </span>
            ) : (
              <span className="flex items-center justify-center gap-1.5">
                Mes alertes
                <span className="w-4 h-4 bg-gray-200 rounded-full text-gray-500 text-[9px] font-bold flex items-center justify-center">
                  {alerts.length}
                </span>
              </span>
            )}
            {tab === t && (
              <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-[#1B6B3A] rounded-full" />
            )}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === "notifications" ? (
          <motion.div
            key="notifications"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
          >
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[60vh] gap-3">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                  <BellOff className="w-7 h-7 text-gray-300" />
                </div>
                <p className="text-sm font-semibold text-gray-500">Aucune notification</p>
                <p className="text-xs text-gray-400">Créez des alertes pour être notifié</p>
                <button
                  onClick={() => setTab("alerts")}
                  className="px-5 py-2.5 bg-[#1B6B3A] text-white rounded-2xl text-sm font-semibold mt-1"
                >
                  Créer une alerte
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 bg-white mt-2 rounded-2xl mx-3 overflow-hidden shadow-sm">
                {notifications.map((notif, i) => (
                  <motion.div
                    key={notif.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => {
                      markRead(notif.id);
                      navigate(`/listing/${notif.listingId}`);
                    }}
                    className={`flex items-center gap-3 px-4 py-3.5 cursor-pointer active:bg-gray-50 transition-colors
                      ${!notif.read ? "bg-green-50/50" : ""}`}
                  >
                    {/* Dot */}
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${!notif.read ? "bg-[#1B6B3A]" : "bg-transparent"}`} />

                    {/* Image */}
                    <img
                      src={notif.listingImage}
                      alt=""
                      className="w-12 h-12 rounded-xl object-cover flex-shrink-0 bg-gray-100"
                    />

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-[10px] font-bold text-[#1B6B3A] bg-green-50 px-1.5 py-0.5 rounded-full">
                          🔔 {notif.matchedAlert}
                        </span>
                      </div>
                      <p className={`text-sm truncate ${!notif.read ? "font-bold text-gray-900" : "font-medium text-gray-700"}`}>
                        {notif.listingTitle}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs font-bold text-[#1B6B3A]">
                          {notif.listingPrice.toLocaleString()} DA
                        </span>
                        <span className="text-[10px] text-gray-400">· {notif.wilaya}</span>
                        <span className="text-[10px] text-gray-300 ml-auto">{timeAgo(notif.timestamp)}</span>
                      </div>
                    </div>

                    <ChevronRight className="w-4 h-4 text-gray-200 flex-shrink-0" />
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="alerts"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="px-4 pt-4 space-y-3"
          >
            {/* Add alert button */}
            <button
              onClick={() => setShowAddAlert(true)}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-dashed border-[#1B6B3A]/30 text-[#1B6B3A] font-semibold text-sm bg-green-50/50"
            >
              <Plus className="w-4 h-4" />
              Créer une nouvelle alerte
            </button>

            {/* Alert list */}
            {alerts.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-2">🔔</div>
                <p className="text-sm text-gray-500">Aucune alerte configurée</p>
              </div>
            ) : (
              <div className="space-y-2">
                {alerts.map((alert, i) => (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-white rounded-2xl px-4 py-3.5 flex items-center gap-3 shadow-sm"
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0
                      ${alert.type === "wilaya" ? "bg-blue-50" : "bg-green-50"}`}>
                      {alert.type === "wilaya"
                        ? <MapPin className="w-4.5 h-4.5 text-blue-500" />
                        : <Tag className="w-4.5 h-4.5 text-[#1B6B3A]" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900">
                        {alert.type === "category" ? catLabel(alert.value) : alert.label}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {alert.type === "wilaya" ? "📍 Wilaya" : "🏷️ Catégorie"} · Actif
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      <button
                        onClick={() => removeAlert(alert.id)}
                        className="w-7 h-7 rounded-full bg-red-50 flex items-center justify-center ml-1"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Info card */}
            <div className="bg-[#1B6B3A]/5 rounded-2xl p-4 border border-[#1B6B3A]/10">
              <div className="flex items-start gap-2.5">
                <Bell className="w-4 h-4 text-[#1B6B3A] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-bold text-[#1B6B3A]">Comment fonctionnent les alertes ?</p>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                    Recevez des notifications instantanées dès qu'une nouvelle annonce correspond à vos critères (wilaya ou catégorie).
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add alert bottom sheet */}
      <AnimatePresence>
        {showAddAlert && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-end"
            onClick={() => setShowAddAlert(false)}
          >
            <motion.div
              initial={{ y: 300 }}
              animate={{ y: 0 }}
              exit={{ y: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full max-w-[430px] mx-auto rounded-t-3xl p-5 space-y-4"
            >
              <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto" />
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-gray-900">Nouvelle alerte</h3>
                <button onClick={() => setShowAddAlert(false)}>
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Type selector */}
              <div className="flex gap-2">
                {(["wilaya", "category"] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => { setAlertType(type); setAlertValue(""); }}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border-2 text-sm font-semibold transition-colors
                      ${alertType === type ? "border-[#1B6B3A] bg-green-50 text-[#1B6B3A]" : "border-gray-200 text-gray-500"}`}
                  >
                    {type === "wilaya" ? <><MapPin className="w-4 h-4" /> Wilaya</> : <><Tag className="w-4 h-4" /> Catégorie</>}
                  </button>
                ))}
              </div>

              {/* Value selector */}
              {alertType === "wilaya" ? (
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Choisissez une wilaya</label>
                  <select
                    value={alertValue}
                    onChange={(e) => setAlertValue(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 text-sm outline-none"
                  >
                    <option value="">Sélectionner une wilaya</option>
                    {WILAYAS.map((w) => (
                      <option key={w} value={w}>{w}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-2 block">Choisissez une catégorie</label>
                  <div className="grid grid-cols-2 gap-2">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setAlertValue(cat.id)}
                        className={`flex items-center gap-2 px-3 py-3 rounded-2xl border-2 transition-colors text-sm font-medium
                          ${alertValue === cat.id ? "border-[#1B6B3A] bg-green-50 text-[#1B6B3A]" : "border-gray-100 text-gray-600 bg-gray-50"}`}
                      >
                        <span className="text-lg">{cat.icon}</span>
                        {t(cat.id as any)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {hasAlert(alertType, alertValue) && alertValue && (
                <p className="text-xs text-amber-600 font-medium bg-amber-50 px-3 py-2 rounded-xl">
                  ⚠️ Vous avez déjà une alerte pour cela
                </p>
              )}

              <button
                onClick={handleAddAlert}
                disabled={!alertValue || hasAlert(alertType, alertValue)}
                className="w-full py-4 bg-[#1B6B3A] text-white rounded-2xl font-bold text-sm shadow-lg shadow-green-200 disabled:opacity-40"
              >
                Créer l'alerte
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
