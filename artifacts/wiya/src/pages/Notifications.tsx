import { useLocation } from "wouter";
import { BellOff, CheckCheck, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { useNotifications } from "@/lib/notifications";
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

export default function NotificationsPage() {
  const [, navigate] = useLocation();
  const { notifications, markAllRead, markRead, unreadCount } = useNotifications();

  return (
    <div className="bg-[#F4F6F5] min-h-screen pb-20">
      <AppHeader
        title="Notifications"
        showBack
        right={
          unreadCount > 0 ? (
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

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[60vh] gap-3">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
            <BellOff className="w-7 h-7 text-gray-300" />
          </div>
          <p className="text-sm font-semibold text-gray-500">Aucune notification</p>
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
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${!notif.read ? "bg-[#1B6B3A]" : "bg-transparent"}`} />

              <img
                src={notif.listingImage}
                alt=""
                className="w-12 h-12 rounded-xl object-cover flex-shrink-0 bg-gray-100"
              />

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
    </div>
  );
}
