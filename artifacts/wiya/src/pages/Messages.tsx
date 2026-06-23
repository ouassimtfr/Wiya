import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import AppHeader from "@/components/AppHeader";

export default function MessagesPage() {
  const [, navigate] = useLocation();
  const { t } = useI18n();
  const { user } = useStore();
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchConversations();
  }, [user]);

  const fetchConversations = async () => {
    setLoading(true);

    // Récupère tous les messages où l'utilisateur est sender ou receiver
    const { data: msgs } = await supabase
      .from("messages")
      .select("*")
      .or(`sender_id.eq.${user!.id},receiver_id.eq.${user!.id}`)
      .order("created_at", { ascending: false });

    if (!msgs) { setLoading(false); return; }

    // Groupe par listing_id pour créer des conversations
    const convMap = new Map<string, any>();
    for (const msg of msgs) {
      if (!convMap.has(msg.listing_id)) {
        convMap.set(msg.listing_id, msg);
      }
    }

    // Récupère les infos des annonces
    const listingIds = Array.from(convMap.keys());
    if (listingIds.length === 0) { setConversations([]); setLoading(false); return; }

    const { data: listings } = await supabase
      .from("listings")
      .select("id, title, images, user_id")
      .in("id", listingIds);

    const convList = listingIds.map((lid) => {
      const lastMsg = convMap.get(lid);
      const listing = listings?.find((l) => l.id === lid);
      const otherUserId = lastMsg.sender_id === user!.id ? lastMsg.receiver_id : lastMsg.sender_id;
      return {
        id: lid,
        listingId: lid,
        listingTitle: listing?.title ?? "Annonce",
        listingImage: listing?.images?.[0] ?? "",
        otherUserId,
        lastMessage: lastMsg.content,
        lastMessageTime: new Date(lastMsg.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
        unread: 0,
      };
    });

    setConversations(convList);
    setLoading(false);
  };

  if (!user) {
    return (
      <div className="bg-[#F4F6F5] min-h-screen pb-20">
        <AppHeader title={t("messages")} />
        <div className="flex flex-col items-center justify-center h-[70vh] px-8 text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center">
            <MessageCircle className="w-8 h-8 text-[#1B6B3A]" />
          </div>
          <h2 className="text-base font-bold text-gray-900">{t("notLoggedIn")}</h2>
          <p className="text-sm text-gray-500">{t("notLoggedInDesc")}</p>
          <button onClick={() => navigate("/auth")} className="px-8 py-3 bg-[#1B6B3A] text-white rounded-2xl font-semibold text-sm">
            {t("login")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#F4F6F5] min-h-screen pb-20">
      <AppHeader title={t("messages")} />

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-[#1B6B3A] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : conversations.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[70vh] px-8 text-center gap-3">
          <div className="text-5xl">💬</div>
          <h2 className="text-base font-bold text-gray-700">{t("noMessages")}</h2>
          <p className="text-sm text-gray-400">Parcourez les annonces et contactez les vendeurs</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100 bg-white">
          {conversations.map((conv, i) => (
            <motion.div
              key={conv.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => navigate(`/messages/${conv.id}`)}
              className="flex items-center gap-3 px-4 py-3.5 cursor-pointer active:bg-gray-50 transition-colors"
            >
              <div className="relative flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-[#1B6B3A]/20 flex items-center justify-center text-xl">
                  {conv.listingImage ? <img src={conv.listingImage} alt="" className="w-12 h-12 rounded-full object-cover" /> : "💬"}
                </div>
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-sm font-bold text-gray-900 truncate">{conv.listingTitle}</span>
                  <span className="text-[11px] text-gray-400 flex-shrink-0 ml-2">{conv.lastMessageTime}</span>
                </div>
                <p className="text-xs truncate text-gray-500">{conv.lastMessage}</p>
              </div>
              {conv.unread > 0 && (
                <span className="flex-shrink-0 w-5 h-5 bg-[#1B6B3A] rounded-full text-white text-[10px] font-bold flex items-center justify-center">
                  {conv.unread}
                </span>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
