import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { Home, MessageCircle, Plus, Heart, User } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { supabase } from "@/lib/supabase";

export default function BottomNav() {
  const [, navigate] = useLocation();
  const { t } = useI18n();
  const { user } = useStore(); // On récupère l'utilisateur connecté
  const [onHome] = useRoute("/");
  const [onMessages] = useRoute("/messages");
  const [onMessages2] = useRoute("/messages/:id");
  const [onFavorites] = useRoute("/favorites");
  const [onProfile] = useRoute("/profile");

  // État local pour les messages non lus en temps réel
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    if (!user) {
      setUnreadMessages(0);
      return;
    }

    // 1. Compte les vrais messages non lus directement en BDD
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

    // 2. Écoute les changements en temps réel (Supabase Realtime)
    const channel = supabase
      .channel("bottom-nav-realtime-badge")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        () => {
          fetchUnreadCount(); // Recalcule dès qu'un message change d'état (ex: lu)
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // On cache complètement la nav globale quand on est dans une
  // conversation ouverte, pour laisser la barre de saisie du chat prendre
  // toute la place en bas, sans chevauchement.
  if (onMessages2) {
    return null;
  }

  const items = [
    { label: t("home"), icon: Home, path: "/", active: !!onHome },
    { label: t("messages"), icon: MessageCircle, path: "/messages", active: !!(onMessages || onMessages2), badge: unreadMessages },
    { label: t("post"), icon: Plus, path: "/post", active: false, primary: true },
    { label: t("favorites"), icon: Heart, path: "/favorites", active: !!onFavorites },
    { label: t("profile"), icon: User, path: "/profile", active: !!onProfile },
  ];

  // Barre flottante : arrondie, détachée du bord, avec le "+" doré au centre.
  return (
    <nav className="pointer-events-auto mx-3 mb-2 h-14 rounded-[26px] bg-card border border-border shadow-[0_10px_30px_rgba(0,0,0,0.16)]">
      <div className="flex items-center justify-around h-full px-2">
        {items.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            aria-label={item.label}
            className="flex flex-col items-center justify-center flex-1 h-full gap-0.5 relative active:scale-95 transition-transform duration-150"
          >
            {item.primary ? (
              <div className="w-[52px] h-[52px] -translate-y-4 rounded-full bg-accent text-accent-foreground flex items-center justify-center shadow-[0_0_0_4px_hsl(var(--card)),0_8px_18px_rgba(242,169,59,0.45)]">
                <item.icon className="w-6 h-6" strokeWidth={2.75} />
              </div>
            ) : (
              <>
                {item.active && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-5 h-1 rounded-b-full bg-primary" />
                )}
                <div className="relative">
                  <item.icon
                    className={`w-5 h-5 transition-colors ${item.active ? "text-primary" : "text-muted-foreground"}`}
                    strokeWidth={item.active ? 2.5 : 1.8}
                  />
                  {item.badge != null && item.badge > 0 && (
                    <span className="absolute -top-1.5 -end-2 min-w-[16px] h-4 px-1 bg-destructive rounded-full text-white text-[9px] font-bold flex items-center justify-center border border-card">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span
                  className={`text-[10px] font-semibold transition-colors ${item.active ? "text-primary" : "text-muted-foreground"}`}
                >
                  {item.label}
                </span>
              </>
            )}
          </button>
        ))}
      </div>
    </nav>
  );
}
