import { useLocation } from "wouter";
import { X, Bell } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNotifications } from "@/lib/notifications";
import { CATEGORIES } from "@/lib/data";

export default function NotificationToast() {
  const { toastQueue, dismissToast, markRead } = useNotifications();
  const [, navigate] = useLocation();

  return (
    <div className="fixed top-14 left-0 right-0 max-w-[430px] mx-auto z-[100] px-3 space-y-2 pointer-events-none">
      <AnimatePresence>
        {toastQueue.map((notif) => {
          const category = CATEGORIES.find((c) => c.id === notif.category);

          return (
            <motion.div
              key={notif.id}
              initial={{ y: -80, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -80, opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", damping: 22, stiffness: 300 }}
              className="pointer-events-auto"
            >
              <div
                className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-100 flex items-center gap-3 px-3 py-3 cursor-pointer active:scale-[0.98] transition-transform"
                onClick={() => {
                  markRead(notif.id);
                  dismissToast(notif.id);
                  navigate("/notifications");
                }}
              >
                {/* Icon / image */}
                <div className="relative flex-shrink-0">
                  <img
                    src={notif.listingImage}
                    alt=""
                    className="w-11 h-11 rounded-xl object-cover bg-gray-100"
                  />
                  <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#1B6B3A] rounded-full flex items-center justify-center border-2 border-white">
                    <Bell className="w-2.5 h-2.5 text-white fill-white" />
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 mb-0.5">
                    <span className="text-[10px] font-bold text-[#1B6B3A] bg-green-50 px-1.5 py-0.5 rounded-full">
                      {category?.icon} {notif.matchedAlert}
                    </span>
                    <span className="text-[9px] text-gray-400">• Maintenant</span>
                  </div>
                  <p className="text-xs font-bold text-gray-900 truncate">{notif.listingTitle}</p>
                  <p className="text-xs font-semibold text-[#1B6B3A]">
                    {notif.listingPrice.toLocaleString()} DA
                    <span className="text-gray-400 font-normal"> · {notif.wilaya}</span>
                  </p>
                </div>

                {/* Dismiss */}
                <button
                  onClick={(e) => { e.stopPropagation(); dismissToast(notif.id); }}
                  className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0"
                >
                  <X className="w-3 h-3 text-gray-400" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
