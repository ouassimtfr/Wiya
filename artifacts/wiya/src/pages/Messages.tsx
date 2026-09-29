import { useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { MessageCircle, Mic, ChevronRight } from "lucide-react";
import { useStore } from "@/lib/store";

function formatListTime(iso?: string): string {
  if (!iso) return "";
  const date = new Date(iso);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  }
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return "Hier";
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
}

export default function MessagesPage() {
  const [, navigate] = useLocation();
  const { user, conversations, fetchConversations } = useStore();

  useEffect(() => {
    if (user) fetchConversations();
  }, [user, fetchConversations]);

  const sorted = useMemo(() => {
    return [...(conversations as any[])]
      .filter((c) => c.messages && c.messages.length > 0)
      .sort((a, b) => {
        const la = a.messages[a.messages.length - 1]?.createdAt ?? "";
        const lb = b.messages[b.messages.length - 1]?.createdAt ?? "";
        return new Date(lb).getTime() - new Date(la).getTime();
      });
  }, [conversations]);

  if (!user) {
    return (
      <div className="min-h-[100dvh] bg-[#F4F6F5] flex flex-col items-center justify-center p-6 pb-28">
        <p className="text-gray-500 text-center">Connectez-vous pour voir vos messages.</p>
        <button
          onClick={() => navigate("/auth")}
          className="mt-4 px-5 py-2.5 bg-[#1B6B3A] text-white rounded-xl text-sm font-semibold"
        >
          Se connecter
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#F4F6F5] pb-28">
      <div className="bg-white border-b border-gray-100 shadow-sm px-4 pb-4 pt-[calc(env(safe-area-inset-top)+16px)]">
        <h1 className="text-xl font-bold text-gray-900">Messages</h1>
      </div>

      {sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center px-8 pt-24">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#1B6B3A]/15 to-[#C8972B]/15 flex items-center justify-center mb-4">
            <MessageCircle className="w-7 h-7 text-[#1B6B3A]" />
          </div>
          <p className="text-sm font-semibold text-gray-700">Aucune conversation</p>
          <p className="text-xs text-gray-400 mt-1">
            Ouvrez une annonce et contactez le vendeur pour démarrer une discussion.
          </p>
        </div>
      ) : (
        <ul className="px-3 pt-3 flex flex-col gap-2">
          {sorted.map((c) => {
            const last = c.messages[c.messages.length - 1];
            const isAudio = last?.type === "audio";
            const isMine = last?.senderId === "me";
            const preview = isAudio ? "Message vocal" : last?.text || "";

            return (
              <li key={c.id}>
                <button
                  onClick={() => navigate(`/messages/${c.id}`)}
                  className="w-full flex items-center gap-3 bg-white rounded-2xl shadow-sm px-3 py-3 text-left active:bg-gray-50 transition-colors"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#1B6B3A]/20 to-[#C8972B]/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {c.listingImage ? (
                      <img src={c.listingImage} alt="" className="w-12 h-12 object-cover" />
                    ) : (
                      <MessageCircle className="w-5 h-5 text-[#1B6B3A]" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-bold text-gray-900 truncate">{c.listingTitle}</p>
                      <span className="text-[11px] text-gray-400 flex-shrink-0">
                        {formatListTime(last?.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 truncate">{c.otherUser?.name}</p>
                    <p
                      className={`text-xs truncate flex items-center gap-1 ${
                        c.unread > 0 ? "text-gray-900 font-semibold" : "text-gray-400"
                      }`}
                    >
                      {isAudio && <Mic className="w-3 h-3 flex-shrink-0" />}
                      <span className="truncate">
                        {isMine ? "Vous : " : ""}
                        {preview}
                      </span>
                    </p>
                  </div>

                  {c.unread > 0 ? (
                    <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-[#C8972B] text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0">
                      {c.unread}
                    </span>
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
