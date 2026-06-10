import { useLocation, useRoute } from "wouter";
import { Home, MessageCircle, Plus, Heart, User } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";

export default function BottomNav() {
  const [, navigate] = useLocation();
  const { t } = useI18n();
  const { conversations } = useStore();
  const [onHome] = useRoute("/");
  const [onMessages] = useRoute("/messages");
  const [onMessages2] = useRoute("/messages/:id");
  const [onFavorites] = useRoute("/favorites");
  const [onProfile] = useRoute("/profile");

  const unreadCount = conversations.reduce((sum, c) => sum + c.unread, 0);

  const items = [
    { label: t("home"), icon: Home, path: "/", active: !!onHome },
    { label: t("messages"), icon: MessageCircle, path: "/messages", active: !!(onMessages || onMessages2), badge: unreadCount },
    { label: t("post"), icon: Plus, path: "/post", active: false, primary: true },
    { label: t("favorites"), icon: Heart, path: "/favorites", active: !!onFavorites },
    { label: t("profile"), icon: User, path: "/profile", active: !!onProfile },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 shadow-lg safe-bottom">
      <div className="flex items-center justify-around h-16 px-2 max-w-lg mx-auto">
        {items.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`flex flex-col items-center justify-center flex-1 h-full gap-0.5 relative transition-all duration-200
              ${item.primary ? "scale-100" : ""}`}
          >
            {item.primary ? (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#1B6B3A] to-[#25924F] flex items-center justify-center shadow-lg shadow-green-200 -mt-4">
                <item.icon className="w-6 h-6 text-white" strokeWidth={2.5} />
              </div>
            ) : (
              <>
                <div className="relative">
                  <item.icon
                    className={`w-5 h-5 transition-colors ${item.active ? "text-[#1B6B3A]" : "text-gray-400"}`}
                    strokeWidth={item.active ? 2.5 : 1.8}
                  />
                  {item.badge != null && item.badge > 0 && (
                    <span className="absolute -top-1.5 -end-1.5 w-4 h-4 bg-[#C8972B] rounded-full text-white text-[9px] font-bold flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span
                  className={`text-[10px] font-medium transition-colors ${item.active ? "text-[#1B6B3A]" : "text-gray-400"}`}
                >
                  {item.label}
                </span>
                {item.active && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-[#1B6B3A]" />
                )}
              </>
            )}
          </button>
        ))}
      </div>
    </nav>
  );
}
