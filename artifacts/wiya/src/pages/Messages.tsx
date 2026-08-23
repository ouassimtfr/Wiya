import { useEffect } from "react";
import { useLocation } from "wouter";
import { MessageCircle, ChevronRight, Mic } from "lucide-react";
import { motion } from "framer-motion";
import { useStore } from "@/lib/store";

export default function MessagesPage() {
  const [, navigate] = useLocation();
  const { user, conversations, fetchConversations } = useStore();

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

  const sortedConversations = [...(conversations || [])].sort((a, b) => {
    const aLast = a.messages?.[a.messages.length - 1]?.time || "";
    const bLast = b.messages?.[b.messages.length - 1]?.time || "";
    return bLast.localeCompare(aLast);
  });

  return (
    <div className="bg-[#F4F6F5] min-h-screen flex flex-col pb-6">
      <div className="bg-white border-b border-gray-100 px-4 py-3 sticky top-0 z-10">
        <h1 className="text-lg font-bold text-gray-900">Messagerie</h1>
      </div>

      {sortedConversations.length === 0 ? (
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
      ) : (
        <div className="flex flex-col divide-y divide-gray-100">
          {sortedConversations.map((conversation, i) => {
            const lastMessage = conversation.messages?.[conversation.messages.length - 1];
            const hasUnread = (conversation.unread ?? 0) > 0;
            const isAudioPreview = lastMessage?.type === "audio";
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
                    {lastMessage?.time && (
                      <span className={`text-[10px] flex-shrink-0 ${hasUnread ? "text-[#1B6B3A] font-semibold" : "text-gray-400"}`}>
                        {lastMessage.time}
                      </span>
                    )}
                  </div>
                  <p className={`text-xs truncate flex items-center gap-1 ${hasUnread ? "text-gray-700 font-medium" : "text-gray-400"}`}>
                    {conversation.otherUser?.name ? `${conversation.otherUser.name} · ` : ""}
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
