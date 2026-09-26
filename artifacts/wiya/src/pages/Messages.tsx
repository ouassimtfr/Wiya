import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { MessageCircle, ChevronRight, Mic, Search } from "lucide-react";
import { motion } from "framer-motion";
import { useStore } from "@/lib/store";

function formatConversationTime(iso?: string): string {
  if (!iso) return "";
  const date = new Date(iso);
  const now = new Date();

  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return "Hier";

  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 7) return date.toLocaleDateString("fr-FR", { weekday: "short" });

  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
}

export default function MessagesPage() {
  const [, navigate] = useLocation();
  const { user, conversations, fetchConversations } = useStore();
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user, fetchConversations]);

  if (!user) {
    return (
      <div className="bg-[#F4F6F5] min-h-screen flex flex-col items-center justify-center p-4">
        <p className="text-gray-500 text-sm mb-4">Connexion requise pour accéder aux messages.</p>
        <button
          onClick={() => navigate("/auth")}
          className="px-4 py-2 bg-[#1B6B3A] text-white rounded-xl text-sm font-semibold"
        >
          Se connecter
        </button>
      </div>
    );
  }

  const sortedConversations = useMemo(() => {
    return [...(conversations || [])].sort((a, b) => {
      const aLast = (a.messages?.[a.messages.length - 1] as any)?.createdAt || "";
      const bLast = (b.messages?.[b.messages.length - 1] as any)?.createdAt || "";
      return bLast.localeCompare(aLast);
    });
  }, [conversations]);

  const filteredConversations = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sortedConversations;
    return sortedConversations.filter((c) => {
      const title = (c.listingTitle || "").toLowerCase();
      const name = (c.otherUser?.name || "").toLowerCase();
      return title.includes(q) || name.includes(q);
    });
  }, [sortedConversations, query]);

  const hasAnyConversation = sortedConversations.length > 0;

  return (
    <div className="bg-[#F4F6F5] min-h-screen flex flex-col pb-6">
      <div className="bg-white border-b border-gray-100 px-4 py-3 sticky top-0 z-10 space-y-2.5">
        <h1 className="text-lg font-bold text-gray-900">Messagerie</h1>
        {hasAnyConversation && (
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher une conversation..."
              className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B6B3A]/20"
            />
          </div>
        )}
      </div>

      {!hasAnyConversation ? (
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="w-20 h-20 rounded-full bg-gradient-to-br from-[#1B6B3A]/15 to-[#1B6B3A]/5 flex items-center justify-center mb-4"
          >
            <MessageCircle className="w-8 h-8 text-[#1B6B3A]" />
          </motion.div>
          <p className="text-sm font-semibold text-gray-700 mb-1">Aucun message pour le moment</p>
          <p className="text-xs text-gray-400 max-w-[220px]">
            Contactez un vendeur depuis une annonce pour démarrer une discussion.
          </p>
        </div>
      ) : filteredConversations.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <p className="text-sm text-gray-400">Aucun résultat pour "{query}"</p>
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-gray-100">
          {filteredConversations.map((conversation, i) => {
            const lastMessage = conversation.messages?.[conversation.messages.length - 1] as any;
            const hasUnread = (conversation.unread ?? 0) > 0;
            const isAudioPreview = lastMessage?.type === "audio";
            const isMePreview = lastMessage?.senderId === "me";
            return (
              <motion.button
                key={conversation.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: Math.min(i * 0.03, 0.3) }}
                whileTap={{ scale: 0.98, backgroundColor: "#F9FAFB" }}
                onClick={() => navigate(`/messages/${conversation.id}`)}
                className="flex items-center gap-3 px-4 py-3 bg-white transition-colors text-left"
              >
                <div className="relative flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-[#1B6B3A]/10 ring-2 ring-white shadow-sm flex items-center justify-center text-xl overflow-hidden">
                    {conversation.listingImage ? (
                      <img src={conversation.listingImage} alt="" className="w-12 h-12 object-cover" />
                    ) : (
                      "💬"
                    )}
                  </div>
                  {hasUnread && (
                    <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[#C8972B] ring-2 ring-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className={`text-sm truncate ${hasUnread ? "font-extrabold text-gray-900" : "font-bold text-gray-900"}`}>
                      {conversation.listingTitle || "Discussion"}
                    </h2>
                    {lastMessage?.createdAt && (
                      <span className={`text-[10px] flex-shrink-0 ${hasUnread ? "text-[#1B6B3A] font-semibold" : "text-gray-400"}`}>
                        {formatConversationTime(lastMessage.createdAt)}
                      </span>
                    )}
                  </div>
                  <p className={`text-xs truncate flex items-center gap-1 ${hasUnread ? "text-gray-700 font-medium" : "text-gray-400"}`}>
                    {conversation.otherUser?.name ? `${conversation.otherUser.name} · ` : ""}
                    {isMePreview && "Vous : "}
                    {isAudioPreview ? (
                      <span className="inline-flex items-center gap-1">
                        <Mic className="w-3 h-3" /> Message vocal
                      </span>
                    ) : (
                      lastMessage?.content || lastMessage?.text || "Nouvelle conversation"
                    )}
                  </p>
                </div>
                {hasUnread ? (
                  <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-[#C8972B] text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0">
                    {conversation.unread}
                  </span>
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                )}
              </motion.button>
            );
          })}
        </div>
      )}
    </div>
  );
}
