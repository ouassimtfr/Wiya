import { useLocation } from "wouter";
import { BellOff, CheckCheck, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { useNotifications } from "@/lib/notifications";
import { WILAYAS_DATA } from "@/lib/wilayas";
import AppHeader from "@/components/AppHeader";

export default function NotificationsPage() {
  const [, navigate] = useLocation();
  const { t, isRTL } = useI18n();
  const tr = (fr: string, ar: string) => (isRTL ? ar : fr);
  const { notifications, markAllRead, markRead, unreadCount } = useNotifications();

  const timeAgo = (ts: number): string => {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    const hrs = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1) return tr("À l'instant", "الآن");
    if (mins < 60) return tr(`Il y a ${mins} min`, `منذ ${mins} دقيقة`);
    if (hrs < 24) return tr(`Il y a ${hrs}h`, `منذ ${hrs} ساعة`);
    return tr(`Il y a ${days}j`, `منذ ${days} يوم`);
  };

  const wilayaLabel = (name: string) =>
    isRTL ? WILAYAS_DATA.find((w) => w.name === name)?.nameAr ?? name : name;

  const open = (id: string, listingId: string) => {
    markRead(id);
    navigate(`/listing/${listingId}`);
  };

  return (
    <div className="bg-[#F4F6F5] min-h-[100dvh] pb-[calc(7rem+env(safe-area-inset-bottom))]">
      <AppHeader title={t("notifications")} showBack />

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[70vh] px-8 text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
            <BellOff className="w-7 h-7 text-gray-400" />
          </div>
          <h2 className="text-base font-bold text-gray-900">
            {tr("Aucune notification", "لا توجد إشعارات")}
          </h2>
          <p className="text-sm text-gray-500">
            {tr(
              "Créez des alertes pour être prévenu des nouvelles annonces.",
              "أنشئ تنبيهات لتصلك الإعلانات الجديدة."
            )}
          </p>
        </div>
      ) : (
        <div className="px-4 pt-4 space-y-2.5">
          {unreadCount > 0 && (
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-500">
                {tr(
                  `${unreadCount} non lue${unreadCount > 1 ? "s" : ""}`,
                  `${unreadCount} غير مقروءة`
                )}
              </p>
              <button
                onClick={markAllRead}
                className="flex items-center gap-1.5 text-xs font-semibold text-[#1B6B3A]"
              >
                <CheckCheck className="w-4 h-4" />
                {tr("Tout marquer comme lu", "تحديد الكل كمقروء")}
              </button>
            </div>
          )}

          {notifications.map((n, i) => (
            <motion.button
              key={n.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i, 8) * 0.04 }}
              onClick={() => open(n.id, n.listingId)}
              className={`w-full flex items-center gap-3 rounded-2xl p-3 text-start shadow-sm active:scale-[0.99] transition-transform ${
                n.read ? "bg-white" : "bg-white border border-[#1B6B3A]/30"
              }`}
            >
              <div className="w-14 h-14 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
                {n.listingImage ? (
                  <img src={n.listingImage} alt="" className="w-14 h-14 object-cover" />
                ) : (
                  <span className="text-2xl">📦</span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold text-[#1B6B3A] truncate">
                  {tr("Nouvelle annonce", "إعلان جديد")} · {n.matchedAlert}
                </p>
                <p
                  className={`text-sm truncate ${
                    n.read ? "font-medium text-gray-700" : "font-bold text-gray-900"
                  }`}
                >
                  {n.listingTitle}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {n.listingPrice > 0 ? `${n.listingPrice.toLocaleString()} ${t("da")}` : ""}
                  {n.listingPrice > 0 && n.wilaya ? " · " : ""}
                  {n.wilaya ? wilayaLabel(n.wilaya) : ""}
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">{timeAgo(n.timestamp)}</p>
              </div>

              {!n.read && <span className="w-2.5 h-2.5 rounded-full bg-[#1B6B3A] flex-shrink-0" />}
              <ChevronRight
                className={`w-4 h-4 text-gray-300 flex-shrink-0 ${isRTL ? "rotate-180" : ""}`}
              />
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}
