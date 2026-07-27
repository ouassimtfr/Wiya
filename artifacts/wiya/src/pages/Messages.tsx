import { useLocation } from "wouter";
import { MessageCircle, ChevronRight } from "lucide-react";
import { useStore } from "@/lib/store";

export default function MessagesPage() {
  const [, navigate] = useLocation();
  const { user, conversations } = useStore();

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
      {/* Barre du haut */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 sticky top-0 z-10">
        <h1 className="text-lg font-bold text-gray-900">Messagerie</h1>
      </div>

      {/* Liste des conversations */}
      {sortedConversations.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div className="w-16 h-16 rounded-full bg-[#1B6B3A]/10 flex items-center justify-center mb-4">
            <MessageCircle className="w-7 h-7 text-[#1B6B3A]" />
          </div>
          <p className="text-sm font-semibold text-gray-700 mb-1">Aucun message pour le moment</p>
          <p className="text-xs text-gray-400">
            Contactez un vendeur depuis une annonce pour démarrer une discussion.
          </p>
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-gray-100">
          {sortedConversations.map((conversation) => {
            const lastMessage = conversation.messages?.[conversation.messages.length - 1];
            return (
              <button
                key={conversation.id}
                onClick={() => navigate(`/messages/${conversation.id}`)}
                className="flex items-center gap-3 px-4 py-3 bg-white hover:bg-gray-50 transition-colors text-left"
              >
                <div className="w-12 h-12 rounded-full bg-[#1B6B3A]/10 flex items-center justify-center text-xl overflow-hidden flex-shrink-0">
                  {conversation.listingImage ? (
                    <img src={conversation.listingImage} alt="" className="w-12 h-12 object-cover" />
                  ) : (
                    "💬"
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-sm font-bold text-gray-900 truncate">
                      {conversation.listingTitle || "Discussion"}
                    </h2>
                    {lastMessage?.time && (
                      <span className="text-[10px] text-gray-400 flex-shrink-0">{lastMessage.time}</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 truncate">
                    {conversation.otherUser?.name ? `${conversation.otherUser.name} · ` : ""}
                    {lastMessage?.content || lastMessage?.text || "Nouvelle conversation"}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
