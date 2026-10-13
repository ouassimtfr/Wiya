import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { Home, MessageCircle, Plus, Heart, User } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { supabase } from "@/lib/supabase";

export default function BottomNav() {
  const [, navigate] = useLocation();
  const { t, isRTL } = useI18n();
  const { user } = useStore();
  const [onHome] = useRoute("/");
  const [onMessages] = useRoute("/messages");
  const [onMessages2] = useRoute("/messages/:id");
  const [onFavorites] = useRoute("/favorites");
  const [onProfile] = useRoute("/profile");

  // Messages non lus en temps réel
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    if (!user) {
      setUnreadMessages(0);
      return;
    }

    const fetchUnreadCount = async () => {
      const { count, error } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("receiver_id", user.id)
        .eq("is_read", false);

      if (!error && count !== null) {
        setUnreadMessages(count);
      }
    };

    fetchUnreadCount();

    const channel = supabase
      .channel("bottom-nav-realtime-badge")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        () => {
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Cachée dans une conversation ouverte : la barre de saisie du chat prend toute la place
  if (onMessages2) {
    return null;
  }

  const items = [
    { label: t("home"), icon: Home, path: "/", active: !!onHome },
    { label: t("messages"), icon: MessageCircle, path: "/messages", active: !!onMessages, badge: unreadMessages },
    { label: isRTL ? "بيع" : "Vendre", icon: Plus, path: "/post", active: false, primary: true },
    { label: t("favorites"), icon: Heart, path: "/favorites", active: !!onFavorites },
    { label: t("profile"), icon: User, path: "/profile", active: !!onProfile },
  ];

  // Barre fixée en bas (56 px + 8 px de marge : la hauteur attendue par les autres pages)
  return (
    <div className="fixed bottom-0 inset-x-0 z-50 pointer-events-none">
      <div className="max-w-[430px] mx-auto px-3 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
        <nav className="pointer-events-auto h-14 rounded-[24px] bg-card ring-1 ring-border/60 shadow-[0_8px_28px_rgba(20,32,26,0.18)]">
          <div className="flex items-center justify-around h-full px-1.5">
            {items.map((item) =>
              item.primary ? (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  aria-label={item.label}
                  className="flex items-center gap-1.5 bg-primary text-primary-foreground rounded-2xl ps-3.5 pe-4 py-2.5 text-[14px] font-bold shadow-md active:scale-95 transition-transform"
                >
                  <item.icon className="w-[18px] h-[18px]" strokeWidth={2.8} />
                  {item.label}
                </button>
              ) : (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  aria-label={item.label}
                  className="flex flex-col items-center justify-center gap-0.5 min-w-[52px] h-full relative active:scale-95 transition-transform"
                >
                  <div className="relative">
                    <item.icon
                      className={`w-[22px] h-[22px] transition-colors ${item.active ? "text-primary" : "text-muted-foreground"}`}
                      strokeWidth={item.active ? 2.4 : 1.9}
                    />
                    {item.badge != null && item.badge > 0 && (
                      <span className="absolute -top-1.5 -end-2 min-w-[16px] h-4 px-1 bg-destructive rounded-full text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-card">
                        {item.badge > 9 ? "9+" : item.badge}
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-[10px] leading-none transition-colors ${
                      item.active ? "text-primary font-bold" : "text-muted-foreground font-medium"
                    }`}
                  >
                    {item.label}
                  </span>
                </button>
              )
            )}
          </div>
        </nav>
      </div>
    </div>
  );
}
