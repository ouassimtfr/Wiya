import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { MessageCircle, Mic, Search } from "lucide-react";
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
      <div className="bg-white min-h-screen flex flex-col items-center justify-center p-4">
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
  const totalUnread = sortedConversations.reduce((sum, c) => sum + (c.unread ?? 0), 0);

  return (
    <div className="bg-white min-h-screen flex flex-col">
      {/* Header */}
      <div className="px-5 pt-6 pb-4">
        <div className="flex items-baseline gap-2">
          <h1 className="text-2xl font-black text-gray-900">Messages</h1>
          {totalUnread > 0 && (
            <span className="text-xs font-bold text-[#1B6B3A]">{totalUnread} non lu{totalUnread > 1 ? "s" : ""}</span>
          )}
        </div>
      </div>

      {/* Search */}
      {hasAnyConversation && (
        <div className="px-5 pb-4">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" strokeWidth={2.2} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher"
              className="w-full bg-gray-50 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-gray-200 transition-colors"
            />
          </div>
        </div>
      )}

      {!hasAnyConversation ? (
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4">
            <MessageCircle className="w-6 h-6 text-gray-300" strokeWidth={1.5} />
          </div>
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
        <div className="flex-1 flex flex-col">
          {filteredConversations.map((conversation, i) => {
            const lastMessage = conversation.messages?.[conversation.messages.length - 1] as any;
            const hasUnread = (conversation.unread ?? 0) > 0;
            const isAudioPreview = lastMessage?.type === "audio";
            const isMePreview = lastMessage?.senderId === "me";
            return (
              <motion.button
                key={conversation.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.15, delay: Math.min(i * 0.02, 0.2) }}
                whileTap={{ backgroundColor: "#FAFAFA" }}
                onClick={() => navigate(`/messages/${conversation.id}`)}
                className="flex items-center gap-3.5 px-5 py-3.5 text-left border-b border-gray-50 last:border-b-0"
              >
                <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center text-lg overflow-hidden flex-shrink-0">
                  {conversation.listingImage ? (
                    <img src={conversation.listingImage} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <MessageCircle className="w-5 h-5 text-gray-300" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className={`text-[15px] truncate ${hasUnread ? "font-bold text-gray-900" : "font-semibold text-gray-800"}`}>
                      {conversation.listingTitle || "Discussion"}
                    </h2>
                    {lastMessage?.createdAt && (
                      <span className={`text-[11px] flex-shrink-0 ${hasUnread ? "text-[#1B6B3A] font-bold" : "text-gray-400"}`}>
                        {formatConversationTime(lastMessage.createdAt)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <p className={`text-[13px] truncate flex items-center gap-1 ${hasUnread ? "text-gray-600 font-medium" : "text-gray-400"}`}>
                      {conversation.otherUser?.name && (
                        <span className="text-gray-400 font-normal">{conversation.otherUser.name} · </span>
                      )}
                      {isMePreview && "Vous : "}
                      {isAudioPreview ? (
                        <span className="inline-flex items-center gap-1">
                          <Mic className="w-3 h-3" /> Message vocal
                        </span>
                      ) : (
                        lastMessage?.content || lastMessage?.text || "Nouvelle conversation"
                      )}
                    </p>
                    {hasUnread && (
                      <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-[#1B6B3A] text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                        {conversation.unread}
                      </span>
                    )}
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      )}
    </div>
  );
}
